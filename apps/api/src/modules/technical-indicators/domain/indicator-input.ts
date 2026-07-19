import type { Candle } from '../../market-data-domain/domain/candle';
import {
  InsufficientIndicatorInputError,
  InvalidIndicatorInputError,
  InvalidIndicatorPeriodError,
} from './technical-indicators.error';

/**
 * Accepted input of series-based indicators (US011): either raw numeric
 * values or canonical candles (US006), from which close prices are extracted.
 * Inputs are never mutated.
 */
export type IndicatorSeriesInput = ReadonlyArray<number> | ReadonlyArray<Candle>;

function isCandle(value: number | Candle): value is Candle {
  return typeof value === 'object' && value !== null;
}

/**
 * Normalize an indicator input into a fresh numeric series.
 * Candles contribute their close price. Fails fast on empty input and on any
 * non-finite value (NaN, Infinity) so indicators never compute on garbage.
 */
export function toNumericSeries(input: IndicatorSeriesInput): ReadonlyArray<number> {
  if (!Array.isArray(input)) {
    throw new InvalidIndicatorInputError('Indicator input must be an array');
  }
  if (input.length === 0) {
    throw new InvalidIndicatorInputError('Indicator input must not be empty');
  }

  const series = (input as ReadonlyArray<number | Candle>).map((value, index) => {
    const numeric = isCandle(value) ? value.close : value;
    if (typeof numeric !== 'number' || !Number.isFinite(numeric)) {
      throw new InvalidIndicatorInputError(
        `Indicator input contains a non-finite value at index ${index}: ${String(numeric)}`,
      );
    }
    return numeric;
  });

  return Object.freeze(series);
}

/** Fail fast unless the period is a positive integer. */
export function assertPeriod(period: number): void {
  if (!Number.isInteger(period) || period <= 0) {
    throw new InvalidIndicatorPeriodError(period);
  }
}

/** Fail fast unless the series is long enough for the period. */
export function assertSeriesLength(period: number, inputLength: number): void {
  if (inputLength < period) {
    throw new InsufficientIndicatorInputError(period, inputLength);
  }
}
