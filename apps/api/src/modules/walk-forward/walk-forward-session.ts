import type { Instrument } from '../market-data/instrument';
import type { Timeframe } from '../market-data/timeframe';
import type { WalkForwardSessionId } from './walk-forward-session-id';

/**
 * Walk-Forward analysis session (US119).
 * Window sizes are bar counts — no optimization / paper trading.
 */
export type WalkForwardSession = {
  id: WalkForwardSessionId;
  workspaceId: string;
  strategyId: string;
  instrument: Instrument;
  timeframe: Timeframe;
  /** Training window length in bars. */
  trainingWindow: number;
  /** Testing (out-of-sample) window length in bars. */
  testingWindow: number;
  /** Bars to advance between successive windows. */
  stepSize: number;
};
