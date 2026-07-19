import type { IndicatorSeriesInput } from '../domain/indicator-input';
import type { Indicator } from '../domain/indicator';
import type { IndicatorResult } from '../domain/indicator-result';

/**
 * Common input of period-based series indicators (SMA, EMA, future RSI…):
 * a numeric or candle series plus a look-back period.
 */
export type SeriesIndicatorInput = Readonly<{
  series: IndicatorSeriesInput;
  period: number;
}>;

/** The indicator shape every period-based series indicator implements. */
export type SeriesIndicator = Indicator<SeriesIndicatorInput, IndicatorResult>;
