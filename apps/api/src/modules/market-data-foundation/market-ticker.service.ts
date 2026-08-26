import { Inject, Injectable, NotFoundException, Optional } from '@nestjs/common';
import { PrismaService } from '../../storage/prisma/prisma.module';
import { hasMarketDataProviderCapability } from './market-data-provider-capabilities';
import { MarketDataAdapterFactory } from './market-data-adapter.factory';
import { MarketTickerCache } from './market-ticker.cache';
import { MarketTickerRetrievalAudit } from './market-ticker.audit';
import {
  DEFAULT_TICKER_RETRIEVAL_TIMEOUT_MS,
  TICKER_RETRIEVAL_TIMEOUT_MS,
} from './market-ticker.http';
import { projectTickerRetrieval, type MarketTickerRetrievalView } from './market-ticker.projection';
import {
  MARKET_DATA_TICKER_RETRIEVAL_ADAPTERS,
  type MarketTickerRetrievalAdapter,
  type MarketTickerRetrievalAdapterResult,
} from './market-ticker.retrieval';
import {
  MarketTickerInvalidSymbolError,
  MarketTickerMalformedPayloadError,
  MarketTickerValidationError,
  validateAndNormalizeTicker,
  validateTickerSymbolRequest,
} from './market-ticker.validate';
import type { MarketTickerFreshness } from './market-ticker';
import { MarketSymbolCache } from './market-symbol.cache';

export type MarketTickerRetrievalRequest = Readonly<{
  workspaceId: string;
  actorUserId: string;
  connectionId: string;
  exchangeSymbol: string;
  normalizedSymbol: string;
}>;

/**
 * Market ticker retrieval orchestration (W2-S03-c).
 *
 * Scoped through the authenticated workspace exchange connection. Retrieves,
 * normalizes, validates, caches, and projects ticker only. Does not retrieve
 * candles, order book, trades, balances, or positions.
 */
