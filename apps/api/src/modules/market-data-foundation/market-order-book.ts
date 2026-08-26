/**
 * Provider-independent market order book model (W2-S03-e).
 *
 * Exchange-specific fields must not appear on the public projection.
 * This model is transport-independent: callers cannot tell whether the
 * snapshot came from REST, cache, replay, or a future streaming adapter.
 */

export const MARKET_ORDER_BOOK_DEPTHS = [10, 20, 50, 100] as const;

export type MarketOrderBookDepth = (typeof MARKET_ORDER_BOOK_DEPTHS)[number];

const DEPTH_SET = new Set<number>(MARKET_ORDER_BOOK_DEPTHS);

export function isMarketOrderBookDepth(value: number): value is MarketOrderBookDepth {
  return DEPTH_SET.has(value);
}

export const MARKET_ORDER_BOOK_FRESHNESS = ['FRESH', 'STALE', 'UNAVAILABLE', 'UNKNOWN'] as const;

export type MarketOrderBookFreshness = (typeof MARKET_ORDER_BOOK_FRESHNESS)[number];

const FRESHNESS_SET = new Set<string>(MARKET_ORDER_BOOK_FRESHNESS);

export function isMarketOrderBookFreshness(value: string): value is MarketOrderBookFreshness {
  return FRESHNESS_SET.has(value);
}

export type ProviderOrderBookLevel = Readonly<{
  price: string;
  quantity: string;
}>;

/**
 * Raw provider order book snapshot before normalization.
 * Adapters supply only these fields; unknown venue fields stay at the adapter.
 * exchangeTimestampMs is null when the provider did not observe a wall-clock time.
 */
export type ProviderOrderBookSnapshot = Readonly<{
  exchangeSymbol: string;
  bids: readonly ProviderOrderBookLevel[];
  asks: readonly ProviderOrderBookLevel[];
  exchangeTimestampMs: number | null;
}>;

export type NormalizedOrderBookLevel = Readonly<{
  price: string;
  quantity: string;
}>;

/**
 * Normalized internal order book snapshot. Cached and projected from this shape only.
 */
export type NormalizedMarketOrderBook = Readonly<{
  normalizedSymbol: string;
  depthLimit: MarketOrderBookDepth;
  bids: readonly NormalizedOrderBookLevel[];
  asks: readonly NormalizedOrderBookLevel[];
  exchangeTimestamp: string | null;
  retrievalTimestamp: string;
  providerId: string;
  freshness: MarketOrderBookFreshness;
}>;
