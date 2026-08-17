/**
 * Product password policy for registration (V3-S01-a).
 * Keep the rules aligned with apps/api/src/modules/auth/password-policy.ts.
 */

export const PRODUCT_PASSWORD_MIN_LENGTH = 8;

const FORBIDDEN_PRODUCT_PASSWORDS = new Set(['trp-admin-change-me']);

export const PRODUCT_PASSWORD_POLICY_HINT = 'Use at least 8 characters with a letter and a number.';

export function productPasswordPolicyMessage(password: string): string | null {
  if (password.length < PRODUCT_PASSWORD_MIN_LENGTH) {
    return `Password must be at least ${PRODUCT_PASSWORD_MIN_LENGTH} characters.`;
  }
  if (FORBIDDEN_PRODUCT_PASSWORDS.has(password.toLowerCase())) {
    return 'Choose a stronger password.';
  }
  if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
    return 'Password must include a letter and a number.';
  }
  return null;
}
