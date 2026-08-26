import type { MarketTickerFreshness } from './market-ticker';

/**
 * Age at or below this threshold is Fresh when timestamps are consistent.
 * Reflects observed exchange vs retrieval time only — never fabricated.
 */
export const MARKET_TICKER_FRESH_MAX_AGE_MS = 60_000;

/** Matches normalize clock-skew allowance for freshness age calculation. */
export const MARKET_TICKER_FRESHNESS_CLOCK_SKEW_MS = 30_000;

/**
 * Derive ticker freshness from observed timestamps only.
 *
 * - Fresh: exchange observation age within the fresh window (including minor clock skew)
 * - Stale: exchange observation older than the fresh window
 * - Unknown: timestamps missing, non-finite, or beyond allowed skew
 * - Unavailable: not computed here — reserved for failed / provider-unavailable
 *   projections that carry no ticker body
 */
export function calculateTickerFreshness(input: {
  exchangeTimestamp: string;
  retrievalTimestamp: string;
}): MarketTickerFreshness {
  const exchangeMs = Date.parse(input.exchangeTimestamp);
  const retrievalMs = Date.parse(input.retrievalTimestamp);
  if (!Number.isFinite(exchangeMs) || !Number.isFinite(retrievalMs)) {
    return 'UNKNOWN';
  }
  if (exchangeMs > retrievalMs + MARKET_TICKER_FRESHNESS_CLOCK_SKEW_MS) {
    return 'UNKNOWN';
  }
  const ageMs = Math.max(0, retrievalMs - exchangeMs);
  if (ageMs <= MARKET_TICKER_FRESH_MAX_AGE_MS) {
    return 'FRESH';
  }
  return 'STALE';
}
