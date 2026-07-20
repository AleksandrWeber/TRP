/**
 * Deterministic replay validation metrics for US197.
 *
 * No trading metrics, PnL, Sharpe, drawdown, or equity curve.
 */

export type DeterministicReplayValidationMetrics = Readonly<{
  iterations: number;
  successfulIterations: number;
  failedIterations: number;
  replayCount: number;
  validationDuration: number;
}>;

export function createDeterministicReplayValidationMetrics(
  properties: DeterministicReplayValidationMetrics,
): DeterministicReplayValidationMetrics {
  return Object.freeze({
    iterations: positiveInteger(properties.iterations, 'iterations'),
    successfulIterations: nonNegativeInteger(
      properties.successfulIterations,
      'successfulIterations',
    ),
    failedIterations: nonNegativeInteger(properties.failedIterations, 'failedIterations'),
    replayCount: nonNegativeInteger(properties.replayCount, 'replayCount'),
    validationDuration: nonNegativeInteger(properties.validationDuration, 'validationDuration'),
  });
}

function nonNegativeInteger(value: number, field: string): number {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`${field} must be a non-negative integer`);
  }
  return value;
}

function positiveInteger(value: number, field: string): number {
  if (!Number.isInteger(value) || value < 1) {
    throw new Error(`${field} must be a positive integer`);
  }
  return value;
}
