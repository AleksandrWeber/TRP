export const INVALID_EVALUATOR_CONFIG_ERROR_CODE = 'INVALID_EVALUATOR_CONFIG' as const;

/**
 * Evaluator configuration error (US014).
 * Raised when strategy.parameters carry values the evaluator cannot act on
 * (invalid thresholds, fast >= slow, non-positive multiplier, wrong types).
 * Deliberately separate from TechnicalIndicatorsError: the indicator engine
 * (US011, stable) stays untouched, while these strategy-layer mistakes are
 * still caller-fixable and map to HTTP 400 via EvaluatorConfigErrorFilter.
 */
export class InvalidEvaluatorConfigError extends Error {
  readonly code = INVALID_EVALUATOR_CONFIG_ERROR_CODE;

  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}