@Injectable()
export class MarketTickerRetrievalService {
  private readonly adapters: ReadonlyMap<string, MarketTickerRetrievalAdapter>;
  private readonly timeoutMs: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly factory: MarketDataAdapterFactory,
    private readonly tickerCache: MarketTickerCache,
    private readonly symbolCache: MarketSymbolCache,
    private readonly audit: MarketTickerRetrievalAudit,
    @Inject(MARKET_DATA_TICKER_RETRIEVAL_ADAPTERS)
    adapters: readonly MarketTickerRetrievalAdapter[],
    @Optional() @Inject(TICKER_RETRIEVAL_TIMEOUT_MS) timeoutMs?: number,
  ) {
    this.adapters = new Map(adapters.map((adapter) => [adapter.providerId, adapter]));
    this.timeoutMs = timeoutMs ?? DEFAULT_TICKER_RETRIEVAL_TIMEOUT_MS;
  }

  cached(
    workspaceId: string,
    connectionId: string,
    exchangeSymbol: string,
  ): MarketTickerRetrievalView | null {
    const symbol = exchangeSymbol.trim().toUpperCase();
    const entry = this.tickerCache.get(workspaceId, connectionId, symbol);
    if (!entry) {
      return null;
    }
    return projectTickerRetrieval({
      connectionId,
      providerId: entry.providerId,
      exchangeSymbol: entry.exchangeSymbol,
      ticker: entry.ticker,
      freshness: entry.ticker.freshness,
      outcome: 'COMPLETED',
      failureReason: null,
    });
  }

  clear(workspaceId: string, connectionId: string, exchangeSymbol: string): void {
    this.tickerCache.clear(workspaceId, connectionId, exchangeSymbol);
  }

  async retrieve(input: MarketTickerRetrievalRequest): Promise<MarketTickerRetrievalView> {
    let symbols: { exchangeSymbol: string; normalizedSymbol: string };
    try {
      symbols = validateTickerSymbolRequest({
        exchangeSymbol: input.exchangeSymbol,
        normalizedSymbol: input.normalizedSymbol,
      });
    } catch (error) {
      if (error instanceof MarketTickerInvalidSymbolError) {
        throw error;
      }
      throw new MarketTickerInvalidSymbolError();
    }

    const connection = await this.prisma.connectionRecord.findFirst({
      where: { id: input.connectionId, workspaceId: input.workspaceId },
    });
    if (!connection) {
      throw new NotFoundException('Connection not found');
    }
    if (connection.connectionType !== 'EXCHANGE') {
      throw new NotFoundException('Exchange connection not found');
    }

    const providerId = connection.provider;
    await this.audit.record({
      outcome: 'ticker_retrieval_started',
      workspaceId: input.workspaceId,
      actorUserId: input.actorUserId,
      connectionId: input.connectionId,
      provider: providerId,
      exchangeSymbol: symbols.exchangeSymbol,
    });

    const retrievalTimestamp = new Date().toISOString();

    try {
      this.assertSymbolKnown(input.workspaceId, input.connectionId, symbols);

      if (connection.status !== 'CONNECTED') {
        return await this.fail(
          input,
          providerId,
          symbols.exchangeSymbol,
          'FAILED',
          'Connection is not Connected',
        );
      }

      const marketAdapter = this.factory.tryResolve(providerId);
      if (!marketAdapter) {
        return await this.fail(
          input,
          providerId,
          symbols.exchangeSymbol,
          'FAILED',
          'Unknown market data provider',
        );
      }
      const contract = marketAdapter.describe();
      if (!hasMarketDataProviderCapability(contract.capabilities, 'TICKER')) {
        return await this.fail(
          input,
          providerId,
          symbols.exchangeSymbol,
          'FAILED',
          'Provider does not declare Ticker capability',
        );
      }

      const adapter = this.adapters.get(providerId);
      if (!adapter || !adapter.implemented) {
        return await this.fail(
          input,
          providerId,
          symbols.exchangeSymbol,
          'NOT_IMPLEMENTED',
          'Ticker retrieval is not implemented for this provider',
        );
      }

      const adapterResult = await this.executeAdapter(adapter, symbols.exchangeSymbol);
      return await this.projectAdapterResult(
        input,
        providerId,
        symbols,
        retrievalTimestamp,
        adapterResult,
      );
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      if (error instanceof MarketTickerInvalidSymbolError) {
        return await this.fail(input, providerId, symbols.exchangeSymbol, 'FAILED', error.message);
      }
      if (
        error instanceof MarketTickerValidationError ||
        error instanceof MarketTickerMalformedPayloadError
      ) {
        return await this.fail(input, providerId, symbols.exchangeSymbol, 'FAILED', error.message);
      }
      return await this.fail(
        input,
        providerId,
        symbols.exchangeSymbol,
        'FAILED',
        'Ticker retrieval failed',
      );
    }
  }

  private assertSymbolKnown(
    workspaceId: string,
    connectionId: string,
    symbols: { exchangeSymbol: string; normalizedSymbol: string },
  ): void {
    const cached = this.symbolCache.get(workspaceId, connectionId);
    if (!cached) {
      throw new MarketTickerInvalidSymbolError(
        'Symbol is not available for this connection; load symbols first',
      );
    }
    const match = cached.symbols.find(
      (symbol) =>
        symbol.exchangeSymbol === symbols.exchangeSymbol &&
        symbol.normalizedSymbol === symbols.normalizedSymbol,
    );
    if (!match) {
      throw new MarketTickerInvalidSymbolError('Symbol is not valid for this connection');
    }
  }

  private async executeAdapter(
    adapter: MarketTickerRetrievalAdapter,
    exchangeSymbol: string,
  ): Promise<MarketTickerRetrievalAdapterResult> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const result = await adapter.retrieve({
        exchangeSymbol,
        nowMs: Date.now(),
        signal: controller.signal,
      });
      if (controller.signal.aborted) {
        return { kind: 'failed' };
      }
      return result;
    } finally {
      clearTimeout(timer);
    }
  }

  private async projectAdapterResult(
    input: MarketTickerRetrievalRequest,
    providerId: string,
    symbols: { exchangeSymbol: string; normalizedSymbol: string },
    retrievalTimestamp: string,
    result: MarketTickerRetrievalAdapterResult,
  ): Promise<MarketTickerRetrievalView> {
    switch (result.kind) {
      case 'retrieved': {
        if (!result.observation) {
          return this.fail(
            input,
            providerId,
            symbols.exchangeSymbol,
            'FAILED',
            'Malformed provider ticker payload',
          );
        }
        if (result.observation.exchangeSymbol.toUpperCase() !== symbols.exchangeSymbol) {
          return this.fail(
            input,
            providerId,
            symbols.exchangeSymbol,
            'FAILED',
            'Provider ticker symbol mismatch',
          );
        }
        const ticker = validateAndNormalizeTicker({
          providerId,
          normalizedSymbol: symbols.normalizedSymbol,
          observation: result.observation,
          retrievalTimestamp,
        });
        this.tickerCache.set(input.workspaceId, input.connectionId, symbols.exchangeSymbol, {
          providerId,
          exchangeSymbol: symbols.exchangeSymbol,
          retrievedAt: retrievalTimestamp,
          ticker,
        });
        const view = projectTickerRetrieval({
          connectionId: input.connectionId,
          providerId,
          exchangeSymbol: symbols.exchangeSymbol,
          ticker,
          freshness: ticker.freshness,
          outcome: 'COMPLETED',
          failureReason: null,
        });
        await this.audit.record({
          outcome: 'ticker_retrieval_completed',
          workspaceId: input.workspaceId,
          actorUserId: input.actorUserId,
          connectionId: input.connectionId,
          provider: providerId,
          exchangeSymbol: symbols.exchangeSymbol,
        });
        return view;
      }
      case 'not_implemented':
        return this.fail(
          input,
          providerId,
          symbols.exchangeSymbol,
          'NOT_IMPLEMENTED',
          'Ticker retrieval is not implemented for this provider',
        );
      case 'provider_unavailable':
        return this.fail(
          input,
          providerId,
          symbols.exchangeSymbol,
          'PROVIDER_UNAVAILABLE',
          'Provider unavailable',
        );
      case 'malformed':
        return this.fail(
          input,
          providerId,
          symbols.exchangeSymbol,
          'FAILED',
          'Malformed provider ticker payload',
        );
      case 'failed':
        return this.fail(
          input,
          providerId,
          symbols.exchangeSymbol,
          'FAILED',
          'Ticker retrieval failed',
        );
    }
  }

  private async fail(
    input: MarketTickerRetrievalRequest,
    providerId: string,
    exchangeSymbol: string,
    outcome: Exclude<MarketTickerRetrievalView['outcome'], 'COMPLETED'>,
    failureReason: string,
  ): Promise<MarketTickerRetrievalView> {
    this.tickerCache.clear(input.workspaceId, input.connectionId, exchangeSymbol);
    const freshness: MarketTickerFreshness =
      outcome === 'PROVIDER_UNAVAILABLE' || outcome === 'NOT_IMPLEMENTED'
        ? 'UNAVAILABLE'
        : 'UNKNOWN';
    const view = projectTickerRetrieval({
      connectionId: input.connectionId,
      providerId,
      exchangeSymbol,
      ticker: null,
      freshness,
      outcome,
      failureReason,
    });
    await this.audit
      .record({
        outcome: 'ticker_retrieval_failed',
        workspaceId: input.workspaceId,
        actorUserId: input.actorUserId,
        connectionId: input.connectionId,
        provider: providerId,
        exchangeSymbol,
        failureReason,
      })
      .catch(() => undefined);
    return view;
  }
}
