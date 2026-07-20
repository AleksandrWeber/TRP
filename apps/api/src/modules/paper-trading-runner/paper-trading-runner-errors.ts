import type { RunnerStatus } from './runner-status';

export type PaperTradingRunnerErrorCode =
  | 'DUPLICATE_RUNNER_START'
  | 'DUPLICATE_RUNNER_STOP'
  | 'INVALID_RUNNER_STATUS'
  | 'MISSING_TRADING_SESSION'
  | 'INVALID_SESSION_LIFECYCLE'
  | 'INVALID_EXECUTION_MODE'
  | 'INACTIVE_RUNTIME_LEASE'
  | 'EXPIRED_RUNTIME_HEARTBEAT'
  | 'ACTIVE_RECOVERY'
  | 'MISSING_PAPER_STRATEGY'
  | 'MISSING_RUNNER_FAILURE_REASON';

export abstract class PaperTradingRunnerError extends Error {
  abstract readonly code: PaperTradingRunnerErrorCode;

  protected constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

export class DuplicateRunnerStartError extends PaperTradingRunnerError {
  readonly code = 'DUPLICATE_RUNNER_START' as const;

  constructor() {
    super('PaperTradingRunner has already been started');
  }
}

export class DuplicateRunnerStopError extends PaperTradingRunnerError {
  readonly code = 'DUPLICATE_RUNNER_STOP' as const;

  constructor() {
    super('PaperTradingRunner has already been stopped');
  }
}

export class InvalidRunnerStatusError extends PaperTradingRunnerError {
  readonly code = 'INVALID_RUNNER_STATUS' as const;

  constructor(operation: string, status: RunnerStatus) {
    super(`PaperTradingRunner cannot be ${operation} while ${status}`);
  }
}

export class MissingTradingSessionError extends PaperTradingRunnerError {
  readonly code = 'MISSING_TRADING_SESSION' as const;

  constructor() {
    super('PaperTradingRunner requires an existing TradingSession');
  }
}

export class InvalidSessionLifecycleError extends PaperTradingRunnerError {
  readonly code = 'INVALID_SESSION_LIFECYCLE' as const;

  constructor(state: string) {
    super(`TradingSession lifecycle does not permit execution: ${state}`);
  }
}

export class InvalidExecutionModeError extends PaperTradingRunnerError {
  readonly code = 'INVALID_EXECUTION_MODE' as const;

  constructor(mode: string) {
    super(`PaperTradingRunner only executes PAPER sessions, received: ${mode}`);
  }
}

export class InactiveRuntimeLeaseError extends PaperTradingRunnerError {
  readonly code = 'INACTIVE_RUNTIME_LEASE' as const;

  constructor() {
    super('runtime lease is missing, expired, or owned by another runtime');
  }
}

export class ExpiredRuntimeHeartbeatError extends PaperTradingRunnerError {
  readonly code = 'EXPIRED_RUNTIME_HEARTBEAT' as const;

  constructor() {
    super('runtime heartbeat has expired');
  }
}

export class ActiveRecoveryError extends PaperTradingRunnerError {
  readonly code = 'ACTIVE_RECOVERY' as const;

  constructor() {
    super('TradingSession recovery is active');
  }
}

export class MissingPaperStrategyError extends PaperTradingRunnerError {
  readonly code = 'MISSING_PAPER_STRATEGY' as const;

  constructor() {
    super('PaperTradingRunner requires a strategy');
  }
}

export class MissingRunnerFailureReasonError extends PaperTradingRunnerError {
  readonly code = 'MISSING_RUNNER_FAILURE_REASON' as const;

  constructor() {
    super('runner failure reason is required');
  }
}
