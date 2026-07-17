/**
 * Unified validation error detail (US113).
 */
export type ValidationErrorDetail = {
  code: string;
  message: string;
  field: string;
  value: unknown;
};

/**
 * Validation port (US113).
 * Controllers / pipes depend on this abstraction for mapping validation failures.
 */
export interface ValidationErrorMapper {
  map(errors: unknown[]): ValidationErrorDetail[];
}
