import { assertPeriod, assertSeriesLength, toNumericSeries } from '../domain/indicator-input';
import { createIndicatorResult, type IndicatorResult } from '../domain/indicator-result';
import type { SeriesIndicator, SeriesIndicatorInput } from './series-indicator';

export const EMA_INDICATOR_ID = 'ema';

/**
 * Exponential Moving Average (US011).
 * Standard smoothing k = 2 / (period + 1); the first EMA value is seeded with
 * the SMA of the first `period` inputs, then EMA[i] = value * k + EMA[i-1] * (1 - k).
 * Pure calculation: stateless, deterministic, never mutates its input.
 */
export class EmaIndicator implements SeriesIndicator {
  id(): string {
    return EMA_INDICATOR_ID;
  }

  name(): string {
    return 'Exponential Moving Average';
  }

  calculate(input: SeriesIndicatorInput): IndicatorResult {
    assertPeriod(input.period);
    const series = toNumericSeries(input.series);
    assertSeriesLength(input.period, series.length);

    const smoothing = 2 / (input.period + 1);

    let seed = 0;
    for (let i = 0; i < input.period; i += 1) {
      seed += series[i];
    }
    seed /= input.period;

    const values: number[] = [seed];
    for (let i = input.period; i < series.length; i += 1) {
      const previous = values[values.length - 1];
      values.push(series[i] * smoothing + previous * (1 - smoothing));
    }

    return createIndicatorResult({
      indicatorId: EMA_INDICATOR_ID,
      values,
      metadata: {
        period: input.period,
        inputLength: series.length,
        calculatedLength: values.length,
      },
    });
  }
}
