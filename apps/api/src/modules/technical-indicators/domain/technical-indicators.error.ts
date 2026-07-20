export const TECHNICAL_INDICATORS_ERROR_CODES = [
  'INVALID_INPUT',
  'INVALID_PERIOD',
  'INSUFFICIENT_INPUT',
  'DUPLICATE_INDICATOR',
  'UNKNOWN_INDICATOR',
] as const;
export type TechnicalIndicatorsErrorCode = (typeof TECHNICAL_INDICATORS_ERROR_CODES)[number];

/**
 * Canonical error boundary of the Technical Indicators Engine (US011).
 * Mirrors the SignalEngineError policy (US009): every calculation failure is
 * one of these errors so consumers can handle indicator failures uniformly.
 * The module has no HTTP surface, so there is no filter — callers that expose
 * indicators over HTTP map these codes themselves.
 */
export abstract class TechnicalIndicatorsError extends Error {
  abstract readonly code: TechnicalIndicatorsErrorCode;

  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

/** The input series is missing, empty, or contains non-finite values. */
export class InvalidIndicatorInputError extends TechnicalIndicatorsError {
  readonly code = 'INVALID_INPUT' as const;
}

/** The requested period is not a positive integer. */
export class InvalidIndicatorPeriodError extends TechnicalIndicatorsError {
  readonly code = 'INVALID_PERIOD' as const;

  constructor(period: number) {
    super(`Indicator period must be a positive integer, received: ${period}`);
  }
}

/** The input series is shorter than the requested period. */
export class InsufficientIndicatorInputError extends TechnicalIndicatorsError {
  readonly code = 'INSUFFICIENT_INPUT' as const;

  constructor(period: number, inputLength: number) {
    super(`Indicator input length (${inputLength}) must be >= period (${period})`);
  }
}

/** An indicator with the same id is already registered. */
export class DuplicateIndicatorError extends TechnicalIndicatorsError {
  readonly code = 'DUPLICATE_INDICATOR' as const;

  constructor(indicatorId: string) {
    super(`Indicator already registered: ${indicatorId}`);
  }
}

/** The requested indicator id is not registered. */
export class UnknownIndicatorError extends TechnicalIndicatorsError {
  readonly code = 'UNKNOWN_INDICATOR' as const;

  constructor(indicatorId: string, registered: ReadonlyArray<string>) {
    super(`Unknown indicator '${indicatorId}' — registered indicators: ${registered.join(', ')}`);
  }
}
