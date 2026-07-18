/**
 * Canonical live market stream channels (US126).
 * Provider-neutral — no exchange payload fields.
 */
export enum MarketStreamChannel {
  CLOSED_CANDLE = 'closed_candle',
  MARK_PRICE = 'mark_price',
  MARKET_STATUS = 'market_status',
}

export function isMarketStreamChannel(value: string): value is MarketStreamChannel {
  return (Object.values(MarketStreamChannel) as string[]).includes(value);
}
