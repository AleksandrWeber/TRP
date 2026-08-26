import { describe, expect, it } from 'vitest';
import { MarketDataAdapterFactory } from './market-data-adapter.factory';
import { MarketDataAdapterRegistry } from './market-data-adapter.registry';
import { BinanceOrderBookRetrievalAdapter } from './binance-order-book.adapter';
import { MarketSymbolCache } from './market-symbol.cache';
import { MarketOrderBookCache } from './market-order-book.cache';
import { MarketOrderBookRetrievalAudit } from './market-order-book.audit';
import { MarketOrderBookRetrievalService } from './market-order-book.service';
import { PlannedOrderBookRetrievalAdapter } from './planned-order-book.adapter';
import type {
  OrderBookRetrievalHttpRequest,
  OrderBookRetrievalHttpResponse,
} from './market-order-book.http';
import { MarketOrderBookInvalidDepthError } from './market-order-book.validate';

type ConnectionRow = {
  id: string;
  workspaceId: string;
  provider: string;
  connectionType: string;
  status: string;
};

function memoryPrisma(rows: ConnectionRow[]) {
  return {
    connectionRecord: {
      findFirst: async ({ where }: { where: { id: string; workspaceId: string } }) =>
        rows.find((row) => row.id === where.id && row.workspaceId === where.workspaceId) ?? null,
    },
  };
}

function memoryAudit() {
  const events: Array<{
    outcome: string;
    source: string;
    payload: Record<string, unknown>;
    attribution: Record<string, string>;
  }> = [];
  return {
    events,
    record: async (write: {
      outcome: string;
      source: string;
      payload: Record<string, unknown>;
      attribution: Record<string, string>;
    }) => {
      events.push(write);
    },
  };
}

function httpMock(
  handler: (request: OrderBookRetrievalHttpRequest) => Promise<OrderBookRetrievalHttpResponse>,
) {
  return {
    request: async (input: OrderBookRetrievalHttpRequest) => handler(input),
  };
}

function seedSymbols(cache: MarketSymbolCache, workspaceId: string, connectionId: string) {
  cache.set(workspaceId, connectionId, {
    providerId: 'BINANCE',
    discoveredAt: '2026-08-26T00:00:00.000Z',
    symbols: [
      Object.freeze({
        exchangeSymbol: 'BTCUSDT',
        normalizedSymbol: 'BTC-USDT',
        baseAsset: 'BTC',
        quoteAsset: 'USDT',
        tradingStatus: 'TRADING',
        providerId: 'BINANCE',
      }),
    ],
  });
}

function serviceFor(options: {
  rows: ConnectionRow[];
  audit: ReturnType<typeof memoryAudit>;
  symbolCache?: MarketSymbolCache;
  http?: ReturnType<typeof httpMock>;
}) {
  const registry = new MarketDataAdapterRegistry();
  const factory = new MarketDataAdapterFactory(registry);
  const symbolCache = options.symbolCache ?? new MarketSymbolCache();
  const http =
    options.http ??
    httpMock(async () => ({
      status: 200,
      bodyText: JSON.stringify({
        lastUpdateId: 1,
        bids: [['100.0', '2.0']],
        asks: [['101.0', '3.0']],
      }),
    }));
  return {
    service: new MarketOrderBookRetrievalService(
      memoryPrisma(options.rows) as never,
      factory,
      new MarketOrderBookCache(),
      symbolCache,
      new MarketOrderBookRetrievalAudit(options.audit as never),
      [
        new BinanceOrderBookRetrievalAdapter(http),
        new PlannedOrderBookRetrievalAdapter('BYBIT'),
        new PlannedOrderBookRetrievalAdapter('OKX'),
      ],
      5_000,
    ),
    symbolCache,
  };
}

const connectedBinance = {
  id: 'connection-a',
  workspaceId: 'workspace-a',
  provider: 'BINANCE',
  connectionType: 'EXCHANGE',
  status: 'CONNECTED',
};

