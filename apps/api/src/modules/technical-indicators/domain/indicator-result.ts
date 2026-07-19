import { InvalidIndicatorInputError } from './technical-indicators.error';

/** Calculation diagnostics attached to every indicator result. */
export type IndicatorMetadata = Readonly<{
  /** Look-back window the indicator was configured with. */
  period: number;
  /** Number of input points the calculation received. */
  inputLength: number;
  /** Number of output values actually produced. */
  calculatedLength: number;
}>;

/**
 * Canonical, immutable output of every indicator (US011).
 * Values are ordered oldest → newest and aligned to the *end* of the input
 * series: values[i] corresponds to input index (inputLength - calculatedLength + i).
 */
export type IndicatorResult = Readonly<{
  indicatorId: string;
  values: ReadonlyArray<number>;
  metadata: IndicatorMetadata;
}>;

/**
 * Validating factory — rejects malformed results so a misbehaving indicator
 * can never hand an invalid result to consumers. Returned objects are deeply
 * frozen; inputs are copied, never mutated.
 */
export function createIndicatorResult(input: IndicatorResult): IndicatorResult {
  if (input.indicatorId.trim() === '') {
    throw new InvalidIndicatorInputError('IndicatorResult indicatorId must not be empty');
  }
  for (const [index, value] of input.values.entries()) {
    if (!Number.isFinite(value)) {
      throw new InvalidIndicatorInputError(
        `IndicatorResult values contain a non-finite value at index ${index}: ${String(value)}`,
      );
    }
  }
  const { period, inputLength, calculatedLength } = input.metadata;
  if (!Number.isInteger(period) || period <= 0) {
    throw new InvalidIndicatorInputError(
      'IndicatorResult metadata.period must be a positive integer',
    );
  }
  if (!Number.isInteger(inputLength) || inputLength <= 0) {
    throw new InvalidIndicatorInputError(
      'IndicatorResult metadata.inputLength must be a positive integer',
    );
  }
  if (calculatedLength !== input.values.length) {
    throw new InvalidIndicatorInputError(
      'IndicatorResult metadata.calculatedLength must match values.length',
    );
  }

  return Object.freeze({
    indicatorId: input.indicatorId,
    values: Object.freeze([...input.values]),
    metadata: Object.freeze({ period, inputLength, calculatedLength }),
  });
}
