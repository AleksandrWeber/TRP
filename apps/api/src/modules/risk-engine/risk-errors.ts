export type RiskErrorCode =
  | 'RISK_NOT_FOUND'
  | 'RISK_VALIDATION'
  | 'RISK_INVALID_STATE'
  | 'RISK_POLICY_NOT_FOUND'
  | 'RISK_REJECTED';

export class RiskError extends Error {
  readonly code: RiskErrorCode;

  constructor(code: RiskErrorCode, message: string, options?: { cause?: unknown }) {
    super(message, options?.cause !== undefined ? { cause: options.cause } : undefined);
    this.name = 'RiskError';
    this.code = code;
  }
}

export class RiskNotFoundError extends RiskError {
  constructor(message = 'risk decision not found') {
    super('RISK_NOT_FOUND', message);
    this.name = 'RiskNotFoundError';
  }
}

export class RiskValidationError extends RiskError {
  constructor(message: string, cause?: unknown) {
    super('RISK_VALIDATION', message, cause !== undefined ? { cause } : undefined);
    this.name = 'RiskValidationError';
  }
}

export class RiskInvalidStateError extends RiskError {
  constructor(message: string) {
    super('RISK_INVALID_STATE', message);
    this.name = 'RiskInvalidStateError';
  }
}

export class RiskPolicyNotFoundError extends RiskError {
  constructor(message = 'risk policy not found') {
    super('RISK_POLICY_NOT_FOUND', message);
    this.name = 'RiskPolicyNotFoundError';
  }
}

export class RiskRejectedError extends RiskError {
  constructor(message: string) {
    super('RISK_REJECTED', message);
    this.name = 'RiskRejectedError';
  }
}
