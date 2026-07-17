import { ValidationError } from 'class-validator';
import type { ValidationErrorDetail, ValidationErrorMapper } from './validation.types';

/**
 * Maps class-validator ValidationError trees into unified { code, message, field, value } (US113).
 */
export class ClassValidatorErrorMapper implements ValidationErrorMapper {
  map(errors: unknown[]): ValidationErrorDetail[] {
    const details: ValidationErrorDetail[] = [];
    for (const error of errors) {
      if (error instanceof ValidationError || isValidationErrorLike(error)) {
        collect(error, '', details);
      }
    }
    return details;
  }
}

function collect(error: ValidationError, parent: string, out: ValidationErrorDetail[]): void {
  const field = parent ? `${parent}.${error.property}` : error.property;

  if (error.constraints) {
    for (const [code, message] of Object.entries(error.constraints)) {
      out.push({
        code,
        message,
        field,
        value: error.value,
      });
    }
  }

  if (error.children && error.children.length > 0) {
    for (const child of error.children) {
      collect(child, field, out);
    }
  }
}

function isValidationErrorLike(value: unknown): value is ValidationError {
  return (
    typeof value === 'object' &&
    value !== null &&
    'property' in value &&
    typeof (value as { property: unknown }).property === 'string'
  );
}
