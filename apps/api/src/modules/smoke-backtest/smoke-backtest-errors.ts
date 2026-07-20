/**
 * Application errors for the US191 Smoke Backtest.
 *
 * Wrap research / runner failures without exposing aggregate internals.
 */

export type SmokeBacktestErrorCode =
  | 'SMOKE_BACKTEST_VALIDATION'
  | 'SMOKE_BACKTEST_ALREADY_COMPLETED'
  | 'SMOKE_BACKTEST_DUPLICATE_EXECUTION'
  | 'SMOKE_BACKTEST_RUNNER_STARTUP_FAILED'
  | 'SMOKE_BACKTEST_ACTIVE_RECOVERY'
  | 'SMOKE_BACKTEST_EXPIRED_LEASE'
  | 'SMOKE_BACKTEST_EXPIRED_HEARTBEAT'
  | 'SMOKE_BACKTEST_EXECUTION_FAILED';

export abstract class SmokeBacktestError extends Error {
  abstract readonly code: SmokeBacktestErrorCode;

  protected constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

export class SmokeBacktestValidationError extends SmokeBacktestError {
  readonly code = 'SMOKE_BACKTEST_VALIDATION' as const;
  readonly cause: unknown | undefined;

  constructor(message: string, cause?: unknown) {
    super(message);
    this.cause = cause;
  }
}

export class SmokeBacktestAlreadyCompletedError extends SmokeBacktestError {
  readonly code = 'SMOKE_BACKTEST_ALREADY_COMPLETED' as const;

  constructor(sessionId: string) {
    super(`Smoke backtest already completed for session: ${sessionId}`);
  }
}

export class SmokeBacktestDuplicateExecutionError extends SmokeBacktestError {
  readonly code = 'SMOKE_BACKTEST_DUPLICATE_EXECUTION' as const;

  constructor() {
    super('Smoke backtest execution is already in progress');
  }
}

export class SmokeBacktestRunnerStartupError extends SmokeBacktestError {
  readonly code = 'SMOKE_BACKTEST_RUNNER_STARTUP_FAILED' as const;
  readonly cause: unknown | undefined;

  constructor(message: string, cause?: unknown) {
    super(message);
    this.cause = cause;
  }
}

export class SmokeBacktestActiveRecoveryError extends SmokeBacktestError {
  readonly code = 'SMOKE_BACKTEST_ACTIVE_RECOVERY' as const;
  readonly cause: unknown | undefined;

  constructor(cause?: unknown) {
    super('Smoke backtest rejected: recovery is active');
    this.cause = cause;
  }
}

export class SmokeBacktestExpiredLeaseError extends SmokeBacktestError {
  readonly code = 'SMOKE_BACKTEST_EXPIRED_LEASE' as const;
  readonly cause: unknown | undefined;

  constructor(cause?: unknown) {
    super('Smoke backtest rejected: runtime lease is expired or inactive');
    this.cause = cause;
  }
}

export class SmokeBacktestExpiredHeartbeatError extends SmokeBacktestError {
  readonly code = 'SMOKE_BACKTEST_EXPIRED_HEARTBEAT' as const;
  readonly cause: unknown | undefined;

  constructor(cause?: unknown) {
    super('Smoke backtest rejected: runtime heartbeat has expired');
    this.cause = cause;
  }
}

export class SmokeBacktestExecutionFailedError extends SmokeBacktestError {
  readonly code = 'SMOKE_BACKTEST_EXECUTION_FAILED' as const;
  readonly cause: unknown | undefined;

  constructor(message: string, cause?: unknown) {
    super(message);
    this.cause = cause;
  }
}
