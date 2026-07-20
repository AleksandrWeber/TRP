import { describe, expect, it } from 'vitest';
import type { Candle } from '../../market-data-domain/domain/candle';
import { Timeframe } from '../../market-data-domain/domain/timeframe';
import {
  InsufficientIndicatorInputError,
  InvalidIndicatorInputError,
  InvalidIndicatorPeriodError,
} from '../domain/technical-indicators.error';
import { RSI_INDICATOR_ID, RsiIndicator } from './rsi-indicator';

// Wilder's published worksheet prices, also reproduced by Alpharithms:
// https://github.com/alpharithms/data/blob/main/wilder-rsi-data.csv
const REFERENCE_CLOSES = [
  54.8, 56.8, 57.85, 59.85, 60.57, 61.1, 62.17, 60.6, 62.35, 62.15, 62.35, 61.45, 62.8, 61.37, 62.5,
  62.57, 60.8, 59.37, 60.35, 62.35, 62.17, 62.55, 64.55, 64.37, 65.3, 64.42, 62.9, 61.6, 62.05,
  60.05, 59.7, 60.9, 60.25, 58.27, 58.7, 57.72, 58.1, 58.2,
] as const;

// Full-precision Wilder results (no worksheet intermediate rounding).
const EXPECTED_RSI_14 = [
  74.21383647798743, 74.33551617873653, 65.87128621880291, 59.93370363734097, 62.432875890539535,
  66.96204697604155, 66.18861651447845, 67.05377172870163, 71.2267916756337, 70.36298568875856,
  72.23644000343111, 67.86486386872977, 60.998220723464875, 55.7982103147414, 57.15963631281919,
  49.81579304444686, 48.63809691275606, 52.76153835286127, 50.401188933497565, 43.95110760165926,
  45.57992170298027, 42.54534030654846, 44.09945637890424, 44.524720536432,
] as const;

function referenceCandles(): ReadonlyArray<Candle> {
  return REFERENCE_CLOSES.map((close, index) => ({
    symbol: 'BTCUSDT',
    timeframe: Timeframe.D1,
    openTime: new Date(Date.UTC(2026, 0, index + 1)).toISOString(),
    closeTime: new Date(Date.UTC(2026, 0, index + 2)).toISOString(),
    open: close,
    high: close + 1,
    low: close - 1,
    close,
    volume: 100 + index,
  }));
}

describe('RsiIndicator (US013)', () => {
  const rsi = new RsiIndicator();

  it('exposes its stable identity', () => {
    expect(rsi.id()).toBe(RSI_INDICATOR_ID);
    expect(rsi.id()).toBe('rsi');
    expect(rsi.name()).toBe('Relative Strength Index');
  });

  it('matches the full-precision Wilder reference dataset', () => {
    const result = rsi.calculate({ series: referenceCandles(), period: 14 });
    expect(result.values).toEqual(EXPECTED_RSI_14);
    expect(result.metadata).toEqual({ period: 14, inputLength: 38, calculatedLength: 24 });
  });

  it('supports configurable periods and defined zero-loss boundaries', () => {
    expect(rsi.calculate({ series: [1, 2, 3, 4], period: 2 }).values).toEqual([100, 100]);
    expect(rsi.calculate({ series: [4, 3, 2, 1], period: 2 }).values).toEqual([0, 0]);
    expect(rsi.calculate({ series: [2, 2, 2], period: 2 }).values).toEqual([0]);
  });

  it('returns an immutable deterministic result without mutating input', () => {
    const series = [1, 3, 2, 5, 4];
    const first = rsi.calculate({ series, period: 2 });
    expect(first).toEqual(rsi.calculate({ series, period: 2 }));
    expect(Object.isFrozen(first)).toBe(true);
    expect(Object.isFrozen(first.values)).toBe(true);
    expect(series).toEqual([1, 3, 2, 5, 4]);
  });

  it('rejects invalid periods, insufficient data, and invalid values', () => {
    expect(() => rsi.calculate({ series: [1, 2], period: 0 })).toThrow(InvalidIndicatorPeriodError);
    expect(() => rsi.calculate({ series: [1, 2, 3], period: 1.5 })).toThrow(
      InvalidIndicatorPeriodError,
    );
    expect(() => rsi.calculate({ series: [1, 2], period: 2 })).toThrow(
      InsufficientIndicatorInputError,
    );
    expect(() => rsi.calculate({ series: [], period: 2 })).toThrow(InvalidIndicatorInputError);
    expect(() => rsi.calculate({ series: [1, NaN, 3], period: 2 })).toThrow(
      InvalidIndicatorInputError,
    );
    expect(() => rsi.calculate({ series: [1, Infinity, 3], period: 2 })).toThrow(
      InvalidIndicatorInputError,
    );
  });
});
