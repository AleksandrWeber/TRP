import type { Indicator } from '../domain/indicator';
import type { IndicatorSeriesInput } from '../domain/indicator-input';
import { assertPeriod, assertSeriesLength, toNumericSeries } from '../domain/indicator-input';
import { InvalidIndicatorInputError } from '../domain/technical-indicators.error';

export const BOLLINGER_BANDS_INDICATOR_ID = 'bollinger';

export type BollingerBandsInput = Readonly<{
  series: IndicatorSeriesInput;
  period: number;
  multiplier: number;
}>;

export type BollingerBandsResult = Readonly<{
  indicatorId: typeof BOLLINGER_BANDS_INDICATOR_ID;
  middle: ReadonlyArray<number>;
  upper: ReadonlyArray<number>;
  lower: ReadonlyArray<number>;
  standardDeviation: ReadonlyArray<number>;
  metadata: Readonly<{
    period: number;
    multiplier: number;
    inputLength: number;
    calculatedLength: number;
  }>;
}>;

/**
 * Bollinger Bands: rolling SMA ± multiplier × population standard deviation.
 * Rolling first and second moments keep calculation O(n) and avoid window allocations.
 */
export class BollingerBandsIndicator implements Indicator<
  BollingerBandsInput,
  BollingerBandsResult
> {
  id(): string {
    return BOLLINGER_BANDS_INDICATOR_ID;
  }

  name(): string {
    return 'Bollinger Bands';
  }

  calculate(input: BollingerBandsInput): BollingerBandsResult {
    assertPeriod(input.period);
    if (!Number.isFinite(input.multiplier) || input.multiplier <= 0) {
      throw new InvalidIndicatorInputError(
        `Bollinger Bands multiplier must be a finite positive number, received: ${String(input.multiplier)}`,
      );
    }

    const series = toNumericSeries(input.series);
    assertSeriesLength(input.period, series.length);

    const calculatedLength = series.length - input.period + 1;
    const middle = new Array<number>(calculatedLength);
    const upper = new Array<number>(calculatedLength);
    const lower = new Array<number>(calculatedLength);
    const standardDeviation = new Array<number>(calculatedLength);
    let sum = 0;
    let sumOfSquares = 0;

    for (let i = 0; i < series.length; i += 1) {
      const value = series[i];
      sum += value;
      sumOfSquares += value * value;
      if (i >= input.period) {
        const expired = series[i - input.period];
        sum -= expired;
        sumOfSquares -= expired * expired;
      }
      if (i < input.period - 1) continue;

      const outputIndex = i - (input.period - 1);
      const mean = sum / input.period;
      const variance = Math.max(0, sumOfSquares / input.period - mean * mean);
      const deviation = Math.sqrt(variance);
      middle[outputIndex] = mean;
      standardDeviation[outputIndex] = deviation;
      upper[outputIndex] = mean + input.multiplier * deviation;
      lower[outputIndex] = mean - input.multiplier * deviation;
    }

    return Object.freeze({
      indicatorId: BOLLINGER_BANDS_INDICATOR_ID,
      middle: freezeFiniteSeries('middle', middle),
      upper: freezeFiniteSeries('upper', upper),
      lower: freezeFiniteSeries('lower', lower),
      standardDeviation: freezeFiniteSeries('standardDeviation', standardDeviation),
      metadata: Object.freeze({
        period: input.period,
        multiplier: input.multiplier,
        inputLength: series.length,
        calculatedLength,
      }),
    });
  }
}

function freezeFiniteSeries(name: string, values: ReadonlyArray<number>): ReadonlyArray<number> {
  for (const [index, value] of values.entries()) {
    if (!Number.isFinite(value)) {
      throw new InvalidIndicatorInputError(
        `Bollinger Bands ${name} contains a non-finite value at index ${index}: ${String(value)}`,
      );
    }
  }
  return Object.freeze([...values]);
}
