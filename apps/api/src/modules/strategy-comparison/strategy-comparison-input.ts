import type { BacktestResult } from '../backtesting/backtest-result';
import type { WalkForwardResult } from '../walk-forward/walk-forward-result';

/**
 * One candidate supplied to StrategyComparisonService (US123).
 * `strategyId` is required because BacktestResult / WalkForwardResult do not carry it.
 */
export type StrategyComparisonInput = {
  strategyId: string;
  result: BacktestResult | WalkForwardResult;
};
