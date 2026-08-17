/**
 * DI token for AuthSessionRepository (V3-S01-c).
 */
export const AUTH_SESSION_REPOSITORY = Symbol('AUTH_SESSION_REPOSITORY');

/**
 * DI token for session Clock. Production uses SYSTEM_CLOCK.
 */
export const AUTH_SESSION_CLOCK = Symbol('AUTH_SESSION_CLOCK');
