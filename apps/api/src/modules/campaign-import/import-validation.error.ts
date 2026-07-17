/**
 * Domain validation failure for Campaign Session import (US064).
 * Independent from Persistence / HTTP layers.
 */
export class ImportValidationError extends Error {
  readonly code = 'IMPORT_VALIDATION' as const;

  constructor(
    message: string,
    readonly field?: string,
  ) {
    super(message);
    this.name = 'ImportValidationError';
  }
}
