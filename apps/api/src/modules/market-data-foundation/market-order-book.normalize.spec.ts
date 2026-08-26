import { describe, expect, it } from 'vitest';
import { normalizeProviderOrderBook } from './market-order-book.normalize';

describe('Market order book normalization (W2-S03-e)', () => {
  const retrievalTimestamp = '2026-08-26T12:00:00.000Z';

  it('normalizes bids and asks deterministically', () => {
    const book = normalizeProviderOrderBook({
      providerId: 'BINANCE',
      normalizedSymbol: 'btc-usdt',
      depthLimit: 10,
      retrievalTimestamp,
      snapshot: {
        exchangeSymbol: 'BTCUSDT',
        exchangeTimestampMs: null,
        bids: [
          { price: '100', quantity: '2' },
          { price: '101', quantity: '1' },
        ],
        asks: [
          { price: '103', quantity: '1' },
          { price: '102', quantity: '3' },
        ],
      },
    });
    expect(book?.bids.map((level) => level.price)).toEqual(['101', '100']);
    expect(book?.asks.map((level) => level.price)).toEqual(['102', '103']);
    expect(book?.freshness).toBe('UNKNOWN');
    expect(book?.exchangeTimestamp).toBeNull();
  });

  it('rejects negative prices, zero quantities, and duplicate prices', () => {
    expect(
      normalizeProviderOrderBook({
        providerId: 'BINANCE',
        normalizedSymbol: 'BTC-USDT',
        depthLimit: 10,
        retrievalTimestamp,
        snapshot: {
          exchangeSymbol: 'BTCUSDT',
          exchangeTimestampMs: null,
          bids: [{ price: '-1', quantity: '1' }],
          asks: [],
        },
      }),
    ).toBeNull();

    expect(
      normalizeProviderOrderBook({
        providerId: 'BINANCE',
        normalizedSymbol: 'BTC-USDT',
        depthLimit: 10,
        retrievalTimestamp,
        snapshot: {
          exchangeSymbol: 'BTCUSDT',
          exchangeTimestampMs: null,
          bids: [
            { price: '100', quantity: '1' },
            { price: '100', quantity: '2' },
          ],
          asks: [],
        },
      }),
    ).toBeNull();
  });
});
