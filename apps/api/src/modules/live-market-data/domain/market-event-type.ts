/**
 * Canonical live market event type names (US126).
 * Fact names — not commands. Distinct closed-candle vs mark-price.
 */
export enum MarketEventType {
  CLOSED_CANDLE = 'MarketClosedCandle',
  MARK_PRICE = 'MarketMarkPrice',
  STATUS_CHANGED = 'MarketStatusChanged',
}

export function isMarketEventType(value: string): value is MarketEventType {
  return (Object.values(MarketEventType) as string[]).includes(value);
}
