import { Inject, Injectable, NotFoundException, Optional } from '@nestjs/common';
import { PrismaService } from '../../storage/prisma/prisma.module';
import { hasMarketDataProviderCapability } from './market-data-provider-capabilities';
import { MarketDataAdapterFactory } from './market-data-adapter.factory';
import { MarketOrderBookCache } from './market-order-book.cache';
import { MarketOrderBookRetrievalAudit } from './market-order-book.audit';
import {
  DEFAULT_ORDER_BOOK_RETRIEVAL_TIMEOUT_MS,
  ORDER_BOOK_RETRIEVAL_TIMEOUT_MS,
} from './market-order-book.http';
import {
  projectOrderBookRetrieval,
  type MarketOrderBookRetrievalView,
} from './market-order-book.projection';
import {
  MARKET_DATA_ORDER_BOOK_RETRIEVAL_ADAPTERS,
  type MarketOrderBookRetrievalAdapter,
  type MarketOrderBookRetrievalAdapterResult,
} from './market-order-book.retrieval';
import {
  MarketOrderBookDuplicatePriceError,
  MarketOrderBookInvalidDepthError,
  MarketOrderBookInvalidSymbolError,
  MarketOrderBookMalformedPayloadError,
  MarketOrderBookValidationError,
  validateAndNormalizeOrderBook,
  validateOrderBookRetrievalRequest,
} from './market-order-book.validate';
import type { MarketOrderBookDepth, MarketOrderBookFreshness } from './market-order-book';
import { MarketSymbolCache } from './market-symbol.cache';

export type MarketOrderBookRetrievalRequest = Readonly<{
  workspaceId: string;
  actorUserId: string;
  connectionId: string;
  exchangeSymbol: string;
  normalizedSymbol: string;
  depthLimit: number;
}>;

/**
 * Market order book snapshot retrieval orchestration (W2-S03-e).
 *
 * Scoped through the authenticated workspace exchange connection. Retrieves,
 * normalizes, validates, caches, and projects order book snapshots only.
 * Does not retrieve trades, streaming depth, balances, or positions.
 */
