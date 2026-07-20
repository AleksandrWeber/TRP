/**
 * Application errors for US194 Walk Forward Validation.
 */

export type WalkForwardErrorCode =
  | 'WALK_FORWARD_VALIDATION'
  | 'WALK_FORWARD_ALREADY_COMPLETED'
  | 'WALK_FORWARD_DUPLICATE_EXECUTION'
  | 'WALK_FORWARD_REPLAY_FAILED'
  | 'WALK_FORWARD_EXECUTION_FAILED';

export abstract class WalkForwardError extends Error {
  abstract readonly code: WalkForwardErrorCode;

  protected constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

export class WalkForwardValidationError extends WalkForwardError {
  readonly code = 'WALK_FORWARD_VALIDATION' as const;
  readonly cause: unknown | undefined;

  constructor(message: string, cause?: unknown) {
    super(message);
    this.cause = cause;
  }
}

export class WalkForwardAlreadyCompletedError extends WalkForwardError {
  readonly code = 'WALK_FORWARD_ALREADY_COMPLETED' as const;

  constructor(executionId: string) {
    super(`Walk forward validation already completed for execution: ${executionId}`);
  }
}

export class WalkForwardDuplicateExecutionError extends WalkForwardError {
  readonly code = 'WALK_FORWARD_DUPLICATE_EXECUTION' as const;

  constructor() {
    super('Walk forward validation execution is already in progress');
  }
}

export class WalkForwardReplayFailedError extends WalkForwardError {
  readonly code = 'WALK_FORWARD_REPLAY_FAILED' as const;
  readonly cause: unknown | undefined;
  readonly windowId: string;

  constructor(windowId: string, cause?: unknown) {
    super(`Walk forward replay failed for window: ${windowId}`);
    this.windowId = windowId;
    this.cause = cause;
  }
}

export class WalkForwardExecutionFailedError extends WalkForwardError {
  readonly code = 'WALK_FORWARD_EXECUTION_FAILED' as const;
  readonly cause: unknown | undefined;

  constructor(message: string, cause?: unknown) {
    super(message);
    this.cause = cause;
  }
}
