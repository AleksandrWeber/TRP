export type ExchangeAdapterErrorCode =
  | 'EXCHANGE_NOT_FOUND'
  | 'EXCHANGE_NOT_CONNECTED'
  | 'EXCHANGE_ALREADY_CONNECTED'
  | 'EXCHANGE_CONNECTION_FAILED'
  | 'EXCHANGE_ORDER_REJECTED'
  | 'EXCHANGE_ORDER_NOT_FOUND'
  | 'EXCHANGE_VALIDATION'
  | 'EXCHANGE_UNSUPPORTED_CAPABILITY'
  | 'EXCHANGE_ADAPTER_ERROR';

export abstract class ExchangeAdapterError extends Error {
  abstract readonly code: ExchangeAdapterErrorCode;

  protected constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

export class ExchangeNotFoundError extends ExchangeAdapterError {
  readonly code = 'EXCHANGE_NOT_FOUND' as const;

  constructor(message = 'Exchange not found') {
    super(message);
  }
}

export class ExchangeNotConnectedError extends ExchangeAdapterError {
  readonly code = 'EXCHANGE_NOT_CONNECTED' as const;

  constructor(message = 'Exchange is not connected') {
    super(message);
  }
}

export class ExchangeAlreadyConnectedError extends ExchangeAdapterError {
  readonly code = 'EXCHANGE_ALREADY_CONNECTED' as const;

  constructor(message = 'Exchange is already connected') {
    super(message);
  }
}

export class ExchangeConnectionFailedError extends ExchangeAdapterError {
  readonly code = 'EXCHANGE_CONNECTION_FAILED' as const;

  constructor(
    message: string,
    readonly cause?: unknown,
  ) {
    super(message);
  }
}

export class ExchangeOrderRejectedError extends ExchangeAdapterError {
  readonly code = 'EXCHANGE_ORDER_REJECTED' as const;

  constructor(message: string) {
    super(message);
  }
}

export class ExchangeOrderNotFoundError extends ExchangeAdapterError {
  readonly code = 'EXCHANGE_ORDER_NOT_FOUND' as const;

  constructor(message = 'Exchange order not found') {
    super(message);
  }
}

export class ExchangeValidationError extends ExchangeAdapterError {
  readonly code = 'EXCHANGE_VALIDATION' as const;

  constructor(
    message: string,
    readonly cause?: unknown,
  ) {
    super(message);
  }
}

export class ExchangeUnsupportedCapabilityError extends ExchangeAdapterError {
  readonly code = 'EXCHANGE_UNSUPPORTED_CAPABILITY' as const;

  constructor(message: string) {
    super(message);
  }
}

export class ExchangeAdapterInternalError extends ExchangeAdapterError {
  readonly code = 'EXCHANGE_ADAPTER_ERROR' as const;

  constructor(
    message: string,
    readonly cause?: unknown,
  ) {
    super(message);
  }
}
