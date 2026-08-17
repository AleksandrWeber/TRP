import { describe, expect, it } from 'vitest';
import {
  PRODUCT_PASSWORD_MIN_LENGTH,
  PRODUCT_PASSWORD_POLICY_HINT,
  productPasswordPolicyMessage,
} from './passwordPolicy';

describe('product password policy (V3-S01-a)', () => {
  it('accepts a compliant password', () => {
    expect(productPasswordPolicyMessage('password-123')).toBeNull();
  });

  it('rejects short, letters-only, numbers-only, and seed passwords', () => {
    expect(productPasswordPolicyMessage('short1')).toBe(
      `Password must be at least ${PRODUCT_PASSWORD_MIN_LENGTH} characters.`,
    );
    expect(productPasswordPolicyMessage('password')).toBe(
      'Password must include a letter and a number.',
    );
    expect(productPasswordPolicyMessage('12345678')).toBe(
      'Password must include a letter and a number.',
    );
    expect(productPasswordPolicyMessage('trp-admin-change-me')).toBe('Choose a stronger password.');
  });

  it('describes the policy in operator language', () => {
    expect(PRODUCT_PASSWORD_POLICY_HINT).toContain('letter');
    expect(PRODUCT_PASSWORD_POLICY_HINT).toContain('number');
    expect(PRODUCT_PASSWORD_POLICY_HINT.toLowerCase()).not.toContain('jwt');
  });
});
