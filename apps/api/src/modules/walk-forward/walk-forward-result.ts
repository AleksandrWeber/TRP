import type { BacktestResult } from '../backtesting/backtest-result';
import type { WalkForwardWindow } from './walk-forward-window';

/**
 * Per-window backtest outcome within a Walk-Forward run (US119).
 */
export type WalkForwardWindowResult = {
  window: WalkForwardWindow;
  result: BacktestResult;
};

/**
 * Aggregated Walk-Forward analysis outcome (US119).
 * No optimization metrics / PnL.
 */
export type WalkForwardResult = {
  totalWindows: number;
  completedWindows: number;
  failedWindows: number;
  totalProcessedBars: number;
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  windowResults: WalkForwardWindowResult[];
};
