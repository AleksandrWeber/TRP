export { TechnicalIndicatorsModule } from './technical-indicators.module';
export { IndicatorRegistry } from './indicator-registry';
export type { Indicator } from './domain/indicator';
export { createIndicatorResult } from './domain/indicator-result';
export type { IndicatorMetadata, IndicatorResult } from './domain/indicator-result';
export { assertPeriod, assertSeriesLength, toNumericSeries } from './domain/indicator-input';
export type { IndicatorSeriesInput } from './domain/indicator-input';
export type { SeriesIndicator, SeriesIndicatorInput } from './indicators/series-indicator';
export { SmaIndicator, SMA_INDICATOR_ID } from './indicators/sma-indicator';
export { EmaIndicator, EMA_INDICATOR_ID } from './indicators/ema-indicator';
export {
  TechnicalIndicatorsError,
  InvalidIndicatorInputError,
  InvalidIndicatorPeriodError,
  InsufficientIndicatorInputError,
  DuplicateIndicatorError,
  UnknownIndicatorError,
  TECHNICAL_INDICATORS_ERROR_CODES,
} from './domain/technical-indicators.error';
export type { TechnicalIndicatorsErrorCode } from './domain/technical-indicators.error';
