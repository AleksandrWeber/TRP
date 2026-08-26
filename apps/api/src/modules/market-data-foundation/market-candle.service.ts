import { Inject, Injectable, NotFoundException, Optional } from '@nestjs/common';
import { PrismaService } from '../../storage/prisma/prisma.module';
import { hasMarketDataProviderCapability } from './market-data-provider-capabilities';
import { MarketDataAdapterFactory } from './market-data-adapter.factory';
import { MarketCandleCache } from './market-candle.cache';
import { MarketCandleRetrievalAudit } from './market-candle.audit';
import {
  DEFAULT_CANDLE_RETRIEVAL_TIMEOUT_MS,
  CANDLE_RETRIEVAL_TIMEOUT_MS,
} from './market-candle.http';
import { projectCandleRetrieval, type MarketCandleRetrievalView } from './market-candle.projection';
import {
  MARKET_DATA_CANDLE_RETRIEVAL_ADAPTERS,
  type MarketCandleRetrievalAdapter,
  type MarketCandleRetrievalAdapterResult,
} from './market-candle.retrieval';
import {
  MarketCandleDuplicateTimestampError,
  MarketCandleInvalidIntervalError,
  MarketCandleInvalidRangeError,
  MarketCandleInvalidSymbolError,
  MarketCandleMalformedPayloadError,
  MarketCandleValidationError,
  validateAndNormalizeCandles,
  validateCandleRetrievalRequest,
} from './market-candle.validate';
import type { MarketCandleFreshness, MarketCandleInterval } from './market-candle';
import { MarketSymbolCache } from './market-symbol.cache';

export type MarketCandleRetrievalRequest = Readonly<{
  workspaceId: string;
  actorUserId: string;
  connectionId: string;
  exchangeSymbol: string;
  normalizedSymbol: string;
  interval: string;
  rangeStart: string;
  rangeEnd: string;
}>;

/**
 * Market candlestick retrieval orchestration (W2-S03-d).
 *
 * Scoped through the authenticated workspace exchange connection. Retrieves,
 * normalizes, validates, caches, and projects historical OHLCV only. Does not
 * retrieve order book, trades stream, balances, or positions.
 */
