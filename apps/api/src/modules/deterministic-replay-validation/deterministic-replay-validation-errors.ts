/**
 * Application errors for US197 Deterministic Replay Validation.
 */

export type DeterministicReplayValidationErrorCode =
  | 'DETERMINISTIC_REPLAY_VALIDATION_VALIDATION'
  | 'DETERMINISTIC_REPLAY_VALIDATION_ALREADY_COMPLETED'
  | 'DETERMINISTIC_REPLAY_VALIDATION_DUPLICATE_EXECUTION'
  | 'DETERMINISTIC_REPLAY_VALIDATION_REPLAY_FAILED'
  | 'DETERMINISTIC_REPLAY_VALIDATION_MISMATCH'
  | 'DETERMINISTIC_REPLAY_VALIDATION_EXECUTION_FAILED';

export abstract class DeterministicReplayValidationError extends Error {
  abstract readonly code: DeterministicReplayValidationErrorCode;

  protected constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

export class DeterministicReplayValidationValidationError extends DeterministicReplayValidationError {
  readonly code = 'DETERMINISTIC_REPLAY_VALIDATION_VALIDATION' as const;
  readonly cause: unknown | undefined;

  constructor(message: string, cause?: unknown) {
    super(message);
    this.cause = cause;
  }
}

export class DeterministicReplayValidationAlreadyCompletedError extends DeterministicReplayValidationError {
  readonly code = 'DETERMINISTIC_REPLAY_VALIDATION_ALREADY_COMPLETED' as const;

  constructor(validationId: string) {
    super(`Deterministic replay validation already completed for validation: ${validationId}`);
  }
}

export class DeterministicReplayValidationDuplicateExecutionError extends DeterministicReplayValidationError {
  readonly code = 'DETERMINISTIC_REPLAY_VALIDATION_DUPLICATE_EXECUTION' as const;

  constructor() {
    super('Deterministic replay validation execution is already in progress');
  }
}

export class DeterministicReplayValidationReplayFailedError extends DeterministicReplayValidationError {
  readonly code = 'DETERMINISTIC_REPLAY_VALIDATION_REPLAY_FAILED' as const;
  readonly cause: unknown | undefined;
  readonly iteration: number;

  constructor(iteration: number, cause?: unknown) {
    super(`Deterministic replay validation replay failed for iteration: ${iteration}`);
    this.iteration = iteration;
    this.cause = cause;
  }
}

export class DeterministicReplayValidationMismatchError extends DeterministicReplayValidationError {
  readonly code = 'DETERMINISTIC_REPLAY_VALIDATION_MISMATCH' as const;
  readonly validationId: string;
  readonly mismatchCount: number;

  constructor(validationId: string, mismatchCount: number) {
    super(
      `Deterministic replay validation mismatch for validation: ${validationId} (${mismatchCount} mismatch(es))`,
    );
    this.validationId = validationId;
    this.mismatchCount = mismatchCount;
  }
}

export class DeterministicReplayValidationExecutionFailedError extends DeterministicReplayValidationError {
  readonly code = 'DETERMINISTIC_REPLAY_VALIDATION_EXECUTION_FAILED' as const;
  readonly cause: unknown | undefined;

  constructor(message: string, cause?: unknown) {
    super(message);
    this.cause = cause;
  }
}
