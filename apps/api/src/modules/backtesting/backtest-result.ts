import type { BacktestStatus } from './backtest-status';
import type { PerformanceReport } from '../performance/performance-report';

/**
 * Outcome of a historical backtest run (US118 / US121 / US122).
 */
export type BacktestResult = {
  processedBars: number;
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  status: BacktestStatus;
  totalTrades: number;
  openTrades: number;
  closedTrades: number;
  performance: PerformanceReport;
};
