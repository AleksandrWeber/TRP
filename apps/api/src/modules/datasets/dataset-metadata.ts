export const MARKET_REGIMES = [
  'BULL_MARKET',
  'BEAR_MARKET',
  'SIDEWAYS',
  'HIGH_VOLATILITY',
  'LOW_VOLATILITY',
  'UNCLASSIFIED',
] as const;

export type MarketRegime = (typeof MARKET_REGIMES)[number];

export function isMarketRegime(value: string): value is MarketRegime {
  return (MARKET_REGIMES as readonly string[]).includes(value);
}
