import {
  ACCESS_COOKIE_NAME,
  ACCESS_TOKEN_TTL_MS,
  CSRF_COOKIE_NAME,
  REFRESH_COOKIE_NAME,
  REFRESH_TOKEN_TTL_MS,
} from './auth-session';

export type AuthCookieFlags = {
  name: string;
  value: string;
  maxAgeMs: number;
  path: string;
  httpOnly: boolean;
};

export type CookieEnvironment = {
  NODE_ENV?: string;
};

/**
 * Production refuses to emit auth cookies without Secure (V3-S01-c).
 * SameSite=Strict on every auth cookie.
 */
export function serializeAuthCookie(
  flags: AuthCookieFlags,
  env: CookieEnvironment = process.env,
): string {
  const isProduction = (env.NODE_ENV ?? process.env.NODE_ENV) === 'production';

  const parts = [
    `${flags.name}=${encodeURIComponent(flags.value)}`,
    `Max-Age=${Math.floor(flags.maxAgeMs / 1000)}`,
    `Path=${flags.path}`,
    'SameSite=Strict',
  ];
  if (flags.httpOnly) {
    parts.push('HttpOnly');
  }
  if (isProduction) {
    parts.push('Secure');
  }
  return parts.join('; ');
}

export function accessCookie(value: string, env?: CookieEnvironment): string {
  return serializeAuthCookie(
    {
      name: ACCESS_COOKIE_NAME,
      value,
      maxAgeMs: ACCESS_TOKEN_TTL_MS,
      path: '/',
      httpOnly: true,
    },
    env,
  );
}

export function refreshCookie(value: string, env?: CookieEnvironment): string {
  return serializeAuthCookie(
    {
      name: REFRESH_COOKIE_NAME,
      value,
      maxAgeMs: REFRESH_TOKEN_TTL_MS,
      path: '/v1/auth',
      httpOnly: true,
    },
    env,
  );
}

export function csrfCookie(value: string, env?: CookieEnvironment): string {
  return serializeAuthCookie(
    {
      name: CSRF_COOKIE_NAME,
      value,
      maxAgeMs: REFRESH_TOKEN_TTL_MS,
      path: '/v1/auth',
      httpOnly: true,
    },
    env,
  );
}

export function expiredAuthCookies(env?: CookieEnvironment): string[] {
  return [
    serializeAuthCookie(
      { name: ACCESS_COOKIE_NAME, value: '', maxAgeMs: 0, path: '/', httpOnly: true },
      env,
    ),
    serializeAuthCookie(
      { name: REFRESH_COOKIE_NAME, value: '', maxAgeMs: 0, path: '/v1/auth', httpOnly: true },
      env,
    ),
    serializeAuthCookie(
      { name: CSRF_COOKIE_NAME, value: '', maxAgeMs: 0, path: '/v1/auth', httpOnly: true },
      env,
    ),
  ];
}

export function parseCookieHeader(header: string | string[] | undefined): Record<string, string> {
  const raw = Array.isArray(header) ? header.join('; ') : header;
  if (!raw) return {};
  const out: Record<string, string> = {};
  for (const part of raw.split(';')) {
    const index = part.indexOf('=');
    if (index <= 0) continue;
    const name = part.slice(0, index).trim();
    const value = part.slice(index + 1).trim();
    if (!name) continue;
    out[name] = decodeURIComponent(value);
  }
  return out;
}

export type HeaderWriter = {
  header(name: string, value: string | string[]): unknown;
  getHeader(name: string): string | number | string[] | undefined;
};

export function appendSetCookies(reply: HeaderWriter, cookies: string[]): void {
  for (const cookie of cookies) {
    const existing = reply.getHeader('Set-Cookie');
    if (existing === undefined) {
      reply.header('Set-Cookie', cookie);
      continue;
    }
    const current = Array.isArray(existing) ? existing.map(String) : [String(existing)];
    reply.header('Set-Cookie', [...current, cookie]);
  }
}

export function sessionCookieBundle(params: {
  accessToken: string;
  refreshToken: string;
  csrfToken: string;
  env?: CookieEnvironment;
}): string[] {
  return [
    accessCookie(params.accessToken, params.env),
    refreshCookie(params.refreshToken, params.env),
    csrfCookie(params.csrfToken, params.env),
  ];
}
