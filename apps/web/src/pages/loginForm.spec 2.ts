import { describe, expect, it } from 'vitest';
import { GENERIC_SIGN_IN_ERROR, toSignInFailureMessage, validateAuthForm } from './loginForm';

describe('validateAuthForm (V3-S01-a)', () => {
  it('keeps sign-in length-only so existing accounts can still submit', () => {
    expect(
      validateAuthForm({
        mode: 'signin',
        email: 'ada@example.com',
        password: 'password',
        displayName: '',
      }),
    ).toBeNull();
    expect(
      validateAuthForm({
        mode: 'signin',
        email: 'ada@example.com',
        password: 'short',
        displayName: '',
      }),
    ).toBe('Password must be at least 8 characters.');
  });

  it('rejects weak registration passwords in product language', () => {
    expect(
      validateAuthForm({
        mode: 'register',
        email: 'ada@example.com',
        password: 'password',
        displayName: 'Ada',
      }),
    ).toBe('Password must include a letter and a number.');
    expect(
      validateAuthForm({
        mode: 'register',
        email: 'ada@example.com',
        password: 'trp-admin-change-me',
        displayName: 'Ada',
      }),
    ).toBe('Choose a stronger password.');
  });

  it('accepts a compliant registration form', () => {
    expect(
      validateAuthForm({
        mode: 'register',
        email: 'ada@example.com',
        password: 'password-123',
        displayName: 'Ada',
      }),
    ).toBeNull();
  });

  it('maps lockout and unknown-user failures to the same generic sign-in message', () => {
    expect(toSignInFailureMessage('Unauthorized')).toBe(GENERIC_SIGN_IN_ERROR);
    expect(toSignInFailureMessage('Invalid credentials')).toBe(GENERIC_SIGN_IN_ERROR);
    expect(toSignInFailureMessage('Invalid email or password.')).toBe(GENERIC_SIGN_IN_ERROR);
    expect(GENERIC_SIGN_IN_ERROR).toBe('Invalid email or password.');
    expect(GENERIC_SIGN_IN_ERROR.toLowerCase()).not.toContain('lock');
    expect(GENERIC_SIGN_IN_ERROR.toLowerCase()).not.toContain('attempt');
  });
});
