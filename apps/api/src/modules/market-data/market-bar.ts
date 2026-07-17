import type { Instrument } from './instrument';
import type { MarketBarId } from './market-bar-id';
import type { Timeframe } from './timeframe';

/**
 * Market Data OHLCV bar (US115).
 * Workspace-scoped historical / simulation foundation — no backtesting yet.
 */
export type MarketBar = {
  id: MarketBarId;
  workspaceId: string;
  instrument: Instrument;
  timeframe: Timeframe;
  /** ISO-8601 bar open time. */
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};
