import { BadRequestException, ValidationPipe, type ValidationPipeOptions } from '@nestjs/common';

/**
 * Canonical ValidationPipe options (US113).
 */
export const VALIDATION_PIPE_OPTIONS: ValidationPipeOptions = {
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
  transformOptions: {
    enableImplicitConversion: true,
  },
  // Return ValidationError objects so ValidationExceptionFilter can map field/value/code.
  exceptionFactory: (errors) => new BadRequestException(errors),
};

export function createValidationPipe(overrides?: Partial<ValidationPipeOptions>): ValidationPipe {
  return new ValidationPipe({
    ...VALIDATION_PIPE_OPTIONS,
    ...overrides,
  });
}
