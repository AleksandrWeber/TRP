import { describe, expect, it } from 'vitest';
import {
  MARKET_ORDER_BOOK_FRESH_MAX_AGE_MS,
  calculateOrderBookFreshness,
} from './market-order-book.freshness';

describe('Market order book freshness (W2-S03-e)', () => {
  it('marks fresh when exchange age is within the fresh window', () => {
    const retrieval = '2026-08-26T12:00:00.000Z';
    const exchange = new Date(
      Date.parse(retrieval) - MARKET_ORDER_BOOK_FRESH_MAX_AGE_MS,
    ).toISOString();
    expect(
      calculateOrderBookFreshness({
        exchangeTimestamp: exchange,
        retrievalTimestamp: retrieval,
      }),
    ).toBe('FRESH');
  });

  it('marks stale when exchange age exceeds the fresh window', () => {
    const retrieval = '2026-08-26T12:00:00.000Z';
    const exchange = new Date(
      Date.parse(retrieval) - MARKET_ORDER_BOOK_FRESH_MAX_AGE_MS - 1,
    ).toISOString();
    expect(
      calculateOrderBookFreshness({
        exchangeTimestamp: exchange,
        retrievalTimestamp: retrieval,
      }),
    ).toBe('STALE');
  });

  it('marks unknown when exchange timestamp is absent without fabricating freshness', () => {
    expect(
      calculateOrderBookFreshness({
        exchangeTimestamp: null,
        retrievalTimestamp: '2026-08-26T12:00:00.000Z',
      }),
    ).toBe('UNKNOWN');
  });
});
