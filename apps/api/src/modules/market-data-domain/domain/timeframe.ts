/**
 * Market Data Domain timeframe (US006).
 * Re-exports the canonical Timeframe enum (US115) — single source of truth.
 */
export { Timeframe, isTimeframe } from '../../market-data/timeframe';

import { Timeframe } from '../../market-data/timeframe';

const TIMEFRAME_MILLIS: Readonly<Record<Timeframe, number>> = Object.freeze({
  [Timeframe.M1]: 60_000,
  [Timeframe.M5]: 300_000,
  [Timeframe.M15]: 900_000,
  [Timeframe.H1]: 3_600_000,
  [Timeframe.H4]: 14_400_000,
  [Timeframe.D1]: 86_400_000,
});

export function timeframeToMillis(timeframe: Timeframe): number {
  return TIMEFRAME_MILLIS[timeframe];
}
