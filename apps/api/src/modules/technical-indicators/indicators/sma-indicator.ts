import { assertPeriod, assertSeriesLength, toNumericSeries } from '../domain/indicator-input';
import { createIndicatorResult, type IndicatorResult } from '../domain/indicator-result';
import type { SeriesIndicator, SeriesIndicatorInput } from './series-indicator';

export const SMA_INDICATOR_ID = 'sma';

/**
 * Simple Moving Average (US011).
 * values[i] = mean of the `period` inputs ending at input index (period - 1 + i).
 * Computed with a rolling sum — O(n) regardless of period. Pure calculation:
 * stateless, deterministic, never mutates its input.
 */
export class SmaIndicator implements SeriesIndicator {
  id(): string {
    return SMA_INDICATOR_ID;
  }

  name(): string {
    return 'Simple Moving Average';
  }

  calculate(input: SeriesIndicatorInput): IndicatorResult {
    assertPeriod(input.period);
    const series = toNumericSeries(input.series);
    assertSeriesLength(input.period, series.length);

    const values: number[] = [];
    let windowSum = 0;
    for (let i = 0; i < series.length; i += 1) {
      windowSum += series[i];
      if (i >= input.period) {
        windowSum -= series[i - input.period];
      }
      if (i >= input.period - 1) {
        values.push(windowSum / input.period);
      }
    }

    return createIndicatorResult({
      indicatorId: SMA_INDICATOR_ID,
      values,
      metadata: {
        period: input.period,
        inputLength: series.length,
        calculatedLength: values.length,
      },
    });
  }
}
