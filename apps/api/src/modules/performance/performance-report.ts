/**
 * Immutable performance metrics for a completed backtest (US122).
 * Produced by PerformanceAnalyzer — no optimization / reporting UI.
 */
export type PerformanceReport = Readonly<{
  // Returns
  netProfit: number;
  totalReturnPct: number;
  /** Annualized return when the sample spans a positive duration; otherwise null. */
  cagr: number | null;

  // Risk
  maxDrawdown: number;
  maxDrawdownPct: number;
  /** Sample standard deviation of period equity returns (fraction, not %). */
  volatility: number;

  // Trade statistics (closed trades)
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  averageWin: number;
  /** Mean loss magnitude (non-negative). */
  averageLoss: number;
  profitFactor: number;

  // Timing
  /** Mean closed-trade duration in milliseconds. */
  averageTradeDurationMs: number;
}>;
