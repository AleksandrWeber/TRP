/**
 * Application errors for US199 Chaos Testing.
 */

export type ChaosTestingErrorCode =
  | 'CHAOS_TESTING_VALIDATION'
  | 'CHAOS_TESTING_ALREADY_COMPLETED'
  | 'CHAOS_TESTING_DUPLICATE_EXECUTION'
  | 'CHAOS_TESTING_EXECUTION_FAILED'
  | 'CHAOS_TESTING_SCENARIO_FAILED';

export abstract class ChaosTestingError extends Error {
  abstract readonly code: ChaosTestingErrorCode;

  protected constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

export class ChaosTestingValidationError extends ChaosTestingError {
  readonly code = 'CHAOS_TESTING_VALIDATION' as const;
  readonly cause: unknown | undefined;

  constructor(message: string, cause?: unknown) {
    super(message);
    this.cause = cause;
  }
}

export class ChaosTestingAlreadyCompletedError extends ChaosTestingError {
  readonly code = 'CHAOS_TESTING_ALREADY_COMPLETED' as const;

  constructor(suiteId: string) {
    super(`Chaos testing already completed for suite: ${suiteId}`);
  }
}

export class ChaosTestingDuplicateExecutionError extends ChaosTestingError {
  readonly code = 'CHAOS_TESTING_DUPLICATE_EXECUTION' as const;

  constructor() {
    super('Chaos testing execution is already in progress');
  }
}

export class ChaosTestingExecutionFailedError extends ChaosTestingError {
  readonly code = 'CHAOS_TESTING_EXECUTION_FAILED' as const;
  readonly cause: unknown | undefined;

  constructor(message: string, cause?: unknown) {
    super(message);
    this.cause = cause;
  }
}

export class ChaosTestingScenarioFailedError extends ChaosTestingError {
  readonly code = 'CHAOS_TESTING_SCENARIO_FAILED' as const;
  readonly suiteId: string;
  readonly failedScenarioCount: number;

  constructor(suiteId: string, failedScenarioCount: number) {
    super(`Chaos testing scenario failure for suite: ${suiteId} (${failedScenarioCount} failed)`);
    this.suiteId = suiteId;
    this.failedScenarioCount = failedScenarioCount;
  }
}
