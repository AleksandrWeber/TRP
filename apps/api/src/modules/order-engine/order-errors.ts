export type OrderErrorCode =
  | 'ORDER_NOT_FOUND'
  | 'ORDER_INVALID_STATE'
  | 'ORDER_VALIDATION'
  | 'ORDER_IMMUTABLE'
  | 'ORDER_POSITION_SYNC'
  | 'ORDER_PORTFOLIO_SYNC';

export abstract class OrderError extends Error {
  abstract readonly code: OrderErrorCode;

  protected constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

export class OrderNotFoundError extends OrderError {
  readonly code = 'ORDER_NOT_FOUND' as const;

  constructor(message = 'Order not found') {
    super(message);
  }
}

export class OrderInvalidStateError extends OrderError {
  readonly code = 'ORDER_INVALID_STATE' as const;

  constructor(message: string) {
    super(message);
  }
}

export class OrderValidationError extends OrderError {
  readonly code = 'ORDER_VALIDATION' as const;

  constructor(
    message: string,
    readonly cause?: unknown,
  ) {
    super(message);
  }
}

export class OrderImmutableError extends OrderError {
  readonly code = 'ORDER_IMMUTABLE' as const;

  constructor(message = 'Filled orders are immutable') {
    super(message);
  }
}

export class OrderPositionSyncError extends OrderError {
  readonly code = 'ORDER_POSITION_SYNC' as const;

  constructor(
    message: string,
    readonly cause?: unknown,
  ) {
    super(message);
  }
}

export class OrderPortfolioSyncError extends OrderError {
  readonly code = 'ORDER_PORTFOLIO_SYNC' as const;

  constructor(
    message: string,
    readonly cause?: unknown,
  ) {
    super(message);
  }
}