describe('Market order book retrieval service (W2-S03-e)', () => {
  it('retrieves a normalized Binance order book snapshot', async () => {
    const audit = memoryAudit();
    const { service, symbolCache } = serviceFor({ rows: [connectedBinance], audit });
    seedSymbols(symbolCache, 'workspace-a', 'connection-a');

    const view = await service.retrieve({
      workspaceId: 'workspace-a',
      actorUserId: 'operator-a',
      connectionId: 'connection-a',
      exchangeSymbol: 'BTCUSDT',
      normalizedSymbol: 'BTC-USDT',
      depthLimit: 20,
    });

    expect(view.outcome).toBe('COMPLETED');
    expect(view.orderBook?.bids[0]?.price).toBe('100.0');
    expect(view.freshness).toBe('UNKNOWN');
    expect(audit.events.map((event) => event.outcome)).toEqual([
      'order_book_retrieval_started',
      'order_book_retrieval_completed',
    ]);
  });

  it('isolates workspace connections', async () => {
    const audit = memoryAudit();
    const { service, symbolCache } = serviceFor({ rows: [connectedBinance], audit });
    seedSymbols(symbolCache, 'workspace-a', 'connection-a');

    await expect(
      service.retrieve({
        workspaceId: 'workspace-b',
        actorUserId: 'operator-b',
        connectionId: 'connection-a',
        exchangeSymbol: 'BTCUSDT',
        normalizedSymbol: 'BTC-USDT',
        depthLimit: 20,
      }),
    ).rejects.toMatchObject({ message: 'Connection not found' });
  });

  it('rejects unsupported depth before retrieval', async () => {
    const audit = memoryAudit();
    const { service } = serviceFor({ rows: [connectedBinance], audit });

    await expect(
      service.retrieve({
        workspaceId: 'workspace-a',
        actorUserId: 'operator-a',
        connectionId: 'connection-a',
        exchangeSymbol: 'BTCUSDT',
        normalizedSymbol: 'BTC-USDT',
        depthLimit: 5,
      }),
    ).rejects.toBeInstanceOf(MarketOrderBookInvalidDepthError);
  });

  it('rejects malformed payloads honestly', async () => {
    const audit = memoryAudit();
    const { service, symbolCache } = serviceFor({
      rows: [connectedBinance],
      audit,
      http: httpMock(async () => ({ status: 200, bodyText: '{not-json' })),
    });
    seedSymbols(symbolCache, 'workspace-a', 'connection-a');

    const view = await service.retrieve({
      workspaceId: 'workspace-a',
      actorUserId: 'operator-a',
      connectionId: 'connection-a',
      exchangeSymbol: 'BTCUSDT',
      normalizedSymbol: 'BTC-USDT',
      depthLimit: 20,
    });
    expect(view.outcome).toBe('FAILED');
    expect(view.orderBook).toBeNull();
    expect(view.freshness).toBe('UNKNOWN');
  });

  it('reports provider unavailable without fabricating a snapshot', async () => {
    const audit = memoryAudit();
    const { service, symbolCache } = serviceFor({
      rows: [connectedBinance],
      audit,
      http: httpMock(async () => ({ status: 503, bodyText: '' })),
    });
    seedSymbols(symbolCache, 'workspace-a', 'connection-a');

    const view = await service.retrieve({
      workspaceId: 'workspace-a',
      actorUserId: 'operator-a',
      connectionId: 'connection-a',
      exchangeSymbol: 'BTCUSDT',
      normalizedSymbol: 'BTC-USDT',
      depthLimit: 20,
    });
    expect(view.outcome).toBe('PROVIDER_UNAVAILABLE');
    expect(view.freshness).toBe('UNAVAILABLE');
    expect(view.orderBook).toBeNull();
  });

  it('reports not implemented for Bybit', async () => {
    const audit = memoryAudit();
    const bybit = {
      id: 'connection-b',
      workspaceId: 'workspace-a',
      provider: 'BYBIT',
      connectionType: 'EXCHANGE',
      status: 'CONNECTED',
    };
    const { service, symbolCache } = serviceFor({ rows: [bybit], audit });
    symbolCache.set('workspace-a', 'connection-b', {
      providerId: 'BYBIT',
      discoveredAt: '2026-08-26T00:00:00.000Z',
      symbols: [
        Object.freeze({
          exchangeSymbol: 'BTCUSDT',
          normalizedSymbol: 'BTC-USDT',
          baseAsset: 'BTC',
          quoteAsset: 'USDT',
          tradingStatus: 'TRADING',
          providerId: 'BYBIT',
        }),
      ],
    });

    const view = await service.retrieve({
      workspaceId: 'workspace-a',
      actorUserId: 'operator-a',
      connectionId: 'connection-b',
      exchangeSymbol: 'BTCUSDT',
      normalizedSymbol: 'BTC-USDT',
      depthLimit: 20,
    });
    expect(view.outcome).toBe('NOT_IMPLEMENTED');
    expect(view.freshness).toBe('UNAVAILABLE');
  });
});
