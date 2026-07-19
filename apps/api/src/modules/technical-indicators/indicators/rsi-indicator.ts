import { assertPeriod, assertSeriesLength, toNumericSeries } from '../domain/indicator-input';
import { createIndicatorResult, type IndicatorResult } from '../domain/indicator-result';
import type { SeriesIndicator, SeriesIndicatorInput } from './series-indicator';

export const RSI_INDICATOR_ID = 'rsi';

/**
 * Relative Strength Index using Wilder's original smoothing (alpha = 1 / period).
 * The first value uses simple averages of the first `period` price changes.
 */
export class RsiIndicator implements SeriesIndicator {
  id(): string {
    return RSI_INDICATOR_ID;
  }

  name(): string {
    return 'Relative Strength Index';
  }

  calculate(input: SeriesIndicatorInput): IndicatorResult {
    assertPeriod(input.period);
    const series = toNumericSeries(input.series);
    assertSeriesLength(input.period + 1, series.length);

    let averageGain = 0;
    let averageLoss = 0;
    for (let i = 1; i <= input.period; i += 1) {
      const change = series[i] - series[i - 1];
      averageGain += Math.max(change, 0);
      averageLoss += Math.max(-change, 0);
    }
    averageGain /= input.period;
    averageLoss /= input.period;

    const values: number[] = [calculateRsi(averageGain, averageLoss)];
    for (let i = input.period + 1; i < series.length; i += 1) {
      const change = series[i] - series[i - 1];
      const gain = Math.max(change, 0);
      const loss = Math.max(-change, 0);
      averageGain = (averageGain * (input.period - 1) + gain) / input.period;
      averageLoss = (averageLoss * (input.period - 1) + loss) / input.period;
      values.push(calculateRsi(averageGain, averageLoss));
    }

    return createIndicatorResult({
      indicatorId: RSI_INDICATOR_ID,
      values,
      metadata: {
        period: input.period,
        inputLength: series.length,
        calculatedLength: values.length,
      },
    });
  }
}

function calculateRsi(averageGain: number, averageLoss: number): number {
  if (averageGain === 0) return 0;
  if (averageLoss === 0) return 100;
  return 100 - 100 / (1 + averageGain / averageLoss);
}
