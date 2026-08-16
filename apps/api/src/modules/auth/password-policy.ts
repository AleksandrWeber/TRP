/**
 * Product password policy for credential-setting paths (V3-S01-a).
 * Enforced on register, change, and reset.
 * Login does not use this policy so existing accounts can still sign in.
 *
 * Keep the rules aligned with apps/web/src/shared/passwordPolicy.ts.
 */

export const MIN_PASSWORD_LENGTH = 8;

const FORBIDDEN_PRODUCT_PASSWORDS = new Set(['trp-admin-change-me']);

export const PRODUCT_PASSWORD_POLICY_MESSAGE =
  'Password must be at least 8 characters and include a letter and a number.';

export type PasswordPolicyResult = { ok: true } | { ok: false; message: string };

export function evaluateProductPasswordPolicy(password: unknown): PasswordPolicyResult {
  if (typeof password !== 'string' || password.length < MIN_PASSWORD_LENGTH) {
    return { ok: false, message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.` };
  }

  if (FORBIDDEN_PRODUCT_PASSWORDS.has(password.toLowerCase())) {
    return { ok: false, message: 'Choose a stronger password.' };
  }

  if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
    return { ok: false, message: 'Password must include a letter and a number.' };
  }

  return { ok: true };
}
