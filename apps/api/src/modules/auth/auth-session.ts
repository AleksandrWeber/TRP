/**
 * Auth-owned operator session policy (V3-S01-c).
 * Not Identity. Not Trading Session / SessionRecoveryState.
 * Not a customer `.env` setting.
 */

export type Clock = {
  now(): Date;
};

export const SYSTEM_CLOCK: Clock = {
  now: () => new Date(),
};

/** Short access JWT. Replaces the previous 8h product default. */
export const ACCESS_JWT_EXPIRES_IN = '15m';
export const ACCESS_TOKEN_TTL_MS = 15 * 60 * 1000;

/** Rotating refresh lifetime. Bounded; not remember-me. */
export const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export function resolveAccessJwtExpiresIn(configured?: string | null): string {
  const value = configured?.trim();
  if (!value || value === '8h') {
    return ACCESS_JWT_EXPIRES_IN;
  }
  return value;
}

export const ACCESS_COOKIE_NAME = 'trp_access';
export const REFRESH_COOKIE_NAME = 'trp_refresh';
export const CSRF_COOKIE_NAME = 'trp_csrf';
export const CSRF_HEADER_NAME = 'x-csrf-token';

export const INVALID_SESSION_MESSAGE = 'Invalid session.';
export const SESSION_NOT_FOUND_MESSAGE = 'Session not found.';

export type SessionRequestContext = {
  ip?: string;
  userAgent?: string;
};

export type AuthSessionRecord = {
  id: string;
  familyId: string;
  userId: string;
  refreshTokenHash: string;
  expiresAt: Date;
  revokedAt: Date | null;
  replacedById: string | null;
  ip: string | null;
  userAgent: string | null;
  mfaSatisfied: boolean;
  createdAt: Date;
};

export type IssuedRefreshSecrets = {
  sessionId: string;
  familyId: string;
  userId: string;
  refreshToken: string;
  csrfToken: string;
};
