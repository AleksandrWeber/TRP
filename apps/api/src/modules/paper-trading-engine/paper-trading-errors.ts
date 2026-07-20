export type PaperTradingErrorCode =
  | 'PAPER_SESSION_NOT_FOUND'
  | 'PAPER_SESSION_INVALID_STATE'
  | 'PAPER_SESSION_VALIDATION'
  | 'PAPER_EXECUTION_FAILED'
  | 'PAPER_ORDER_REJECTED';

export abstract class PaperTradingError extends Error {
  abstract readonly code: PaperTradingErrorCode;

  protected constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

export class PaperSessionNotFoundError extends PaperTradingError {
  readonly code = 'PAPER_SESSION_NOT_FOUND' as const;

  constructor(message = 'Paper session not found') {
    super(message);
  }
}

export class PaperSessionInvalidStateError extends PaperTradingError {
  readonly code = 'PAPER_SESSION_INVALID_STATE' as const;

  constructor(message: string) {
    super(message);
  }
}

export class PaperSessionValidationError extends PaperTradingError {
  readonly code = 'PAPER_SESSION_VALIDATION' as const;

  constructor(
    message: string,
    readonly cause?: unknown,
  ) {
    super(message);
  }
}

export class PaperExecutionFailedError extends PaperTradingError {
  readonly code = 'PAPER_EXECUTION_FAILED' as const;

  constructor(
    message: string,
    readonly cause?: unknown,
  ) {
    super(message);
  }
}

export class PaperOrderRejectedError extends PaperTradingError {
  readonly code = 'PAPER_ORDER_REJECTED' as const;

  constructor(message: string) {
    super(message);
  }
}
