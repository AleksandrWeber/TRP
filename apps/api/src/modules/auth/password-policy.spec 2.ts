import { describe, expect, it } from 'vitest';
import {
  evaluateProductPasswordPolicy,
  MIN_PASSWORD_LENGTH,
  PRODUCT_PASSWORD_POLICY_MESSAGE,
} from './password-policy';

describe('product password policy (V3-S01-a)', () => {
  it('accepts a compliant password', () => {
    expect(evaluateProductPasswordPolicy('password-123')).toEqual({ ok: true });
    expect(evaluateProductPasswordPolicy('Abcdefg1')).toEqual({ ok: true });
  });

  it('rejects passwords shorter than the minimum length', () => {
    expect(evaluateProductPasswordPolicy('short1')).toEqual({
      ok: false,
      message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`,
    });
    expect(evaluateProductPasswordPolicy('')).toEqual({
      ok: false,
      message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`,
    });
  });

  it('rejects passwords without a letter and a number', () => {
    expect(evaluateProductPasswordPolicy('password')).toEqual({
      ok: false,
      message: 'Password must include a letter and a number.',
    });
    expect(evaluateProductPasswordPolicy('12345678')).toEqual({
      ok: false,
      message: 'Password must include a letter and a number.',
    });
  });

  it('rejects the engineer seed password on the product path', () => {
    expect(evaluateProductPasswordPolicy('trp-admin-change-me')).toEqual({
      ok: false,
      message: 'Choose a stronger password.',
    });
    expect(evaluateProductPasswordPolicy('TRP-ADMIN-CHANGE-ME')).toEqual({
      ok: false,
      message: 'Choose a stronger password.',
    });
  });

  it('describes the policy without JWT jargon', () => {
    expect(PRODUCT_PASSWORD_POLICY_MESSAGE.toLowerCase()).not.toContain('jwt');
    expect(PRODUCT_PASSWORD_POLICY_MESSAGE.toLowerCase()).not.toContain('bcrypt');
  });
});
