import { describe, expect, it } from 'vitest';
import { INVALID_LOGIN_MESSAGE } from '../modules/auth/login-lockout';
import {
  ABUSE_LIMIT_MESSAGE,
  isSensitiveAbusePath,
  PlatformAbuseProtector,
} from './platform-abuse-protection';

describe('platform-abuse-protection (V3-S04-d)', () => {
  const policy = {
    general: { limit: 3, windowMs: 60_000 },
    sensitive: { limit: 2, windowMs: 60_000 },
  };

  it('identifies login and recovery routes as sensitive abuse paths', () => {
    expect(isSensitiveAbusePath('/v1/auth/login')).toBe(true);
    expect(isSensitiveAbusePath('/v1/auth/forgot-password?email=a@example.com')).toBe(true);
    expect(isSensitiveAbusePath('/v1/people')).toBe(false);
  });

  it('temporarily refuses repeated login attempts from one caller', () => {
    const protector = new PlatformAbuseProtector(policy, () => 1_000);

    expect(protector.check('203.0.113.10', '/v1/auth/login')).toEqual({ allowed: true });
    expect(protector.check('203.0.113.10', '/v1/auth/login')).toEqual({ allowed: true });
    expect(protector.check('203.0.113.10', '/v1/auth/login')).toEqual({
      allowed: false,
      retryAfterSeconds: 60,
    });
  });

  it('limits broad API scans and floods independently of login quota', () => {
    const protector = new PlatformAbuseProtector(policy, () => 1_000);

    expect(protector.check('203.0.113.10', '/v1/people')).toEqual({ allowed: true });
    expect(protector.check('203.0.113.10', '/v1/orders')).toEqual({ allowed: true });
    expect(protector.check('203.0.113.10', '/v1/reports')).toEqual({ allowed: true });
    expect(protector.check('203.0.113.10', '/v1/anything')).toMatchObject({ allowed: false });
    expect(ABUSE_LIMIT_MESSAGE).toBe('Too many requests. Please try again later.');
  });

  it('allows normal use again after the quota window', () => {
    let now = 1_000;
    const protector = new PlatformAbuseProtector(policy, () => now);

    protector.check('203.0.113.10', '/v1/auth/login');
    protector.check('203.0.113.10', '/v1/auth/login');
    expect(protector.check('203.0.113.10', '/v1/auth/login')).toMatchObject({ allowed: false });

    now += 60_001;
    expect(protector.check('203.0.113.10', '/v1/auth/login')).toEqual({ allowed: true });
  });

  it('uses platform try-later messaging that does not replace account lockout wording', () => {
    expect(ABUSE_LIMIT_MESSAGE).not.toBe(INVALID_LOGIN_MESSAGE);
    expect(ABUSE_LIMIT_MESSAGE).not.toContain('password');
    expect(ABUSE_LIMIT_MESSAGE).not.toContain('locked');
  });
});
