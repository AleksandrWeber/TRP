import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { AuthCsrfGuard } from './auth-csrf.guard';

function context(params: {
  method: string;
  url?: string;
  cookie?: string;
  csrfHeader?: string;
}): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({
        method: params.method,
        url: params.url ?? '/v1/auth/refresh',
        headers: {
          cookie: params.cookie,
          'x-csrf-token': params.csrfHeader,
        },
      }),
    }),
  } as ExecutionContext;
}

describe('AuthCsrfGuard (V3-S01-c)', () => {
  const guard = new AuthCsrfGuard();

  it('skips safe methods and login without cookies', () => {
    expect(guard.canActivate(context({ method: 'GET' }))).toBe(true);
    expect(guard.canActivate(context({ method: 'POST', url: '/v1/auth/login' }))).toBe(true);
    expect(guard.canActivate(context({ method: 'POST', url: '/v1/auth/forgot-password' }))).toBe(
      true,
    );
    expect(guard.canActivate(context({ method: 'POST', cookie: undefined }))).toBe(true);
  });

  it('requires a matching CSRF header when a refresh cookie is present', () => {
    expect(() =>
      guard.canActivate(
        context({ method: 'POST', cookie: 'trp_refresh=secret; trp_csrf=token-1' }),
      ),
    ).toThrow(ForbiddenException);

    expect(
      guard.canActivate(
        context({
          method: 'POST',
          cookie: 'trp_refresh=secret; trp_csrf=token-1',
          csrfHeader: 'token-1',
        }),
      ),
    ).toBe(true);
  });

  it('requires a matching CSRF header for cookie-authenticated People role assignment', () => {
    expect(() =>
      guard.canActivate(
        context({
          method: 'PATCH',
          url: '/v1/people/11111111-1111-4111-8111-111111111111/role',
          cookie: 'trp_refresh=secret; trp_csrf=token-1',
        }),
      ),
    ).toThrow(ForbiddenException);

    expect(
      guard.canActivate(
        context({
          method: 'PATCH',
          url: '/v1/people/11111111-1111-4111-8111-111111111111/role',
          cookie: 'trp_refresh=secret; trp_csrf=token-1',
          csrfHeader: 'token-1',
        }),
      ),
    ).toBe(true);
  });
});
