import { describe, expect, it } from 'vitest';
import type { Candle } from '../../market-data-domain/domain/candle';
import { Timeframe } from '../../market-data-domain/domain/timeframe';
import {
  InsufficientIndicatorInputError,
  InvalidIndicatorInputError,
  InvalidIndicatorPeriodError,
} from '../domain/technical-indicators.error';
import { SMA_INDICATOR_ID, SmaIndicator } from './sma-indicator';

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

describe('SmaIndicator (US011)', () => {
  const sma = new SmaIndicator();

  it('exposes the stable id and human-readable name', () => {
    expect(sma.id()).toBe(SMA_INDICATOR_ID);
    expect(sma.id()).toBe('sma');
    expect(sma.name()).toBe('Simple Moving Average');
  });

  it('computes the standard SMA over a numeric series', () => {
    const result = sma.calculate({ series: [1, 2, 3, 4, 5], period: 3 });
    expect(result.values).toEqual([2, 3, 4]);
  });

  it('computes the SMA over candle close prices', () => {
    const result = sma.calculate({
      series: [candle(10), candle(20), candle(30), candle(40)],
      period: 2,
    });
    expect(result.values).toEqual([15, 25, 35]);
  });

  it('returns a single value when input length equals the period', () => {
    const result = sma.calculate({ series: [2, 4, 6], period: 3 });
    expect(result.values).toEqual([4]);
  });

  it('behaves as identity for period 1', () => {
    const result = sma.calculate({ series: [7, 8, 9], period: 1 });
    expect(result.values).toEqual([7, 8, 9]);
  });

  it('populates metadata with period, inputLength and calculatedLength', () => {
    const result = sma.calculate({ series: [1, 2, 3, 4, 5], period: 3 });
    expect(result).toMatchObject({
      indicatorId: 'sma',
      metadata: { period: 3, inputLength: 5, calculatedLength: 3 },
    });
  });

  it('returns an immutable result and never mutates the input', () => {
    const series = [1, 2, 3, 4];
    const result = sma.calculate({ series, period: 2 });
    expect(Object.isFrozen(result)).toBe(true);
    expect(Object.isFrozen(result.values)).toBe(true);
    expect(series).toEqual([1, 2, 3, 4]);
  });

  it('is deterministic for identical input', () => {
    const input = { series: [3, 1, 4, 1, 5, 9, 2, 6], period: 4 };
    expect(sma.calculate(input)).toEqual(sma.calculate(input));
  });

  it('rejects an invalid period', () => {
    expect(() => sma.calculate({ series: [1, 2, 3], period: 0 })).toThrow(
      InvalidIndicatorPeriodError,
    );
    expect(() => sma.calculate({ series: [1, 2, 3], period: 1.5 })).toThrow(
      InvalidIndicatorPeriodError,
    );
    expect(() => sma.calculate({ series: [1, 2, 3], period: -2 })).toThrow(
      InvalidIndicatorPeriodError,
    );
  });

  it('rejects input shorter than the period', () => {
    expect(() => sma.calculate({ series: [1, 2], period: 3 })).toThrow(
      InsufficientIndicatorInputError,
    );
  });

  it('rejects empty input and non-finite values', () => {
    expect(() => sma.calculate({ series: [], period: 1 })).toThrow(InvalidIndicatorInputError);
    expect(() => sma.calculate({ series: [1, NaN, 3], period: 2 })).toThrow(
      InvalidIndicatorInputError,
    );
    expect(() => sma.calculate({ series: [1, Infinity, 3], period: 2 })).toThrow(
      InvalidIndicatorInputError,
    );
  });
});
