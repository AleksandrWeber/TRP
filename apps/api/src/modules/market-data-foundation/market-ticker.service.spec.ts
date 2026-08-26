import { describe, expect, it } from 'vitest';
import { MarketDataAdapterFactory } from './market-data-adapter.factory';
import { MarketDataAdapterRegistry } from './market-data-adapter.registry';
import { BinanceTickerRetrievalAdapter } from './binance-ticker.adapter';
import { MarketSymbolCache } from './market-symbol.cache';
import { MarketTickerCache } from './market-ticker.cache';
import { MarketTickerRetrievalAudit } from './market-ticker.audit';
import { MarketTickerRetrievalService } from './market-ticker.service';
import { PlannedTickerRetrievalAdapter } from './planned-ticker.adapter';
import type { TickerRetrievalHttpRequest, TickerRetrievalHttpResponse } from './market-ticker.http';

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
  handler: (request: TickerRetrievalHttpRequest) => Promise<TickerRetrievalHttpResponse>,
) {
  return {
    request: async (input: TickerRetrievalHttpRequest) => handler(input),
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
  const now = Date.now();
  const http =
    options.http ??
    httpMock(async () => ({
      status: 200,
      bodyText: JSON.stringify({
        symbol: 'BTCUSDT',
        lastPrice: '65000.12',
        bidPrice: '64999.00',
        askPrice: '65001.00',
        priceChangePercent: '1.25',
        highPrice: '66000.00',
        lowPrice: '64000.00',
        volume: '1234.5',
        closeTime: now - 1_000,
      }),
    }));
  return {
    service: new MarketTickerRetrievalService(
      memoryPrisma(options.rows) as never,
      factory,
      new MarketTickerCache(),
      symbolCache,
      new MarketTickerRetrievalAudit(options.audit as never),
      [
        new BinanceTickerRetrievalAdapter(http),
        new PlannedTickerRetrievalAdapter('BYBIT'),
        new PlannedTickerRetrievalAdapter('OKX'),
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

describe('Market ticker retrieval service (W2-S03-c)', () => {
  it('retrieves a normalized Binance ticker for a discovered symbol', async () => {
    const audit = memoryAudit();
    const { service, symbolCache } = serviceFor({ rows: [connectedBinance], audit });
    seedSymbols(symbolCache, 'workspace-a', 'connection-a');

    const view = await service.retrieve({
      workspaceId: 'workspace-a',
      actorUserId: 'operator-a',
      connectionId: 'connection-a',
      exchangeSymbol: 'BTCUSDT',
      normalizedSymbol: 'BTC-USDT',
    });

    expect(view.outcome).toBe('COMPLETED');
    expect(view.ticker?.normalizedSymbol).toBe('BTC-USDT');
    expect(view.ticker?.lastPrice).toBe('65000.12');
    expect(view.freshness).toMatch(/FRESH|STALE/);
    expect(audit.events.map((event) => event.outcome)).toEqual([
      'ticker_retrieval_started',
      'ticker_retrieval_completed',
    ]);
  });

  it('isolates workspace connections and rejects foreign connection ids', async () => {
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
      }),
    ).rejects.toMatchObject({ message: 'Connection not found' });
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
    });
    expect(view.outcome).toBe('FAILED');
    expect(view.ticker).toBeNull();
    expect(view.freshness).toBe('UNKNOWN');
    expect(view.failureReason).toContain('Malformed');
  });

  it('reports provider unavailable without fabricating a ticker', async () => {
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
    });
    expect(view.outcome).toBe('PROVIDER_UNAVAILABLE');
    expect(view.freshness).toBe('UNAVAILABLE');
    expect(view.ticker).toBeNull();
  });

  it('reports not implemented for Bybit and OKX', async () => {
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
    });
    expect(view.outcome).toBe('NOT_IMPLEMENTED');
    expect(view.freshness).toBe('UNAVAILABLE');
    expect(view.ticker).toBeNull();
  });

  it('rejects symbols that were not discovered for the connection', async () => {
    const audit = memoryAudit();
    const { service } = serviceFor({ rows: [connectedBinance], audit });

    const view = await service.retrieve({
      workspaceId: 'workspace-a',
      actorUserId: 'operator-a',
      connectionId: 'connection-a',
      exchangeSymbol: 'BTCUSDT',
      normalizedSymbol: 'BTC-USDT',
    });
    expect(view.outcome).toBe('FAILED');
    expect(view.failureReason).toContain('load symbols first');
  });
});
