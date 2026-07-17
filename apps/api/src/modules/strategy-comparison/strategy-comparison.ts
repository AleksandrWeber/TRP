/**
 * Normalized metrics for one strategy candidate in a comparison (US123).
 */
export type StrategyComparisonEntry = Readonly<{
  strategyId: string;
  source: 'backtest' | 'walk-forward';
  processedBars: number;
  totalTrades: number;
  netProfit: number;
  /** Total return in percent (from PerformanceReport.totalReturnPct). */
  totalReturn: number;
  maxDrawdown: number;
  winRate: number;
  profitFactor: number;
  cagr: number | null;
  durationMs: number;
  /** Weighted score in [0, 1] used for overall ranking. */
  weightedScore: number;
}>;

/**
 * Strategy id rankings (best → worst) for each criterion (US123).
 */
export type StrategyComparisonRankings = Readonly<{
  highestReturn: readonly string[];
  lowestDrawdown: readonly string[];
  bestProfitFactor: readonly string[];
  highestWinRate: readonly string[];
}>;

/**
 * Immutable multi-strategy comparison outcome (US123).
 */
export type StrategyComparison = Readonly<{
  entries: readonly StrategyComparisonEntry[];
  rankings: StrategyComparisonRankings;
  overallWinnerStrategyId: string | null;
}>;
