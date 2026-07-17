import type { Instrument } from '../market-data/instrument';
import type { Timeframe } from '../market-data/timeframe';

/**
 * Request for historical OHLCV bars from a MarketDataProvider (US117).
 */
export type HistoricalDataRequest = {
  /** Workspace scope for local / tenant-aware providers. */
  workspaceId: string;
  instrument: Instrument | string;
  timeframe: Timeframe;
  /** Inclusive ISO-8601 lower bound. */
  from: string;
  /** Inclusive ISO-8601 upper bound. */
  to: string;
};
