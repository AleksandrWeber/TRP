/**
 * Provider-independent market ticker model (W2-S03-c).
 *
 * Exchange-specific fields must not appear on the public projection.
 * This model is transport-independent: callers cannot tell whether the ticker
 * came from REST, cache, replay, or a future streaming adapter.
 */

export const MARKET_TICKER_FRESHNESS = ['FRESH', 'STALE', 'UNAVAILABLE', 'UNKNOWN'] as const;

export type MarketTickerFreshness = (typeof MARKET_TICKER_FRESHNESS)[number];

const FRESHNESS_SET = new Set<string>(MARKET_TICKER_FRESHNESS);

export function isMarketTickerFreshness(value: string): value is MarketTickerFreshness {
  return FRESHNESS_SET.has(value);
}

/**
 * Raw provider ticker observation before normalization.
 * Adapters supply only these fields; unknown venue fields stay at the adapter.
 */
export type ProviderTickerObservation = Readonly<{
  exchangeSymbol: string;
  lastPrice: string;
  bid: string;
  ask: string;
  changePercent24h: string;
  high24h: string;
  low24h: string;
  volume24h: string;
  exchangeTimestampMs: number;
}>;

/**
 * Normalized internal ticker. Cached and projected from this shape only.
 */
export type NormalizedMarketTicker = Readonly<{
  normalizedSymbol: string;
  lastPrice: string;
  bid: string;
  ask: string;
  changePercent24h: string;
  high24h: string;
  low24h: string;
  volume24h: string;
  exchangeTimestamp: string;
  retrievalTimestamp: string;
  providerId: string;
  freshness: MarketTickerFreshness;
}>;
