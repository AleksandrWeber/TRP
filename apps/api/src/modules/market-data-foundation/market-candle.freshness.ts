import type { MarketCandleFreshness } from './market-candle';

/**
 * Age at or below this threshold is Fresh when timestamps are consistent.
 * Reflects observed exchange vs retrieval time only — never fabricated.
 */
export const MARKET_CANDLE_FRESH_MAX_AGE_MS = 60_000;

/** Matches normalize clock-skew allowance for freshness age calculation. */
export const MARKET_CANDLE_FRESHNESS_CLOCK_SKEW_MS = 30_000;

/**
 * Derive candlestick series freshness from the latest observed candle close
 * versus retrieval time.
 *
 * - Fresh: latest close within the fresh window (including minor clock skew)
 * - Stale: latest close older than the fresh window
 * - Unknown: timestamps missing, non-finite, or beyond allowed skew
 * - Unavailable: not computed here — reserved for failed / provider-unavailable
 *   projections that carry no candle body
 */
export function calculateCandleFreshness(input: {
  latestExchangeTimestamp: string;
  retrievalTimestamp: string;
}): MarketCandleFreshness {
  const exchangeMs = Date.parse(input.latestExchangeTimestamp);
  const retrievalMs = Date.parse(input.retrievalTimestamp);
  if (!Number.isFinite(exchangeMs) || !Number.isFinite(retrievalMs)) {
    return 'UNKNOWN';
  }
  if (exchangeMs > retrievalMs + MARKET_CANDLE_FRESHNESS_CLOCK_SKEW_MS) {
    return 'UNKNOWN';
  }
  const ageMs = Math.max(0, retrievalMs - exchangeMs);
  if (ageMs <= MARKET_CANDLE_FRESH_MAX_AGE_MS) {
    return 'FRESH';
  }
  return 'STALE';
}
