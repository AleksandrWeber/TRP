import { Timeframe } from '../../market-data/timeframe';

/**
 * Provider-neutral timeframe duration (US139).
 * Kept outside Binance adapters so gap recovery stays source-agnostic.
 */
export function timeframeDurationMs(timeframe: Timeframe): number {
  switch (timeframe) {
    case Timeframe.M1:
      return 60_000;
    case Timeframe.M5:
      return 5 * 60_000;
    case Timeframe.M15:
      return 15 * 60_000;
    case Timeframe.H1:
      return 60 * 60_000;
    case Timeframe.H4:
      return 4 * 60 * 60_000;
    case Timeframe.D1:
      return 24 * 60 * 60_000;
    default: {
      const _exhaustive: never = timeframe;
      throw new Error(`unsupported timeframe: ${_exhaustive}`);
    }
  }
}
