export type PortfolioErrorCode =
  | 'PORTFOLIO_NOT_FOUND'
  | 'PORTFOLIO_INVALID_STATE'
  | 'PORTFOLIO_VALIDATION'
  | 'PORTFOLIO_ARCHIVED'
  | 'PORTFOLIO_RESET_FORBIDDEN';

export abstract class PortfolioError extends Error {
  abstract readonly code: PortfolioErrorCode;

  protected constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

export class PortfolioNotFoundError extends PortfolioError {
  readonly code = 'PORTFOLIO_NOT_FOUND' as const;

  constructor(message = 'Portfolio not found') {
    super(message);
  }
}

export class PortfolioInvalidStateError extends PortfolioError {
  readonly code = 'PORTFOLIO_INVALID_STATE' as const;

  constructor(message: string) {
    super(message);
  }
}

export class PortfolioValidationError extends PortfolioError {
  readonly code = 'PORTFOLIO_VALIDATION' as const;

  constructor(
    message: string,
    readonly cause?: unknown,
  ) {
    super(message);
  }
}

export class PortfolioArchivedError extends PortfolioError {
  readonly code = 'PORTFOLIO_ARCHIVED' as const;

  constructor(message = 'Portfolio is archived') {
    super(message);
  }
}

export class PortfolioResetForbiddenError extends PortfolioError {
  readonly code = 'PORTFOLIO_RESET_FORBIDDEN' as const;

  constructor(message = 'Portfolio reset is only available in development') {
    super(message);
  }
}
