import type { Instrument } from '../market-data/instrument';
import type { Timeframe } from '../market-data/timeframe';
import type { BacktestSessionId } from './backtest-session-id';
import type { BacktestStatus } from './backtest-status';

/**
 * Backtest session aggregate (US118).
 * Historical replay configuration — no paper / live trading.
 */
export type BacktestSession = {
  id: BacktestSessionId;
  workspaceId: string;
  strategyId: string;
  instrument: Instrument;
  timeframe: Timeframe;
  /** Inclusive ISO-8601 lower bound. */
  from: string;
  /** Inclusive ISO-8601 upper bound. */
  to: string;
  status: BacktestStatus;
  createdAt: string;
};
