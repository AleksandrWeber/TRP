import type { BacktestResult } from '../backtesting/backtest-result';
import type { BacktestSession } from '../backtesting/backtest-session';
import type { Portfolio } from '../portfolio/portfolio';
import type { PortfolioSnapshot } from '../portfolio/portfolio-snapshot';
import type { Trade } from '../trade/trade';
import type { WalkForwardResult } from '../walk-forward/walk-forward-result';

/**
 * Inputs assembled by SimulationReportBuilder (US124).
 * Callers supply backtest outputs — BacktestEngine does not know report internals.
 */
export type SimulationReportBuildInput = {
  session: Pick<
    BacktestSession,
    'strategyId' | 'workspaceId' | 'instrument' | 'timeframe' | 'from' | 'to'
  >;
  backtest: BacktestResult;
  portfolio: Portfolio;
  snapshots: readonly PortfolioSnapshot[];
  openTrades: readonly Trade[];
  closedTrades: readonly Trade[];
  walkForward?: WalkForwardResult;
  comparisonScore?: number;
  generatedAt?: string;
};
