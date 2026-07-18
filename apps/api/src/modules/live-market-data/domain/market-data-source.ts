/**
 * Provider-neutral market data source identity (US126).
 * Opaque string — e.g. "binance_spot". Not a provider payload shape.
 */
export type MarketDataSourceId = string & { readonly __brand: 'MarketDataSourceId' };

export function toMarketDataSourceId(value: string): MarketDataSourceId {
  return value as MarketDataSourceId;
}
