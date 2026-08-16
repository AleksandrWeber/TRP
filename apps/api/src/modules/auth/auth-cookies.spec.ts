import { describe, expect, it } from 'vitest';
import {
  accessCookie,
  parseCookieHeader,
  refreshCookie,
  serializeAuthCookie,
} from './auth-cookies';

describe('auth cookies (V3-S01-c)', () => {
  it('sets HttpOnly SameSite=Strict and adds Secure in production', () => {
    const development = serializeAuthCookie(
      { name: 'trp_access', value: 'token', maxAgeMs: 60_000, path: '/', httpOnly: true },
      { NODE_ENV: 'development' },
    );
    const production = serializeAuthCookie(
      { name: 'trp_access', value: 'token', maxAgeMs: 60_000, path: '/', httpOnly: true },
      { NODE_ENV: 'production' },
    );

    expect(development).toContain('HttpOnly');
    expect(development).toContain('SameSite=Strict');
    expect(development).not.toContain('Secure');
    expect(production).toContain('Secure');
    expect(production).toContain('HttpOnly');
    expect(production).toContain('SameSite=Strict');
  });

  it('uses distinct cookie names and paths for access vs refresh', () => {
    const access = accessCookie('access-secret', { NODE_ENV: 'production' });
    const refresh = refreshCookie('refresh-secret', { NODE_ENV: 'production' });

    expect(access).toContain('trp_access=');
    expect(access).toContain('Path=/');
    expect(refresh).toContain('trp_refresh=');
    expect(refresh).toContain('Path=/v1/auth');
    expect(access).not.toContain('refresh-secret');
    expect(refresh).not.toContain('access-secret');
  });

  it('parses cookie headers', () => {
    expect(parseCookieHeader('trp_access=abc; trp_csrf=xyz')).toEqual({
      trp_access: 'abc',
      trp_csrf: 'xyz',
    });
  });
});
