export type TradingSessionDomainErrorCode =
  | 'INVALID_TRANSITION'
  | 'INVALID_LIFECYCLE_TIMESTAMP'
  | 'MISSING_FAILURE_REASON'
  | 'DUPLICATE_FAILURE'
  | 'DUPLICATE_LEASE'
  | 'MISSING_LEASE'
  | 'LEASE_OWNER_MISMATCH'
  | 'EXPIRED_LEASE'
  | 'INVALID_HEARTBEAT_TIMESTAMP'
  | 'RECOVERY_NOT_ELIGIBLE'
  | 'RECOVERY_IN_PROGRESS'
  | 'RECOVERY_ALREADY_COMPLETED'
  | 'RECOVERY_NOT_IN_PROGRESS'
  | 'DUPLICATE_RECOVERY_COMPLETION'
  | 'DUPLICATE_RECOVERY_FAILURE'
  | 'MISSING_RECOVERY_REASON'
  | 'INVALID_RECOVERY_TIMESTAMP';

export abstract class TradingSessionDomainError extends Error {
  abstract readonly code: TradingSessionDomainErrorCode;

  protected constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

export class InvalidTradingSessionTransitionError extends TradingSessionDomainError {
  readonly code = 'INVALID_TRANSITION' as const;

  constructor(from: string, to: unknown) {
    super(`Invalid TradingSession transition: ${from} -> ${String(to)}`);
  }
}

export class InvalidLifecycleTimestampError extends TradingSessionDomainError {
  readonly code = 'INVALID_LIFECYCLE_TIMESTAMP' as const;

  constructor(message: string) {
    super(message);
  }
}

export class MissingFailureReasonError extends TradingSessionDomainError {
  readonly code = 'MISSING_FAILURE_REASON' as const;

  constructor() {
    super('failure reason is required');
  }
}

export class DuplicateTradingSessionFailureError extends TradingSessionDomainError {
  readonly code = 'DUPLICATE_FAILURE' as const;

  constructor() {
    super('TradingSession has already failed');
  }
}

export class DuplicateRuntimeLeaseError extends TradingSessionDomainError {
  readonly code = 'DUPLICATE_LEASE' as const;

  constructor() {
    super('TradingSession already has an active runtime lease');
  }
}

export class MissingRuntimeLeaseError extends TradingSessionDomainError {
  readonly code = 'MISSING_LEASE' as const;

  constructor() {
    super('TradingSession has no runtime lease');
  }
}

export class RuntimeLeaseOwnerMismatchError extends TradingSessionDomainError {
  readonly code = 'LEASE_OWNER_MISMATCH' as const;

  constructor(operation = 'released') {
    super(`runtime lease can only be ${operation} by its owner`);
  }
}

export class ExpiredRuntimeLeaseError extends TradingSessionDomainError {
  readonly code = 'EXPIRED_LEASE' as const;

  constructor() {
    super('expired runtime lease cannot be reused');
  }
}

export class InvalidRuntimeHeartbeatTimestampError extends TradingSessionDomainError {
  readonly code = 'INVALID_HEARTBEAT_TIMESTAMP' as const;

  constructor(message: string) {
    super(message);
  }
}

export class RecoveryNotEligibleError extends TradingSessionDomainError {
  readonly code = 'RECOVERY_NOT_ELIGIBLE' as const;

  constructor() {
    super('TradingSession is not eligible for recovery');
  }
}

export class RecoveryInProgressError extends TradingSessionDomainError {
  readonly code = 'RECOVERY_IN_PROGRESS' as const;

  constructor() {
    super('TradingSession recovery is already in progress');
  }
}

export class RecoveryAlreadyCompletedError extends TradingSessionDomainError {
  readonly code = 'RECOVERY_ALREADY_COMPLETED' as const;

  constructor() {
    super('TradingSession recovery has already completed');
  }
}

export class RecoveryNotInProgressError extends TradingSessionDomainError {
  readonly code = 'RECOVERY_NOT_IN_PROGRESS' as const;

  constructor() {
    super('TradingSession recovery is not in progress');
  }
}

export class DuplicateRecoveryCompletionError extends TradingSessionDomainError {
  readonly code = 'DUPLICATE_RECOVERY_COMPLETION' as const;

  constructor() {
    super('TradingSession recovery has already completed');
  }
}

export class DuplicateRecoveryFailureError extends TradingSessionDomainError {
  readonly code = 'DUPLICATE_RECOVERY_FAILURE' as const;

  constructor() {
    super('TradingSession recovery has already failed');
  }
}

export class MissingRecoveryReasonError extends TradingSessionDomainError {
  readonly code = 'MISSING_RECOVERY_REASON' as const;

  constructor() {
    super('recovery reason is required');
  }
}

export class InvalidRecoveryTimestampError extends TradingSessionDomainError {
  readonly code = 'INVALID_RECOVERY_TIMESTAMP' as const;

  constructor(message: string) {
    super(message);
  }
}
