import type { Indicator } from '../domain/indicator';
import { assertPeriod, assertSeriesLength, toNumericSeries } from '../domain/indicator-input';
import { InvalidIndicatorInputError } from '../domain/technical-indicators.error';
import type { IndicatorSeriesInput } from '../domain/indicator-input';

export const MACD_INDICATOR_ID = 'macd';

export type MacdInput = Readonly<{
  series: IndicatorSeriesInput;
  fastPeriod: number;
  slowPeriod: number;
  signalPeriod: number;
}>;

export type MacdResult = Readonly<{
  indicatorId: typeof MACD_INDICATOR_ID;
  fastEma: ReadonlyArray<number>;
  slowEma: ReadonlyArray<number>;
  macd: ReadonlyArray<number>;
  signal: ReadonlyArray<number>;
  histogram: ReadonlyArray<number>;
  metadata: Readonly<{
    fastPeriod: number;
    slowPeriod: number;
    signalPeriod: number;
    inputLength: number;
    calculatedLength: number;
    startIndex: number;
  }>;
}>;

/**
 * Moving Average Convergence/Divergence using SMA-seeded EMAs.
 * All returned series are aligned to the first input where the signal EMA is available.
 */
export class MacdIndicator implements Indicator<MacdInput, MacdResult> {
  id(): string {
    return MACD_INDICATOR_ID;
  }

  name(): string {
    return 'Moving Average Convergence/Divergence';
  }

  calculate(input: MacdInput): MacdResult {
    assertPeriod(input.fastPeriod);
    assertPeriod(input.slowPeriod);
    assertPeriod(input.signalPeriod);
    if (input.fastPeriod >= input.slowPeriod) {
      throw new InvalidIndicatorInputError('MACD fastPeriod must be less than slowPeriod');
    }

    const series = toNumericSeries(input.series);
    const requiredLength = input.slowPeriod + input.signalPeriod - 1;
    assertSeriesLength(requiredLength, series.length);

    const fast = calculateEma(series, input.fastPeriod);
    const slow = calculateEma(series, input.slowPeriod);
    const macdFromSlowStart = new Array<number>(series.length - input.slowPeriod + 1);
    for (let i = input.slowPeriod - 1; i < series.length; i += 1) {
      macdFromSlowStart[i - (input.slowPeriod - 1)] =
        fast[i - (input.fastPeriod - 1)] - slow[i - (input.slowPeriod - 1)];
    }

    const signal = calculateEma(macdFromSlowStart, input.signalPeriod);
    const startIndex = requiredLength - 1;
    const calculatedLength = series.length - startIndex;
    const fastEma = fast.slice(startIndex - (input.fastPeriod - 1));
    const slowEma = slow.slice(startIndex - (input.slowPeriod - 1));
    const macd = macdFromSlowStart.slice(input.signalPeriod - 1);
    const histogram = new Array<number>(calculatedLength);
    for (let i = 0; i < calculatedLength; i += 1) {
      histogram[i] = macd[i] - signal[i];
    }

    return Object.freeze({
      indicatorId: MACD_INDICATOR_ID,
      fastEma: freezeFiniteSeries('fastEma', fastEma),
      slowEma: freezeFiniteSeries('slowEma', slowEma),
      macd: freezeFiniteSeries('macd', macd),
      signal: freezeFiniteSeries('signal', signal),
      histogram: freezeFiniteSeries('histogram', histogram),
      metadata: Object.freeze({
        fastPeriod: input.fastPeriod,
        slowPeriod: input.slowPeriod,
        signalPeriod: input.signalPeriod,
        inputLength: series.length,
        calculatedLength,
        startIndex,
      }),
    });
  }
}

function calculateEma(series: ReadonlyArray<number>, period: number): number[] {
  let seed = 0;
  for (let i = 0; i < period; i += 1) seed += series[i];
  seed /= period;

  const smoothing = 2 / (period + 1);
  const values = [seed];
  for (let i = period; i < series.length; i += 1) {
    values.push(series[i] * smoothing + values[values.length - 1] * (1 - smoothing));
  }
  return values;
}

function freezeFiniteSeries(name: string, values: ReadonlyArray<number>): ReadonlyArray<number> {
  for (const [index, value] of values.entries()) {
    if (!Number.isFinite(value)) {
      throw new InvalidIndicatorInputError(
        `MACD ${name} contains a non-finite value at index ${index}: ${String(value)}`,
      );
    }
  }
  return Object.freeze([...values]);
}
