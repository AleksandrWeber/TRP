import { Global, Module } from '@nestjs/common';
import { APP_FILTER, APP_PIPE } from '@nestjs/core';
import { ClassValidatorErrorMapper } from './class-validator-error.mapper';
import { createValidationPipe } from './create-validation-pipe';
import { ValidationExceptionFilter } from './validation-exception.filter';
import { VALIDATION_ERROR_MAPPER } from './validation.token';

/**
 * Centralized validation module (US113).
 * Registers global ValidationPipe + unified validation error filter.
 */
@Global()
@Module({
  providers: [
    {
      provide: VALIDATION_ERROR_MAPPER,
      useClass: ClassValidatorErrorMapper,
    },
    {
      provide: APP_PIPE,
      useFactory: () => createValidationPipe(),
    },
    {
      provide: APP_FILTER,
      useClass: ValidationExceptionFilter,
    },
  ],
  exports: [VALIDATION_ERROR_MAPPER],
})
export class ValidationModule {}