@Injectable()
export class MarketCandleRetrievalService {
  private readonly adapters: ReadonlyMap<string, MarketCandleRetrievalAdapter>;
  private readonly timeoutMs: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly factory: MarketDataAdapterFactory,
    private readonly candleCache: MarketCandleCache,
    private readonly symbolCache: MarketSymbolCache,
    private readonly audit: MarketCandleRetrievalAudit,
    @Inject(MARKET_DATA_CANDLE_RETRIEVAL_ADAPTERS)
    adapters: readonly MarketCandleRetrievalAdapter[],
    @Optional() @Inject(CANDLE_RETRIEVAL_TIMEOUT_MS) timeoutMs?: number,
  ) {
    this.adapters = new Map(adapters.map((adapter) => [adapter.providerId, adapter]));
    this.timeoutMs = timeoutMs ?? DEFAULT_CANDLE_RETRIEVAL_TIMEOUT_MS;
  }

  cached(
    workspaceId: string,
    connectionId: string,
    exchangeSymbol: string,
    interval: MarketCandleInterval,
    rangeStart: string,
    rangeEnd: string,
  ): MarketCandleRetrievalView | null {
    const entry = this.candleCache.get(
      workspaceId,
      connectionId,
      exchangeSymbol,
      interval,
      rangeStart,
      rangeEnd,
    );
    if (!entry) {
      return null;
    }
    return projectCandleRetrieval({
      connectionId,
      providerId: entry.providerId,
      exchangeSymbol: entry.exchangeSymbol,
      interval: entry.interval,
      rangeStart: entry.rangeStart,
      rangeEnd: entry.rangeEnd,
      candles: entry.candles,
      freshness: entry.freshness,
      outcome: 'COMPLETED',
      failureReason: null,
    });
  }

  async retrieve(input: MarketCandleRetrievalRequest): Promise<MarketCandleRetrievalView> {
    let request: ReturnType<typeof validateCandleRetrievalRequest>;
    try {
      request = validateCandleRetrievalRequest({
        exchangeSymbol: input.exchangeSymbol,
        normalizedSymbol: input.normalizedSymbol,
        interval: input.interval,
        rangeStart: input.rangeStart,
        rangeEnd: input.rangeEnd,
      });
    } catch (error) {
      if (
        error instanceof MarketCandleInvalidSymbolError ||
        error instanceof MarketCandleInvalidIntervalError ||
        error instanceof MarketCandleInvalidRangeError
      ) {
        throw error;
      }
      throw new MarketCandleInvalidRangeError();
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
      outcome: 'candlestick_retrieval_started',
      workspaceId: input.workspaceId,
      actorUserId: input.actorUserId,
      connectionId: input.connectionId,
      provider: providerId,
      exchangeSymbol: request.exchangeSymbol,
      interval: request.interval,
    });

    const retrievalTimestamp = new Date().toISOString();

    try {
      this.assertSymbolKnown(input.workspaceId, input.connectionId, request);

      if (connection.status !== 'CONNECTED') {
        return await this.fail(input, providerId, request, 'FAILED', 'Connection is not Connected');
      }

      const marketAdapter = this.factory.tryResolve(providerId);
      if (!marketAdapter) {
        return await this.fail(
          input,
          providerId,
          request,
          'FAILED',
          'Unknown market data provider',
        );
      }
      const contract = marketAdapter.describe();
      if (!hasMarketDataProviderCapability(contract.capabilities, 'CANDLES')) {
        return await this.fail(
          input,
          providerId,
          request,
          'FAILED',
          'Provider does not declare Candles capability',
        );
      }

      const adapter = this.adapters.get(providerId);
      if (!adapter || !adapter.implemented) {
        return await this.fail(
          input,
          providerId,
          request,
          'NOT_IMPLEMENTED',
          'Candlestick retrieval is not implemented for this provider',
        );
      }

      const adapterResult = await this.executeAdapter(adapter, request);
      return await this.projectAdapterResult(
        input,
        providerId,
        request,
        retrievalTimestamp,
        adapterResult,
      );
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      if (
        error instanceof MarketCandleInvalidSymbolError ||
        error instanceof MarketCandleInvalidIntervalError ||
        error instanceof MarketCandleInvalidRangeError
      ) {
        return await this.fail(input, providerId, request, 'FAILED', error.message);
      }
      if (
        error instanceof MarketCandleValidationError ||
        error instanceof MarketCandleMalformedPayloadError ||
        error instanceof MarketCandleDuplicateTimestampError
      ) {
        return await this.fail(input, providerId, request, 'FAILED', error.message);
      }
      return await this.fail(input, providerId, request, 'FAILED', 'Candlestick retrieval failed');
    }
  }

  private assertSymbolKnown(
    workspaceId: string,
    connectionId: string,
    request: { exchangeSymbol: string; normalizedSymbol: string },
  ): void {
    const cached = this.symbolCache.get(workspaceId, connectionId);
    if (!cached) {
      throw new MarketCandleInvalidSymbolError(
        'Symbol is not available for this connection; load symbols first',
      );
    }
    const match = cached.symbols.find(
      (symbol) =>
        symbol.exchangeSymbol === request.exchangeSymbol &&
        symbol.normalizedSymbol === request.normalizedSymbol,
    );
    if (!match) {
      throw new MarketCandleInvalidSymbolError('Symbol is not valid for this connection');
    }
  }

  private async executeAdapter(
    adapter: MarketCandleRetrievalAdapter,
    request: ReturnType<typeof validateCandleRetrievalRequest>,
  ): Promise<MarketCandleRetrievalAdapterResult> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const result = await adapter.retrieve({
        exchangeSymbol: request.exchangeSymbol,
        interval: request.interval,
        rangeStartMs: request.rangeStartMs,
        rangeEndMs: request.rangeEndMs,
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
    input: MarketCandleRetrievalRequest,
    providerId: string,
    request: ReturnType<typeof validateCandleRetrievalRequest>,
    retrievalTimestamp: string,
    result: MarketCandleRetrievalAdapterResult,
  ): Promise<MarketCandleRetrievalView> {
    switch (result.kind) {
      case 'retrieved': {
        if (!result.observations) {
          return this.fail(
            input,
            providerId,
            request,
            'FAILED',
            'Malformed provider candlestick payload',
          );
        }
        const { candles, freshness } = validateAndNormalizeCandles({
          providerId,
          normalizedSymbol: request.normalizedSymbol,
          interval: request.interval,
          observations: result.observations,
          retrievalTimestamp,
        });
        this.candleCache.set(
          input.workspaceId,
          input.connectionId,
          request.exchangeSymbol,
          request.interval,
          request.rangeStart,
          request.rangeEnd,
          {
            providerId,
            exchangeSymbol: request.exchangeSymbol,
            interval: request.interval,
            rangeStart: request.rangeStart,
            rangeEnd: request.rangeEnd,
            retrievedAt: retrievalTimestamp,
            freshness,
            candles,
          },
        );
        const view = projectCandleRetrieval({
          connectionId: input.connectionId,
          providerId,
          exchangeSymbol: request.exchangeSymbol,
          interval: request.interval,
          rangeStart: request.rangeStart,
          rangeEnd: request.rangeEnd,
          candles,
          freshness,
          outcome: 'COMPLETED',
          failureReason: null,
        });
        await this.audit.record({
          outcome: 'candlestick_retrieval_completed',
          workspaceId: input.workspaceId,
          actorUserId: input.actorUserId,
          connectionId: input.connectionId,
          provider: providerId,
          exchangeSymbol: request.exchangeSymbol,
          interval: request.interval,
        });
        return view;
      }
      case 'not_implemented':
        return this.fail(
          input,
          providerId,
          request,
          'NOT_IMPLEMENTED',
          'Candlestick retrieval is not implemented for this provider',
        );
      case 'provider_unavailable':
        return this.fail(
          input,
          providerId,
          request,
          'PROVIDER_UNAVAILABLE',
          'Provider unavailable',
        );
      case 'malformed':
        return this.fail(
          input,
          providerId,
          request,
          'FAILED',
          'Malformed provider candlestick payload',
        );
      case 'failed':
        return this.fail(input, providerId, request, 'FAILED', 'Candlestick retrieval failed');
    }
  }

  private async fail(
    input: MarketCandleRetrievalRequest,
    providerId: string,
    request: ReturnType<typeof validateCandleRetrievalRequest>,
    outcome: Exclude<MarketCandleRetrievalView['outcome'], 'COMPLETED'>,
    failureReason: string,
  ): Promise<MarketCandleRetrievalView> {
    this.candleCache.clear(
      input.workspaceId,
      input.connectionId,
      request.exchangeSymbol,
      request.interval,
      request.rangeStart,
      request.rangeEnd,
    );
    const freshness: MarketCandleFreshness =
      outcome === 'PROVIDER_UNAVAILABLE' || outcome === 'NOT_IMPLEMENTED'
        ? 'UNAVAILABLE'
        : 'UNKNOWN';
    const view = projectCandleRetrieval({
      connectionId: input.connectionId,
      providerId,
      exchangeSymbol: request.exchangeSymbol,
      interval: request.interval,
      rangeStart: request.rangeStart,
      rangeEnd: request.rangeEnd,
      candles: [],
      freshness,
      outcome,
      failureReason,
    });
    await this.audit
      .record({
        outcome: 'candlestick_retrieval_failed',
        workspaceId: input.workspaceId,
        actorUserId: input.actorUserId,
        connectionId: input.connectionId,
        provider: providerId,
        exchangeSymbol: request.exchangeSymbol,
        interval: request.interval,
        failureReason,
      })
      .catch(() => undefined);
    return view;
  }
}
