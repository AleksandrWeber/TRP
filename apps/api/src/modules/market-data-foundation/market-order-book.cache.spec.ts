import { describe, expect, it } from 'vitest';
import { MarketOrderBookCache } from './market-order-book.cache';
import type { NormalizedMarketOrderBook } from './market-order-book';

describe('Market order book cache (W2-S03-e)', () => {
  it('stores normalized snapshots only and stays session-scoped', () => {
    const cache = new MarketOrderBookCache();
    const orderBook: NormalizedMarketOrderBook = Object.freeze({
      normalizedSymbol: 'BTC-USDT',
      depthLimit: 20,
      bids: Object.freeze([{ price: '100', quantity: '1' }]),
      asks: Object.freeze([{ price: '101', quantity: '2' }]),
      exchangeTimestamp: null,
      retrievalTimestamp: '2026-08-26T12:00:00.000Z',
      providerId: 'BINANCE',
      freshness: 'UNKNOWN',
    });

    cache.set('workspace-a', 'connection-a', 'BTCUSDT', 20, {
      providerId: 'BINANCE',
      exchangeSymbol: 'BTCUSDT',
      depthLimit: 20,
      retrievedAt: orderBook.retrievalTimestamp,
      freshness: 'UNKNOWN',
      orderBook,
    });

    expect(cache.get('workspace-a', 'connection-a', 'btcusdt', 20)?.orderBook.bids[0]?.price).toBe(
      '100',
    );
    expect(cache.get('workspace-b', 'connection-a', 'BTCUSDT', 20)).toBeNull();
  });
});
