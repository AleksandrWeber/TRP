import { describe, expect, it } from 'vitest';
import type { Candle } from '../../market-data-domain/domain/candle';
import { Timeframe } from '../../market-data-domain/domain/timeframe';
import { assertPeriod, assertSeriesLength, toNumericSeries } from './indicator-input';
import {
  InsufficientIndicatorInputError,
  InvalidIndicatorInputError,
  InvalidIndicatorPeriodError,
} from './technical-indicators.error';

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

describe('toNumericSeries (US011)', () => {
  it('passes a numeric series through untouched', () => {
    expect(toNumericSeries([1, 2, 3])).toEqual([1, 2, 3]);
  });

  it('extracts close prices from candles', () => {
    expect(toNumericSeries([candle(10), candle(20), candle(30)])).toEqual([10, 20, 30]);
  });

  it('returns a frozen copy and never mutates the input', () => {
    const input = [1, 2, 3];
    const series = toNumericSeries(input);
    expect(Object.isFrozen(series)).toBe(true);
    expect(series).not.toBe(input);
    expect(input).toEqual([1, 2, 3]);
  });

  it('rejects empty input', () => {
    expect(() => toNumericSeries([])).toThrow(InvalidIndicatorInputError);
    expect(() => toNumericSeries([])).toThrow(/must not be empty/);
  });

  it('rejects NaN with the offending index', () => {
    expect(() => toNumericSeries([1, NaN, 3])).toThrow(InvalidIndicatorInputError);
    expect(() => toNumericSeries([1, NaN, 3])).toThrow(/index 1/);
  });

  it('rejects Infinity', () => {
    expect(() => toNumericSeries([1, 2, Infinity])).toThrow(InvalidIndicatorInputError);
    expect(() => toNumericSeries([-Infinity])).toThrow(InvalidIndicatorInputError);
  });

  it('rejects non-array input', () => {
    expect(() => toNumericSeries('abc' as unknown as number[])).toThrow(InvalidIndicatorInputError);
  });

  it('rejects non-numeric values smuggled through the type system', () => {
    expect(() => toNumericSeries(['5' as unknown as number])).toThrow(InvalidIndicatorInputError);
  });
});

describe('assertPeriod (US011)', () => {
  it('accepts positive integers', () => {
    expect(() => assertPeriod(1)).not.toThrow();
    expect(() => assertPeriod(200)).not.toThrow();
  });

  it.each([0, -1, 1.5, NaN, Infinity])('rejects invalid period %p', (period) => {
    expect(() => assertPeriod(period)).toThrow(InvalidIndicatorPeriodError);
  });
});

describe('assertSeriesLength (US011)', () => {
  it('accepts input length >= period', () => {
    expect(() => assertSeriesLength(3, 3)).not.toThrow();
    expect(() => assertSeriesLength(3, 10)).not.toThrow();
  });

  it('rejects input shorter than the period', () => {
    expect(() => assertSeriesLength(5, 4)).toThrow(InsufficientIndicatorInputError);
    expect(() => assertSeriesLength(5, 4)).toThrow(/\(4\).*\(5\)/);
  });
});
