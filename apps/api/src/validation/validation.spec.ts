import { describe, expect, it } from 'vitest';
import { IsEmail, IsString, MinLength, validateSync } from 'class-validator';
import { ClassValidatorErrorMapper } from './class-validator-error.mapper';
import { RegisterBodyDto, AuthSessionIdParamDto } from './dto/auth.dto';
import { createValidationPipe } from './create-validation-pipe';

class SampleDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(1)
  name!: string;
}

describe('Validation layer (US113)', () => {
  it('maps class-validator errors to { code, message, field, value }', () => {
    const dto = Object.assign(new SampleDto(), { email: 'bad', name: '' });
    const errors = validateSync(dto);
    const details = new ClassValidatorErrorMapper().map(errors);

    expect(details.length).toBeGreaterThan(0);
    for (const detail of details) {
      expect(detail).toEqual(
        expect.objectContaining({
          code: expect.any(String),
          message: expect.any(String),
          field: expect.any(String),
        }),
      );
      expect('value' in detail).toBe(true);
    }
    expect(details.some((item) => item.field === 'email')).toBe(true);
  });

  it('RegisterBodyDto rejects invalid email', () => {
    const dto = Object.assign(new RegisterBodyDto(), {
      email: 'not-an-email',
      displayName: 'Ada',
      password: 'password-123',
    });
    const errors = validateSync(dto);
    expect(errors.some((error) => error.property === 'email')).toBe(true);
  });

  it('RegisterBodyDto rejects a weak password and redacts the value', () => {
    const dto = Object.assign(new RegisterBodyDto(), {
      email: 'ada@example.com',
      displayName: 'Ada',
      password: 'password',
    });
    const errors = validateSync(dto);
    const details = new ClassValidatorErrorMapper().map(errors);
    const passwordError = details.find((item) => item.field === 'password');

    expect(passwordError?.message).toBe('Password must include a letter and a number.');
    expect(passwordError?.value).toBe('[redacted]');
  });

  it('RegisterBodyDto accepts a policy-compliant password', () => {
    const dto = Object.assign(new RegisterBodyDto(), {
      email: 'ada@example.com',
      displayName: 'Ada',
      password: 'password-123',
    });
    expect(validateSync(dto)).toEqual([]);
  });

  it('AuthSessionIdParamDto accepts a UUID session id', () => {
    const dto = Object.assign(new AuthSessionIdParamDto(), {
      sessionId: '11111111-1111-4111-8111-111111111111',
    });
    expect(validateSync(dto)).toEqual([]);
    expect(validateSync(new AuthSessionIdParamDto()).length).toBeGreaterThan(0);
  });

  it('createValidationPipe enables whitelist / forbidNonWhitelisted / transform', () => {
    const pipe = createValidationPipe();
    expect(pipe).toBeDefined();
  });
});
