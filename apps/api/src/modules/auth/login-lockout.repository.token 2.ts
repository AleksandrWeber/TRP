/**
 * DI token for LoginLockoutRepository (V3-S01-b).
 */
export const LOGIN_LOCKOUT_REPOSITORY = Symbol('LOGIN_LOCKOUT_REPOSITORY');

/**
 * DI token for lockout Clock. Production uses SYSTEM_CLOCK.
 */
export const LOGIN_LOCKOUT_CLOCK = Symbol('LOGIN_LOCKOUT_CLOCK');
