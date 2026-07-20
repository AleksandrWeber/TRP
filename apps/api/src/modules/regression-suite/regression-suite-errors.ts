/**
 * Application errors for US198 Regression Suite.
 */

export type RegressionSuiteErrorCode =
  | 'REGRESSION_SUITE_VALIDATION'
  | 'REGRESSION_SUITE_ALREADY_COMPLETED'
  | 'REGRESSION_SUITE_DUPLICATE_EXECUTION'
  | 'REGRESSION_SUITE_EXECUTION_FAILED'
  | 'REGRESSION_SUITE_REGRESSION_DETECTED';

export abstract class RegressionSuiteError extends Error {
  abstract readonly code: RegressionSuiteErrorCode;

  protected constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

export class RegressionSuiteValidationError extends RegressionSuiteError {
  readonly code = 'REGRESSION_SUITE_VALIDATION' as const;
  readonly cause: unknown | undefined;

  constructor(message: string, cause?: unknown) {
    super(message);
    this.cause = cause;
  }
}

export class RegressionSuiteAlreadyCompletedError extends RegressionSuiteError {
  readonly code = 'REGRESSION_SUITE_ALREADY_COMPLETED' as const;

  constructor(suiteId: string) {
    super(`Regression suite already completed for suite: ${suiteId}`);
  }
}

export class RegressionSuiteDuplicateExecutionError extends RegressionSuiteError {
  readonly code = 'REGRESSION_SUITE_DUPLICATE_EXECUTION' as const;

  constructor() {
    super('Regression suite execution is already in progress');
  }
}

export class RegressionSuiteExecutionFailedError extends RegressionSuiteError {
  readonly code = 'REGRESSION_SUITE_EXECUTION_FAILED' as const;
  readonly cause: unknown | undefined;

  constructor(message: string, cause?: unknown) {
    super(message);
    this.cause = cause;
  }
}

export class RegressionSuiteRegressionDetectedError extends RegressionSuiteError {
  readonly code = 'REGRESSION_SUITE_REGRESSION_DETECTED' as const;

  constructor(suiteId: string, regressionsDetected: number) {
    super(`Regression suite detected ${regressionsDetected} regression(s) for suite: ${suiteId}`);
  }
}
