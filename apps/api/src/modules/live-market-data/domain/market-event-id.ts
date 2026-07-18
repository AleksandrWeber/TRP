/**
 * Branded market event identity (US126).
 * Opaque string — not interchangeable with other entity ids.
 */
export type MarketEventId = string & { readonly __brand: 'MarketEventId' };

export function toMarketEventId(value: string): MarketEventId {
  return value as MarketEventId;
}
