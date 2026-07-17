/**
 * Branded MarketBar identity (US115).
 * Opaque string — not interchangeable with other entity ids at the type level.
 */
export type MarketBarId = string & { readonly __brand: 'MarketBarId' };

export function toMarketBarId(value: string): MarketBarId {
  return value as MarketBarId;
}
