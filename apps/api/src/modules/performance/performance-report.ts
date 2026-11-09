/**
 * Immutable performance metrics for a completed backtest (US122).
 * Produced by PerformanceAnalyzer — no optimization / reporting UI.
 *
 * Risk-adjusted ratios use adjacent simple returns on a chronological copy of
 * the equity snapshots:
 * `r_i = (equity_i - equity_(i-1)) / equity_(i-1)`.
 * A return is omitted when the prior equity is non-positive or either equity
 * or the return is non-finite. Source snapshots are not reordered or mutated.
 * The risk-free rate and the Sortino target are zero per observation.
 * Sharpe and Sortino are not annualized. Unavailable ratios are `null`, never `0`.
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
  /**
   * Mean valid return / sample standard deviation (divisor n − 1).
   * Null when fewer than two valid returns, or the deviation is zero or non-finite.
   */
  sharpeRatio: number | null;
  /**
   * Mean valid return / downside deviation.
   * Downside deviation is the root mean square of `min(r_i, 0)` over every valid
   * return, including non-negative returns as zero. The denominator is the count
   * of valid returns, not the count of negative returns.
   * Null when there are no valid returns, or the downside deviation is zero or non-finite.
   */
  sortinoRatio: number | null;
  /**
   * Existing CAGR divided by the maximum peak-to-trough equity decline as a fraction
   * of the peak on the same chronological curve. The fraction is not the currency
   * drawdown and not `maxDrawdownPct`.
   * Null when CAGR or that fraction is unavailable, zero, or non-finite.
   */
  calmarRatio: number | null;

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
