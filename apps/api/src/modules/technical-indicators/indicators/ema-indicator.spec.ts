import { describe, expect, it } from 'vitest';
import type { Candle } from '../../market-data-domain/domain/candle';
import { Timeframe } from '../../market-data-domain/domain/timeframe';
import {
  InsufficientIndicatorInputError,
  InvalidIndicatorInputError,
  InvalidIndicatorPeriodError,
} from '../domain/technical-indicators.error';
import { EMA_INDICATOR_ID, EmaIndicator } from './ema-indicator';

function candle(close: number): Candle {
  return {
    symbol: 'BTCUSDT',
    timeframe: Timeframe.H1,
    openTime: '2026-01-01T00:00:00.000Z',
    closeTime: '2026-01-01T01:00:00.000Z',
    open: close,
    high: close,
    low: close,
    close,
    volume: 1,
  };
}

describe('EmaIndicator (US011)', () => {
  const ema = new EmaIndicator();

  it('exposes the stable id and human-readable name', () => {
    expect(ema.id()).toBe(EMA_INDICATOR_ID);
    expect(ema.id()).toBe('ema');
    expect(ema.name()).toBe('Exponential Moving Average');
  });

  it('seeds the first value with the SMA of the first period inputs', () => {
    const result = ema.calculate({ series: [2, 4, 6], period: 3 });
    expect(result.values).toEqual([4]);
  });

  it('applies the standard smoothing 2 / (period + 1)', () => {
    // period 3 → k = 0.5; seed = SMA(1,2,3) = 2
    // EMA[1] = 4 * 0.5 + 2 * 0.5 = 3
    // EMA[2] = 5 * 0.5 + 3 * 0.5 = 4
    const result = ema.calculate({ series: [1, 2, 3, 4, 5], period: 3 });
    expect(result.values).toEqual([2, 3, 4]);
  });

  it('computes the EMA over candle close prices', () => {
    // period 1 → k = 1: EMA equals the raw closes
    const result = ema.calculate({ series: [candle(10), candle(20), candle(30)], period: 1 });
    expect(result.values).toEqual([10, 20, 30]);
  });

  it('weights recent values more than the SMA does', () => {
    // Constant series then a jump — EMA must move toward the jump.
    const result = ema.calculate({ series: [10, 10, 10, 10, 20], period: 4 });
    const last = result.values[result.values.length - 1];
    expect(last).toBeCloseTo(10 + (20 - 10) * (2 / 5), 10);
  });

  it('populates metadata with period, inputLength and calculatedLength', () => {
    const result = ema.calculate({ series: [1, 2, 3, 4, 5], period: 3 });
    expect(result).toMatchObject({
      indicatorId: 'ema',
      metadata: { period: 3, inputLength: 5, calculatedLength: 3 },
    });
  });

  it('returns an immutable result and never mutates the input', () => {
    const series = [1, 2, 3, 4];
    const result = ema.calculate({ series, period: 2 });
    expect(Object.isFrozen(result)).toBe(true);
    expect(Object.isFrozen(result.values)).toBe(true);
    expect(series).toEqual([1, 2, 3, 4]);
  });

  it('is deterministic for identical input', () => {
    const input = { series: [3, 1, 4, 1, 5, 9, 2, 6], period: 4 };
    expect(ema.calculate(input)).toEqual(ema.calculate(input));
  });

  it('rejects an invalid period', () => {
    expect(() => ema.calculate({ series: [1, 2, 3], period: 0 })).toThrow(
      InvalidIndicatorPeriodError,
    );
    expect(() => ema.calculate({ series: [1, 2, 3], period: 2.5 })).toThrow(
      InvalidIndicatorPeriodError,
    );
  });

  it('rejects input shorter than the period', () => {
    expect(() => ema.calculate({ series: [1, 2], period: 3 })).toThrow(
      InsufficientIndicatorInputError,
    );
  });

  it('rejects empty input and non-finite values', () => {
    expect(() => ema.calculate({ series: [], period: 1 })).toThrow(InvalidIndicatorInputError);
    expect(() => ema.calculate({ series: [1, NaN, 3], period: 2 })).toThrow(
      InvalidIndicatorInputError,
    );
    expect(() => ema.calculate({ series: [1, -Infinity, 3], period: 2 })).toThrow(
      InvalidIndicatorInputError,
    );
  });
});
