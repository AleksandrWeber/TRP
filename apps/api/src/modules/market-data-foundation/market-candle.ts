/**
 * Provider-independent market candlestick model (W2-S03-d).
 *
 * Exchange-specific fields must not appear on the public projection.
 * This model is transport-independent: callers cannot tell whether candles
 * came from REST, cache, replay, or a future streaming adapter.
 */

export const MARKET_CANDLE_INTERVALS = ['1m', '5m', '15m', '1h', '4h', '1d'] as const;

export type MarketCandleInterval = (typeof MARKET_CANDLE_INTERVALS)[number];

const INTERVAL_SET = new Set<string>(MARKET_CANDLE_INTERVALS);

export function isMarketCandleInterval(value: string): value is MarketCandleInterval {
  return INTERVAL_SET.has(value);
}

export const MARKET_CANDLE_FRESHNESS = ['FRESH', 'STALE', 'UNAVAILABLE', 'UNKNOWN'] as const;

export type MarketCandleFreshness = (typeof MARKET_CANDLE_FRESHNESS)[number];

const FRESHNESS_SET = new Set<string>(MARKET_CANDLE_FRESHNESS);

export function isMarketCandleFreshness(value: string): value is MarketCandleFreshness {
  return FRESHNESS_SET.has(value);
}

/**
 * Raw provider candle observation before normalization.
 * Adapters supply only these fields; unknown venue fields stay at the adapter.
 */
export type ProviderCandleObservation = Readonly<{
  openTimeMs: number;
  closeTimeMs: number;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
  tradeCount: number | null;
}>;

/**
 * Normalized internal candle. Cached and projected from this shape only.
 */
export type NormalizedMarketCandle = Readonly<{
  normalizedSymbol: string;
  interval: MarketCandleInterval;
  openTime: string;
  closeTime: string;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
  tradeCount: number | null;
  exchangeTimestamp: string;
  retrievalTimestamp: string;
  providerId: string;
}>;
