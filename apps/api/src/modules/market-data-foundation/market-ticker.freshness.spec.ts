import { describe, expect, it } from 'vitest';
import {
  MARKET_TICKER_FRESH_MAX_AGE_MS,
  calculateTickerFreshness,
} from './market-ticker.freshness';

describe('Market ticker freshness (W2-S03-c)', () => {
  it('marks fresh when exchange age is within the fresh window', () => {
    const retrieval = '2026-08-26T12:00:00.000Z';
    const exchange = new Date(Date.parse(retrieval) - MARKET_TICKER_FRESH_MAX_AGE_MS).toISOString();
    expect(
      calculateTickerFreshness({ exchangeTimestamp: exchange, retrievalTimestamp: retrieval }),
    ).toBe('FRESH');
  });

  it('marks stale when exchange age exceeds the fresh window', () => {
    const retrieval = '2026-08-26T12:00:00.000Z';
    const exchange = new Date(
      Date.parse(retrieval) - MARKET_TICKER_FRESH_MAX_AGE_MS - 1,
    ).toISOString();
    expect(
      calculateTickerFreshness({ exchangeTimestamp: exchange, retrievalTimestamp: retrieval }),
    ).toBe('STALE');
  });

  it('marks unknown for unusable timestamps without fabricating freshness', () => {
    expect(
      calculateTickerFreshness({
        exchangeTimestamp: 'not-a-date',
        retrievalTimestamp: '2026-08-26T12:00:00.000Z',
      }),
    ).toBe('UNKNOWN');
    expect(
      calculateTickerFreshness({
        exchangeTimestamp: '2026-08-26T12:01:00.000Z',
        retrievalTimestamp: '2026-08-26T12:00:00.000Z',
      }),
    ).toBe('UNKNOWN');
  });

  it('treats minor clock skew as fresh rather than inventing stale', () => {
    expect(
      calculateTickerFreshness({
        exchangeTimestamp: '2026-08-26T12:00:05.000Z',
        retrievalTimestamp: '2026-08-26T12:00:00.000Z',
      }),
    ).toBe('FRESH');
  });
});
