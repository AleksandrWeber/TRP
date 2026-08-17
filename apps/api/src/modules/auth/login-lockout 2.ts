/**
 * Product login lockout policy (V3-S01-b).
 * Auth-owned. Not Identity. Not a customer `.env` setting.
 */

export type Clock = {
  now(): Date;
};

export const SYSTEM_CLOCK: Clock = {
  now: () => new Date(),
};

export const LOGIN_LOCKOUT_MAX_FAILURES = 5;
export const LOGIN_LOCKOUT_COOLDOWN_MS = 15 * 60 * 1000;

export const INVALID_LOGIN_MESSAGE = 'Invalid email or password.';

export type LoginRequestContext = {
  ip?: string;
  userAgent?: string;
};

export type LoginLockoutRecord = {
  userId: string;
  failedAttempts: number;
  lockedUntil: Date | null;
};
