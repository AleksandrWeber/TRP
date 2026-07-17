import type { BacktestResult } from '../backtesting/backtest-result';
import type { Instrument } from '../market-data/instrument';
import type { Timeframe } from '../market-data/timeframe';
import type { PerformanceReport } from '../performance/performance-report';
import type { Portfolio } from '../portfolio/portfolio';
import type { WalkForwardResult } from '../walk-forward/walk-forward-result';

/**
 * Session slice captured on a SimulationReport (US124).
 */
export type SimulationReportSession = Readonly<{
  strategyId: string;
  workspaceId: string;
  instrument: Instrument | string;
  timeframe: Timeframe;
  from: string;
  to: string;
}>;

/**
 * Compact equity-curve summary (US124).
 */
export type PortfolioSnapshotsSummary = Readonly<{
  count: number;
  firstTimestamp: string | null;
  lastTimestamp: string | null;
  startingEquity: number | null;
  endingEquity: number | null;
  peakEquity: number | null;
  troughEquity: number | null;
}>;

/**
 * Trade counts for the simulation (US124).
 */
export type TradeSummary = Readonly<{
  totalTrades: number;
  openTrades: number;
  closedTrades: number;
}>;

/**
 * Unified immutable research simulation artifact (US124).
 * No UI / REST / Prisma.
 */
export type SimulationReport = Readonly<{
  session: SimulationReportSession;
  execution: Readonly<{
    backtest: BacktestResult;
    walkForward?: WalkForwardResult;
  }>;
  portfolio: Readonly<{
    final: Portfolio;
    snapshotsSummary: PortfolioSnapshotsSummary;
  }>;
  trading: Readonly<{
    summary: TradeSummary;
  }>;
  performance: PerformanceReport;
  /** Optional weighted comparison score from StrategyComparison (US123). */
  comparisonScore?: number;
  generatedAt: string;
}>;
