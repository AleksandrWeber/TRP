import { describe, expect, it } from 'vitest';
import { MarketTickerCache } from './market-ticker.cache';
import type { NormalizedMarketTicker } from './market-ticker';

describe('Market ticker cache (W2-S03-c)', () => {
  it('stores normalized ticker objects only and stays session-scoped', () => {
    const cache = new MarketTickerCache();
    const ticker: NormalizedMarketTicker = Object.freeze({
      normalizedSymbol: 'BTC-USDT',
      lastPrice: '100',
      bid: '99',
      ask: '101',
      changePercent24h: '1',
      high24h: '110',
      low24h: '90',
      volume24h: '10',
      exchangeTimestamp: '2026-08-26T12:00:00.000Z',
      retrievalTimestamp: '2026-08-26T12:00:01.000Z',
      providerId: 'BINANCE',
      freshness: 'FRESH',
    });

    cache.set('workspace-a', 'connection-a', 'BTCUSDT', {
      providerId: 'BINANCE',
      exchangeSymbol: 'BTCUSDT',
      retrievedAt: ticker.retrievalTimestamp,
      ticker,
    });

    expect(cache.get('workspace-a', 'connection-a', 'btcusdt')?.ticker.lastPrice).toBe('100');
    expect(cache.get('workspace-b', 'connection-a', 'BTCUSDT')).toBeNull();
    cache.clear('workspace-a', 'connection-a', 'BTCUSDT');
    expect(cache.get('workspace-a', 'connection-a', 'BTCUSDT')).toBeNull();
  });
});
