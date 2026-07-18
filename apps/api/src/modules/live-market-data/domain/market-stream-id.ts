/**
 * Branded market stream identity (US126).
 * Opaque string — scoped stream key for ordering and checkpoints.
 */
export type MarketStreamId = string & { readonly __brand: 'MarketStreamId' };

export function toMarketStreamId(value: string): MarketStreamId {
  return value as MarketStreamId;
}
