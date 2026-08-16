/**
 * Auth-owned password reset policy (V3-S01-e).
 * Not Identity. Not Notification Delivery. Not a customer `.env` ritual.
 */

export type Clock = {
  now(): Date;
};

export const SYSTEM_CLOCK: Clock = {
  now: () => new Date(),
};

/** Single-use recovery link lifetime. Short-lived; not remember-me. */
export const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;

export const RECOVERY_UNAVAILABLE_MESSAGE =
  'Password recovery is unavailable until the host configures mail.';

export const RECOVERY_ACCEPTED_MESSAGE =
  'If an account exists for that email, recovery instructions will be sent.';

export const INVALID_RECOVERY_MESSAGE = 'This recovery link is invalid or has expired.';

export const CURRENT_PASSWORD_INCORRECT_MESSAGE = 'Current password is incorrect.';

export type PasswordResetRecord = {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  consumedAt: Date | null;
  createdAt: Date;
};

export type IssuedPasswordReset = {
  userId: string;
  token: string;
};
