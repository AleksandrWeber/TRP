import { Timeframe } from '../../../market-data/timeframe';

/**
 * Map canonical Timeframe to Binance kline interval (US132).
 * Remains adapter-internal.
 */
export function timeframeToBinanceInterval(timeframe: Timeframe): string {
  switch (timeframe) {
    case Timeframe.M1:
      return '1m';
    case Timeframe.M5:
      return '5m';
    case Timeframe.M15:
      return '15m';
    case Timeframe.H1:
      return '1h';
    case Timeframe.H4:
      return '4h';
    case Timeframe.D1:
      return '1d';
    default: {
      const _exhaustive: never = timeframe;
      throw new Error(`unsupported timeframe for Binance: ${_exhaustive}`);
    }
  }
}

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
      throw new Error(`unsupported timeframe for Binance: ${_exhaustive}`);
    }
  }
}
