import { BadRequestException } from '@nestjs/common';
import { IsString } from 'class-validator';
import { describe, expect, it } from 'vitest';
import {
  createPlatformValidationPipe,
  PLATFORM_VALIDATION_FOUNDATION,
} from './validation-foundation';
import { VALIDATION_PIPE_OPTIONS } from '../validation/create-validation-pipe';

class RoleAssignmentDto {
  @IsString()
  role!: string;
}

describe('validation-foundation (V3-S04-a)', () => {
  it('inherits canonical ValidationPipe defaults', () => {
    expect(PLATFORM_VALIDATION_FOUNDATION.whitelist).toBe(VALIDATION_PIPE_OPTIONS.whitelist);
    expect(PLATFORM_VALIDATION_FOUNDATION.forbidNonWhitelisted).toBe(
      VALIDATION_PIPE_OPTIONS.forbidNonWhitelisted,
    );
    expect(PLATFORM_VALIDATION_FOUNDATION.transform).toBe(VALIDATION_PIPE_OPTIONS.transform);
  });

  it('rejects unexpected privileged fields through the platform validation pipe', async () => {
    const pipe = createPlatformValidationPipe();

    await expect(
      pipe.transform(
        { role: 'admin', isAdmin: true },
        { type: 'body', metatype: RoleAssignmentDto },
      ),
    ).rejects.toBeInstanceOf(BadRequestException);

    const value = await pipe.transform(
      { role: 'admin' },
      { type: 'body', metatype: RoleAssignmentDto },
    );
    expect(value).toEqual({ role: 'admin' });
  });
});
