import { describe, expect, it } from 'vitest';
import { collectBrowserSecurityIssues, createBrowserSecurityPolicy } from './browser-security';

describe('browser-security (V3-S04-c)', () => {
  it('uses strict production CSP without development script or websocket allowances', () => {
    const policy = createBrowserSecurityPolicy({ NODE_ENV: 'production' });
    const directives = policy.contentSecurityPolicy.directives;

    expect(directives['default-src']).toEqual(["'self'"]);
    expect(directives['frame-ancestors']).toEqual(["'none'"]);
    expect(directives['object-src']).toEqual(["'none'"]);
    expect(directives['script-src']).not.toContain("'unsafe-inline'");
    expect(directives['connect-src']).not.toContain('ws://localhost:5173');
    expect(policy.frameguard.action).toBe('deny');
    expect(policy.noSniff).toBe(true);
    expect(policy.referrerPolicy.policy).toBe('no-referrer');
    expect(policy.crossOriginResourcePolicy.policy).toBe('cross-origin');
    expect(policy.hsts).toEqual({
      maxAge: 31_536_000,
      includeSubDomains: true,
      preload: false,
    });
  });

  it('refuses production boot when browser policy is disabled', () => {
    expect(
      collectBrowserSecurityIssues({
        NODE_ENV: 'production',
        SECURITY_DISABLE_BROWSER_POLICY: 'true',
      }),
    ).toContain('SECURITY_DISABLE_BROWSER_POLICY is forbidden when NODE_ENV=production');
  });

  it('limits development allowances to Vite live reload compatibility', () => {
    const policy = createBrowserSecurityPolicy({ NODE_ENV: 'development' });
    const directives = policy.contentSecurityPolicy.directives;

    expect(directives['connect-src']).toContain('http://localhost:3000');
    expect(directives['connect-src']).toContain('ws://localhost:5173');
    expect(directives['script-src']).toContain("'unsafe-inline'");
    expect(policy.crossOriginEmbedderPolicy).toBe(false);
    expect(policy.hsts).toBe(false);
  });
});
