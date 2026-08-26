import { describe, expect, it } from 'vitest';
import { MarketCandleCache } from './market-candle.cache';
import type { NormalizedMarketCandle } from './market-candle';

describe('Market candle cache (W2-S03-d)', () => {
  it('stores normalized OHLCV only and stays session-scoped', () => {
    const cache = new MarketCandleCache();
    const candle: NormalizedMarketCandle = Object.freeze({
      normalizedSymbol: 'BTC-USDT',
      interval: '1h',
      openTime: '2026-08-26T10:00:00.000Z',
      closeTime: '2026-08-26T10:59:59.999Z',
      open: '100',
      high: '110',
      low: '90',
      close: '105',
      volume: '1',
      tradeCount: 10,
      exchangeTimestamp: '2026-08-26T10:59:59.999Z',
      retrievalTimestamp: '2026-08-26T12:00:00.000Z',
      providerId: 'BINANCE',
    });

    cache.set(
      'workspace-a',
      'connection-a',
      'BTCUSDT',
      '1h',
      '2026-08-26T00:00:00.000Z',
      '2026-08-26T12:00:00.000Z',
      {
        providerId: 'BINANCE',
        exchangeSymbol: 'BTCUSDT',
        interval: '1h',
        rangeStart: '2026-08-26T00:00:00.000Z',
        rangeEnd: '2026-08-26T12:00:00.000Z',
        retrievedAt: candle.retrievalTimestamp,
        freshness: 'STALE',
        candles: [candle],
      },
    );

    expect(
      cache.get(
        'workspace-a',
        'connection-a',
        'btcusdt',
        '1h',
        '2026-08-26T00:00:00.000Z',
        '2026-08-26T12:00:00.000Z',
      )?.candles[0]?.close,
    ).toBe('105');
    expect(
      cache.get(
        'workspace-b',
        'connection-a',
        'BTCUSDT',
        '1h',
        '2026-08-26T00:00:00.000Z',
        '2026-08-26T12:00:00.000Z',
      ),
    ).toBeNull();
  });
});
