export type PositionErrorCode =
  | 'POSITION_NOT_FOUND'
  | 'POSITION_INVALID_STATE'
  | 'POSITION_VALIDATION'
  | 'POSITION_IMMUTABLE'
  | 'POSITION_PORTFOLIO_SYNC';

export abstract class PositionError extends Error {
  abstract readonly code: PositionErrorCode;

  protected constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

export class PositionNotFoundError extends PositionError {
  readonly code = 'POSITION_NOT_FOUND' as const;

  constructor(message = 'Position not found') {
    super(message);
  }
}

export class PositionInvalidStateError extends PositionError {
  readonly code = 'POSITION_INVALID_STATE' as const;

  constructor(message: string) {
    super(message);
  }
}

export class PositionValidationError extends PositionError {
  readonly code = 'POSITION_VALIDATION' as const;

  constructor(
    message: string,
    readonly cause?: unknown,
  ) {
    super(message);
  }
}

export class PositionImmutableError extends PositionError {
  readonly code = 'POSITION_IMMUTABLE' as const;

  constructor(message = 'Closed positions are immutable') {
    super(message);
  }
}

export class PositionPortfolioSyncError extends PositionError {
  readonly code = 'POSITION_PORTFOLIO_SYNC' as const;

  constructor(
    message: string,
    readonly cause?: unknown,
  ) {
    super(message);
  }
}
