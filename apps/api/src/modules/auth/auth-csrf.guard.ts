import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import {
  ACCESS_COOKIE_NAME,
  CSRF_COOKIE_NAME,
  CSRF_HEADER_NAME,
  REFRESH_COOKIE_NAME,
} from './auth-session';
import { parseCookieHeader } from './auth-cookies';
import { secretsMatch } from './auth-session.store';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * CSRF for cookie-authenticated Auth mutations (V3-S01-c).
 * Bearer-only requests without auth cookies skip this guard.
 * SameSite=Strict is the first control; this is defense in depth.
 */
@Injectable()
export class AuthCsrfGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{
      method?: string;
      url?: string;
      routerPath?: string;
      headers?: Record<string, string | string[] | undefined>;
    }>();
    const method = (request.method ?? 'GET').toUpperCase();
    if (SAFE_METHODS.has(method)) {
      return true;
    }

    const path = `${request.routerPath ?? ''} ${request.url ?? ''}`;
    if (/\/auth\/(login|register|forgot-password|reset-password)(\?|$| )/.test(path)) {
      return true;
    }

    const cookies = parseCookieHeader(request.headers?.cookie);
    const hasSessionCookie =
      Boolean(cookies[ACCESS_COOKIE_NAME]) ||
      Boolean(cookies[REFRESH_COOKIE_NAME]) ||
      Boolean(cookies[CSRF_COOKIE_NAME]);
    if (!hasSessionCookie) {
      return true;
    }

    const header = headerValue(request.headers?.[CSRF_HEADER_NAME]);
    const cookie = cookies[CSRF_COOKIE_NAME];
    if (!header || !cookie || !secretsMatch(header, cookie)) {
      throw new ForbiddenException('Invalid CSRF token');
    }
    return true;
  }
}

function headerValue(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}
