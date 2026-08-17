import type { ValidationPipeOptions } from '@nestjs/common';
import {
  createValidationPipe,
  VALIDATION_PIPE_OPTIONS,
} from '../validation/create-validation-pipe';

/**
 * Platform validation foundation inherited by every HTTP endpoint (V3-S04-a).
 * Extends the canonical US113 ValidationPipe defaults without replacing feature DTOs.
 */
export const PLATFORM_VALIDATION_FOUNDATION: ValidationPipeOptions = {
  ...VALIDATION_PIPE_OPTIONS,
};

export function createPlatformValidationPipe(
  overrides?: Partial<ValidationPipeOptions>,
): ReturnType<typeof createValidationPipe> {
  return createValidationPipe({
    ...PLATFORM_VALIDATION_FOUNDATION,
    ...overrides,
  });
}
