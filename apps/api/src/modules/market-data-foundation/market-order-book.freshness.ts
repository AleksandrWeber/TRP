import type { MarketOrderBookFreshness } from './market-order-book';

/**
 * Age at or below this threshold is Fresh when timestamps are consistent.
 * Reflects observed exchange vs retrieval time only — never fabricated.
 */
export const MARKET_ORDER_BOOK_FRESH_MAX_AGE_MS = 60_000;

/** Matches normalize clock-skew allowance for freshness age calculation. */
export const MARKET_ORDER_BOOK_FRESHNESS_CLOCK_SKEW_MS = 30_000;

/**
 * Derive order book snapshot freshness from observed timestamps only.
 *
 * - Fresh: exchange observation age within the fresh window
 * - Stale: exchange observation older than the fresh window
 * - Unknown: timestamps missing, non-finite, or beyond allowed skew
 * - Unavailable: not computed here — reserved for failed / provider-unavailable
 *   projections that carry no snapshot body
 */
export function calculateOrderBookFreshness(input: {
  exchangeTimestamp: string | null;
  retrievalTimestamp: string;
}): MarketOrderBookFreshness {
  if (input.exchangeTimestamp === null) {
    return 'UNKNOWN';
  }
  const exchangeMs = Date.parse(input.exchangeTimestamp);
  const retrievalMs = Date.parse(input.retrievalTimestamp);
  if (!Number.isFinite(exchangeMs) || !Number.isFinite(retrievalMs)) {
    return 'UNKNOWN';
  }
  if (exchangeMs > retrievalMs + MARKET_ORDER_BOOK_FRESHNESS_CLOCK_SKEW_MS) {
    return 'UNKNOWN';
  }
  const ageMs = Math.max(0, retrievalMs - exchangeMs);
  if (ageMs <= MARKET_ORDER_BOOK_FRESH_MAX_AGE_MS) {
    return 'FRESH';
  }
  return 'STALE';
}
