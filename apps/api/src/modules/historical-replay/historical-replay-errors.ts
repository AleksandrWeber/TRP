/**
 * Application errors for the US193 Historical Replay.
 *
 * Wrap research / runner failures without exposing aggregate internals.
 */

export type HistoricalReplayErrorCode =
  | 'HISTORICAL_REPLAY_VALIDATION'
  | 'HISTORICAL_REPLAY_ALREADY_COMPLETED'
  | 'HISTORICAL_REPLAY_DUPLICATE_EXECUTION'
  | 'HISTORICAL_REPLAY_RUNNER_STARTUP_FAILED'
  | 'HISTORICAL_REPLAY_ACTIVE_RECOVERY'
  | 'HISTORICAL_REPLAY_EXPIRED_LEASE'
  | 'HISTORICAL_REPLAY_EXPIRED_HEARTBEAT'
  | 'HISTORICAL_REPLAY_EXECUTION_FAILED';

export abstract class HistoricalReplayError extends Error {
  abstract readonly code: HistoricalReplayErrorCode;

  protected constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

export class HistoricalReplayValidationError extends HistoricalReplayError {
  readonly code = 'HISTORICAL_REPLAY_VALIDATION' as const;
  readonly cause: unknown | undefined;

  constructor(message: string, cause?: unknown) {
    super(message);
    this.cause = cause;
  }
}

export class HistoricalReplayAlreadyCompletedError extends HistoricalReplayError {
  readonly code = 'HISTORICAL_REPLAY_ALREADY_COMPLETED' as const;

  constructor(sessionId: string) {
    super(`Historical replay already completed for session: ${sessionId}`);
  }
}

export class HistoricalReplayDuplicateExecutionError extends HistoricalReplayError {
  readonly code = 'HISTORICAL_REPLAY_DUPLICATE_EXECUTION' as const;

  constructor() {
    super('Historical replay execution is already in progress');
  }
}

export class HistoricalReplayRunnerStartupError extends HistoricalReplayError {
  readonly code = 'HISTORICAL_REPLAY_RUNNER_STARTUP_FAILED' as const;
  readonly cause: unknown | undefined;

  constructor(message: string, cause?: unknown) {
    super(message);
    this.cause = cause;
  }
}

export class HistoricalReplayActiveRecoveryError extends HistoricalReplayError {
  readonly code = 'HISTORICAL_REPLAY_ACTIVE_RECOVERY' as const;
  readonly cause: unknown | undefined;

  constructor(cause?: unknown) {
    super('Historical replay rejected: recovery is active');
    this.cause = cause;
  }
}

export class HistoricalReplayExpiredLeaseError extends HistoricalReplayError {
  readonly code = 'HISTORICAL_REPLAY_EXPIRED_LEASE' as const;
  readonly cause: unknown | undefined;

  constructor(cause?: unknown) {
    super('Historical replay rejected: runtime lease is expired or inactive');
    this.cause = cause;
  }
}

export class HistoricalReplayExpiredHeartbeatError extends HistoricalReplayError {
  readonly code = 'HISTORICAL_REPLAY_EXPIRED_HEARTBEAT' as const;
  readonly cause: unknown | undefined;

  constructor(cause?: unknown) {
    super('Historical replay rejected: runtime heartbeat has expired');
    this.cause = cause;
  }
}

export class HistoricalReplayExecutionFailedError extends HistoricalReplayError {
  readonly code = 'HISTORICAL_REPLAY_EXECUTION_FAILED' as const;
  readonly cause: unknown | undefined;

  constructor(message: string, cause?: unknown) {
    super(message);
    this.cause = cause;
  }
}
