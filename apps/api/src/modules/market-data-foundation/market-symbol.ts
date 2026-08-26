/**
 * Provider-independent market symbol model (W2-S03-b).
 *
 * Exchange-specific fields must not appear on the public projection.
 * This model is transport-independent: callers cannot tell whether symbols
 * came from REST, cache, replay, or a future streaming adapter.
 */

export const MARKET_SYMBOL_TRADING_STATUSES = [
  'TRADING',
  'HALT',
  'BREAK',
  'END_OF_DAY',
  'PRE_TRADING',
  'POST_TRADING',
  'AUCTION_MATCH',
  'PENDING_TRADING',
  'SETTLING',
  'DELIVERED',
  'PRE_DELIVERING',
  'CLOSE',
  'PRE_CLOSE',
  'PRE_SETTLE',
] as const;

export type MarketSymbolTradingStatus = (typeof MARKET_SYMBOL_TRADING_STATUSES)[number];

const TRADING_STATUS_SET = new Set<string>(MARKET_SYMBOL_TRADING_STATUSES);

export function isMarketSymbolTradingStatus(value: string): value is MarketSymbolTradingStatus {
  return TRADING_STATUS_SET.has(value);
}

/**
 * Raw provider symbol definition before normalization.
 * Adapters supply only these fields; unknown venue fields stay at the adapter.
 */
export type ProviderSymbolDefinition = Readonly<{
  exchangeSymbol: string;
  baseAsset: string;
  quoteAsset: string;
  tradingStatus: string;
}>;

/**
 * Normalized internal symbol. Cached and projected from this shape only.
 */
export type NormalizedMarketSymbol = Readonly<{
  exchangeSymbol: string;
  normalizedSymbol: string;
  baseAsset: string;
  quoteAsset: string;
  tradingStatus: MarketSymbolTradingStatus;
  providerId: string;
}>;