@Injectable()
export class MarketOrderBookRetrievalService {
  private readonly adapters: ReadonlyMap<string, MarketOrderBookRetrievalAdapter>;
  private readonly timeoutMs: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly factory: MarketDataAdapterFactory,
    private readonly orderBookCache: MarketOrderBookCache,
    private readonly symbolCache: MarketSymbolCache,
    private readonly audit: MarketOrderBookRetrievalAudit,
    @Inject(MARKET_DATA_ORDER_BOOK_RETRIEVAL_ADAPTERS)
    adapters: readonly MarketOrderBookRetrievalAdapter[],
    @Optional() @Inject(ORDER_BOOK_RETRIEVAL_TIMEOUT_MS) timeoutMs?: number,
  ) {
    this.adapters = new Map(adapters.map((adapter) => [adapter.providerId, adapter]));
    this.timeoutMs = timeoutMs ?? DEFAULT_ORDER_BOOK_RETRIEVAL_TIMEOUT_MS;
  }

  cached(
    workspaceId: string,
    connectionId: string,
    exchangeSymbol: string,
    depthLimit: MarketOrderBookDepth,
  ): MarketOrderBookRetrievalView | null {
    const entry = this.orderBookCache.get(workspaceId, connectionId, exchangeSymbol, depthLimit);
    if (!entry) {
      return null;
    }
    return projectOrderBookRetrieval({
      connectionId,
      providerId: entry.providerId,
      exchangeSymbol: entry.exchangeSymbol,
      depthLimit: entry.depthLimit,
      orderBook: entry.orderBook,
      freshness: entry.freshness,
      outcome: 'COMPLETED',
      failureReason: null,
    });
  }

  async retrieve(input: MarketOrderBookRetrievalRequest): Promise<MarketOrderBookRetrievalView> {
    let request: ReturnType<typeof validateOrderBookRetrievalRequest>;
    try {
      request = validateOrderBookRetrievalRequest({
        exchangeSymbol: input.exchangeSymbol,
        normalizedSymbol: input.normalizedSymbol,
        depthLimit: input.depthLimit,
      });
    } catch (error) {
      if (
        error instanceof MarketOrderBookInvalidSymbolError ||
        error instanceof MarketOrderBookInvalidDepthError
      ) {
        throw error;
      }
      throw new MarketOrderBookInvalidDepthError();
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
      outcome: 'order_book_retrieval_started',
      workspaceId: input.workspaceId,
      actorUserId: input.actorUserId,
      connectionId: input.connectionId,
      provider: providerId,
      exchangeSymbol: request.exchangeSymbol,
      depthLimit: request.depthLimit,
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
      if (!hasMarketDataProviderCapability(contract.capabilities, 'ORDER_BOOK')) {
        return await this.fail(
          input,
          providerId,
          request,
          'FAILED',
          'Provider does not declare Order Book capability',
        );
      }

      const adapter = this.adapters.get(providerId);
      if (!adapter || !adapter.implemented) {
        return await this.fail(
          input,
          providerId,
          request,
          'NOT_IMPLEMENTED',
          'Order book retrieval is not implemented for this provider',
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
        error instanceof MarketOrderBookInvalidSymbolError ||
        error instanceof MarketOrderBookInvalidDepthError
      ) {
        return await this.fail(input, providerId, request, 'FAILED', error.message);
      }
      if (
        error instanceof MarketOrderBookValidationError ||
        error instanceof MarketOrderBookMalformedPayloadError ||
        error instanceof MarketOrderBookDuplicatePriceError
      ) {
        return await this.fail(input, providerId, request, 'FAILED', error.message);
      }
      return await this.fail(input, providerId, request, 'FAILED', 'Order book retrieval failed');
    }
  }

  private assertSymbolKnown(
    workspaceId: string,
    connectionId: string,
    request: { exchangeSymbol: string; normalizedSymbol: string },
  ): void {
    const cached = this.symbolCache.get(workspaceId, connectionId);
    if (!cached) {
      throw new MarketOrderBookInvalidSymbolError(
        'Symbol is not available for this connection; load symbols first',
      );
    }
    const match = cached.symbols.find(
      (symbol) =>
        symbol.exchangeSymbol === request.exchangeSymbol &&
        symbol.normalizedSymbol === request.normalizedSymbol,
    );
    if (!match) {
      throw new MarketOrderBookInvalidSymbolError('Symbol is not valid for this connection');
    }
  }

  private async executeAdapter(
    adapter: MarketOrderBookRetrievalAdapter,
    request: ReturnType<typeof validateOrderBookRetrievalRequest>,
  ): Promise<MarketOrderBookRetrievalAdapterResult> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const result = await adapter.retrieve({
        exchangeSymbol: request.exchangeSymbol,
        depthLimit: request.depthLimit,
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
    input: MarketOrderBookRetrievalRequest,
    providerId: string,
    request: ReturnType<typeof validateOrderBookRetrievalRequest>,
    retrievalTimestamp: string,
    result: MarketOrderBookRetrievalAdapterResult,
  ): Promise<MarketOrderBookRetrievalView> {
    switch (result.kind) {
      case 'retrieved': {
        if (!result.snapshot) {
          return this.fail(
            input,
            providerId,
            request,
            'FAILED',
            'Malformed provider order book payload',
          );
        }
        if (result.snapshot.exchangeSymbol.toUpperCase() !== request.exchangeSymbol) {
          return this.fail(
            input,
            providerId,
            request,
            'FAILED',
            'Provider order book symbol mismatch',
          );
        }
        const orderBook = validateAndNormalizeOrderBook({
          providerId,
          normalizedSymbol: request.normalizedSymbol,
          depthLimit: request.depthLimit,
          snapshot: result.snapshot,
          retrievalTimestamp,
        });
        this.orderBookCache.set(
          input.workspaceId,
          input.connectionId,
          request.exchangeSymbol,
          request.depthLimit,
          {
            providerId,
            exchangeSymbol: request.exchangeSymbol,
            depthLimit: request.depthLimit,
            retrievedAt: retrievalTimestamp,
            freshness: orderBook.freshness,
            orderBook,
          },
        );
        const view = projectOrderBookRetrieval({
          connectionId: input.connectionId,
          providerId,
          exchangeSymbol: request.exchangeSymbol,
          depthLimit: request.depthLimit,
          orderBook,
          freshness: orderBook.freshness,
          outcome: 'COMPLETED',
          failureReason: null,
        });
        await this.audit.record({
          outcome: 'order_book_retrieval_completed',
          workspaceId: input.workspaceId,
          actorUserId: input.actorUserId,
          connectionId: input.connectionId,
          provider: providerId,
          exchangeSymbol: request.exchangeSymbol,
          depthLimit: request.depthLimit,
        });
        return view;
      }
      case 'not_implemented':
        return this.fail(
          input,
          providerId,
          request,
          'NOT_IMPLEMENTED',
          'Order book retrieval is not implemented for this provider',
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
          'Malformed provider order book payload',
        );
      case 'failed':
        return this.fail(input, providerId, request, 'FAILED', 'Order book retrieval failed');
    }
  }

  private async fail(
    input: MarketOrderBookRetrievalRequest,
    providerId: string,
    request: ReturnType<typeof validateOrderBookRetrievalRequest>,
    outcome: Exclude<MarketOrderBookRetrievalView['outcome'], 'COMPLETED'>,
    failureReason: string,
  ): Promise<MarketOrderBookRetrievalView> {
    this.orderBookCache.clear(
      input.workspaceId,
      input.connectionId,
      request.exchangeSymbol,
      request.depthLimit,
    );
    const freshness: MarketOrderBookFreshness =
      outcome === 'PROVIDER_UNAVAILABLE' || outcome === 'NOT_IMPLEMENTED'
        ? 'UNAVAILABLE'
        : 'UNKNOWN';
    const view = projectOrderBookRetrieval({
      connectionId: input.connectionId,
      providerId,
      exchangeSymbol: request.exchangeSymbol,
      depthLimit: request.depthLimit,
      orderBook: null,
      freshness,
      outcome,
      failureReason,
    });
    await this.audit
      .record({
        outcome: 'order_book_retrieval_failed',
        workspaceId: input.workspaceId,
        actorUserId: input.actorUserId,
        connectionId: input.connectionId,
        provider: providerId,
        exchangeSymbol: request.exchangeSymbol,
        depthLimit: request.depthLimit,
        failureReason,
      })
      .catch(() => undefined);
    return view;
  }
}
