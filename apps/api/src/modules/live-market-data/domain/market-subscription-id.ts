/**
 * Branded market subscription identity (US126).
 */
export type MarketSubscriptionId = string & { readonly __brand: 'MarketSubscriptionId' };

export function toMarketSubscriptionId(value: string): MarketSubscriptionId {
  return value as MarketSubscriptionId;
}
