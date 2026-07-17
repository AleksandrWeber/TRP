/**
 * Point-in-time portfolio valuation (US120).
 */
export type PortfolioSnapshot = {
  timestamp: string;
  cash: number;
  equity: number;
  unrealizedPnL: number;
  realizedPnL: number;
};
