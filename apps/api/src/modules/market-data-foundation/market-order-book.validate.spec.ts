import { describe, expect, it } from 'vitest';
import {
  MarketOrderBookDuplicatePriceError,
  MarketOrderBookInvalidDepthError,
  validateAndNormalizeOrderBook,
  validateOrderBookRetrievalRequest,
} from './market-order-book.validate';

describe('Market order book validation (W2-S03-e)', () => {
  const retrievalTimestamp = '2026-08-26T12:00:00.000Z';

  it('accepts supported depths and rejects unsupported depths', () => {
    expect(
      validateOrderBookRetrievalRequest({
        exchangeSymbol: 'BTCUSDT',
        normalizedSymbol: 'BTC-USDT',
        depthLimit: 20,
      }).depthLimit,
    ).toBe(20);

    expect(() =>
      validateOrderBookRetrievalRequest({
        exchangeSymbol: 'BTCUSDT',
        normalizedSymbol: 'BTC-USDT',
        depthLimit: 5,
      }),
    ).toThrow(MarketOrderBookInvalidDepthError);
  });

  it('rejects duplicate price levels', () => {
    expect(() =>
      validateAndNormalizeOrderBook({
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
          asks: [{ price: '101', quantity: '1' }],
        },
      }),
    ).toThrow(MarketOrderBookDuplicatePriceError);
  });

  it('accepts a valid snapshot with unknown freshness when no exchange timestamp exists', () => {
    const book = validateAndNormalizeOrderBook({
      providerId: 'BINANCE',
      normalizedSymbol: 'BTC-USDT',
      depthLimit: 10,
      retrievalTimestamp,
      snapshot: {
        exchangeSymbol: 'BTCUSDT',
        exchangeTimestampMs: null,
        bids: [{ price: '100', quantity: '1' }],
        asks: [{ price: '101', quantity: '2' }],
      },
    });
    expect(book.freshness).toBe('UNKNOWN');
    expect(book.bids).toHaveLength(1);
  });
});
