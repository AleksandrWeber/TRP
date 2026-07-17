/**
 * Branded Trade identity (US121).
 */
export type TradeId = string & { readonly __brand: 'TradeId' };

export function toTradeId(value: string): TradeId {
  return value as TradeId;
}
