import { describe, expect, it } from 'vitest';
import { MarketDataAdapterFactory } from './market-data-adapter.factory';
import { MarketDataAdapterRegistry } from './market-data-adapter.registry';
import { BinanceCandleRetrievalAdapter } from './binance-candle.adapter';
import { MarketSymbolCache } from './market-symbol.cache';
import { MarketCandleCache } from './market-candle.cache';
import { MarketCandleRetrievalAudit } from './market-candle.audit';
import { MarketCandleRetrievalService } from './market-candle.service';
import { PlannedCandleRetrievalAdapter } from './planned-candle.adapter';
import type { CandleRetrievalHttpRequest, CandleRetrievalHttpResponse } from './market-candle.http';
import { MarketCandleInvalidIntervalError } from './market-candle.validate';

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
  handler: (request: CandleRetrievalHttpRequest) => Promise<CandleRetrievalHttpResponse>,
) {
  return {
    request: async (input: CandleRetrievalHttpRequest) => handler(input),
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
  const openMs = Date.parse('2026-08-26T10:00:00.000Z');
  const closeMs = Date.parse('2026-08-26T10:59:59.999Z');
  const http =
    options.http ??
    httpMock(async () => ({
      status: 200,
      bodyText: JSON.stringify([
        [
          openMs,
          '100.0',
          '110.0',
          '90.0',
          '105.0',
          '12.5',
          closeMs,
          '1300.0',
          42,
          '5.0',
          '500.0',
          '0',
        ],
      ]),
    }));
  return {
    service: new MarketCandleRetrievalService(
      memoryPrisma(options.rows) as never,
      factory,
      new MarketCandleCache(),
      symbolCache,
      new MarketCandleRetrievalAudit(options.audit as never),
      [
        new BinanceCandleRetrievalAdapter(http),
        new PlannedCandleRetrievalAdapter('BYBIT'),
        new PlannedCandleRetrievalAdapter('OKX'),
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

const range = {
  rangeStart: '2026-08-26T00:00:00.000Z',
  rangeEnd: '2026-08-26T12:00:00.000Z',
};

describe('Market candle retrieval service (W2-S03-d)', () => {
  it('retrieves normalized Binance candles for a discovered symbol and interval', async () => {
    const audit = memoryAudit();
    const { service, symbolCache } = serviceFor({ rows: [connectedBinance], audit });
    seedSymbols(symbolCache, 'workspace-a', 'connection-a');

    const view = await service.retrieve({
      workspaceId: 'workspace-a',
      actorUserId: 'operator-a',
      connectionId: 'connection-a',
      exchangeSymbol: 'BTCUSDT',
      normalizedSymbol: 'BTC-USDT',
      interval: '1h',
      ...range,
    });

    expect(view.outcome).toBe('COMPLETED');
    expect(view.candles).toHaveLength(1);
    expect(view.candles[0]?.close).toBe('105.0');
    expect(view.interval).toBe('1h');
    expect(audit.events.map((event) => event.outcome)).toEqual([
      'candlestick_retrieval_started',
      'candlestick_retrieval_completed',
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
        interval: '1h',
        ...range,
      }),
    ).rejects.toMatchObject({ message: 'Connection not found' });
  });

  it('rejects unsupported intervals before retrieval', async () => {
    const audit = memoryAudit();
    const { service } = serviceFor({ rows: [connectedBinance], audit });

    await expect(
      service.retrieve({
        workspaceId: 'workspace-a',
        actorUserId: 'operator-a',
        connectionId: 'connection-a',
        exchangeSymbol: 'BTCUSDT',
        normalizedSymbol: 'BTC-USDT',
        interval: '2h',
        ...range,
      }),
    ).rejects.toBeInstanceOf(MarketCandleInvalidIntervalError);
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
      interval: '1h',
      ...range,
    });
    expect(view.outcome).toBe('FAILED');
    expect(view.candles).toEqual([]);
    expect(view.freshness).toBe('UNKNOWN');
  });

  it('reports provider unavailable without fabricating candles', async () => {
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
      interval: '1h',
      ...range,
    });
    expect(view.outcome).toBe('PROVIDER_UNAVAILABLE');
    expect(view.freshness).toBe('UNAVAILABLE');
    expect(view.candles).toEqual([]);
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
      interval: '1h',
      ...range,
    });
    expect(view.outcome).toBe('NOT_IMPLEMENTED');
    expect(view.freshness).toBe('UNAVAILABLE');
  });
});
