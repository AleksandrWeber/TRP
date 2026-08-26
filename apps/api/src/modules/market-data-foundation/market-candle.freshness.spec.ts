import { describe, expect, it } from 'vitest';
import {
  MARKET_CANDLE_FRESH_MAX_AGE_MS,
  calculateCandleFreshness,
} from './market-candle.freshness';

describe('Market candle freshness (W2-S03-d)', () => {
  it('marks fresh when latest close is within the fresh window', () => {
    const retrieval = '2026-08-26T12:00:00.000Z';
    const exchange = new Date(Date.parse(retrieval) - MARKET_CANDLE_FRESH_MAX_AGE_MS).toISOString();
    expect(
      calculateCandleFreshness({
        latestExchangeTimestamp: exchange,
        retrievalTimestamp: retrieval,
      }),
    ).toBe('FRESH');
  });

  it('marks stale when latest close exceeds the fresh window', () => {
    const retrieval = '2026-08-26T12:00:00.000Z';
    const exchange = new Date(
      Date.parse(retrieval) - MARKET_CANDLE_FRESH_MAX_AGE_MS - 1,
    ).toISOString();
    expect(
      calculateCandleFreshness({
        latestExchangeTimestamp: exchange,
        retrievalTimestamp: retrieval,
      }),
    ).toBe('STALE');
  });

  it('marks unknown for unusable timestamps', () => {
    expect(
      calculateCandleFreshness({
        latestExchangeTimestamp: 'bad',
        retrievalTimestamp: '2026-08-26T12:00:00.000Z',
      }),
    ).toBe('UNKNOWN');
  });
});
