export type LiveTradingErrorCode =
  | 'LIVE_SESSION_NOT_FOUND'
  | 'LIVE_SESSION_INVALID_STATE'
  | 'LIVE_SESSION_VALIDATION'
  | 'LIVE_SESSION_ALREADY_ACTIVE'
  | 'LIVE_EXECUTION_FAILED'
  | 'LIVE_ORDER_REJECTED'
  | 'LIVE_SYNCHRONIZATION_FAILED'
  | 'LIVE_RECOVERY_FAILED'
  | 'LIVE_CONNECTION_FAILED';

export abstract class LiveTradingError extends Error {
  abstract readonly code: LiveTradingErrorCode;

  protected constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

export class LiveSessionNotFoundError extends LiveTradingError {
  readonly code = 'LIVE_SESSION_NOT_FOUND' as const;

  constructor(message = 'Live session not found') {
    super(message);
  }
}

export class LiveSessionInvalidStateError extends LiveTradingError {
  readonly code = 'LIVE_SESSION_INVALID_STATE' as const;

  constructor(message: string) {
    super(message);
  }
}

export class LiveSessionValidationError extends LiveTradingError {
  readonly code = 'LIVE_SESSION_VALIDATION' as const;

  constructor(
    message: string,
    readonly cause?: unknown,
  ) {
    super(message);
  }
}

export class LiveSessionAlreadyActiveError extends LiveTradingError {
  readonly code = 'LIVE_SESSION_ALREADY_ACTIVE' as const;

  constructor(message = 'Only one active live session is allowed per account') {
    super(message);
  }
}

export class LiveExecutionFailedError extends LiveTradingError {
  readonly code = 'LIVE_EXECUTION_FAILED' as const;

  constructor(
    message: string,
    readonly cause?: unknown,
  ) {
    super(message);
  }
}

export class LiveOrderRejectedError extends LiveTradingError {
  readonly code = 'LIVE_ORDER_REJECTED' as const;

  constructor(message: string) {
    super(message);
  }
}

export class LiveSynchronizationFailedError extends LiveTradingError {
  readonly code = 'LIVE_SYNCHRONIZATION_FAILED' as const;

  constructor(
    message: string,
    readonly cause?: unknown,
  ) {
    super(message);
  }
}

export class LiveRecoveryFailedError extends LiveTradingError {
  readonly code = 'LIVE_RECOVERY_FAILED' as const;

  constructor(
    message: string,
    readonly cause?: unknown,
  ) {
    super(message);
  }
}

export class LiveConnectionFailedError extends LiveTradingError {
  readonly code = 'LIVE_CONNECTION_FAILED' as const;

  constructor(
    message: string,
    readonly cause?: unknown,
  ) {
    super(message);
  }
}
