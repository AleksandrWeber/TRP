/**
 * Supported OHLCV bar timeframes (US115).
 */
export enum Timeframe {
  M1 = '1m',
  M5 = '5m',
  M15 = '15m',
  H1 = '1h',
  H4 = '4h',
  D1 = '1d',
}

export function isTimeframe(value: string): value is Timeframe {
  return (Object.values(Timeframe) as string[]).includes(value);
}
