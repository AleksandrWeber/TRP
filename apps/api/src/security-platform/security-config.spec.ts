import { describe, expect, it } from 'vitest';
import {
  assertSecurityPlatformBoot,
  collectSecurityPlatformIssues,
  loadSecurityPlatformConfig,
  resolveNestThrottlerOptions,
  SecurityPlatformBootError,
  verifySecurityPlatformConfig,
} from './security-config';

describe('security-config (V3-S04-a)', () => {
  it('loads development defaults without insecure bypass', () => {
    const config = loadSecurityPlatformConfig({ NODE_ENV: 'development' });
    expect(config.isProduction).toBe(false);
    expect(config.allowInsecureMode).toBe(false);
    expect(config.exposeErrorDetail).toBe(true);
  });

  it('refuses production boot with default JWT secret', () => {
    expect(() =>
      assertSecurityPlatformBoot({
        NODE_ENV: 'production',
        JWT_SECRET: 'dev-only-change-me',
        DATABASE_URL: 'postgresql://trp:trp@localhost:5432/trp',
      }),
    ).toThrow(SecurityPlatformBootError);
  });

  it('refuses production boot when SECURITY_ALLOW_INSECURE_MODE is set', () => {
    const env = {
      NODE_ENV: 'production',
      JWT_SECRET: 'production-secret-16+',
      DATABASE_URL: 'postgresql://trp:trp@localhost:5432/trp',
      API_ALLOWED_HOSTS: 'api.trp.example',
      SECURITY_ALLOW_INSECURE_MODE: 'true',
    };
    const issues = collectSecurityPlatformIssues(loadSecurityPlatformConfig(env), env);
    expect(issues).toContain('SECURITY_ALLOW_INSECURE_MODE is forbidden when NODE_ENV=production');
    expect(() => assertSecurityPlatformBoot(env)).toThrow(SecurityPlatformBootError);
  });

  it('allows insecure mode only outside production', () => {
    const env = {
      NODE_ENV: 'development',
      DATABASE_URL: 'postgresql://trp:trp@localhost:5432/trp',
      SECURITY_ALLOW_INSECURE_MODE: 'true',
    };
    const verification = verifySecurityPlatformConfig(env);
    expect(verification.valid).toBe(true);
    expect(loadSecurityPlatformConfig(env).allowInsecureMode).toBe(true);
  });

  it('refuses SECURITY_DISABLE_ERROR_SANITIZATION in production', () => {
    const env = {
      NODE_ENV: 'production',
      JWT_SECRET: 'production-secret-16+',
      DATABASE_URL: 'postgresql://trp:trp@localhost:5432/trp',
      API_ALLOWED_HOSTS: 'api.trp.example',
      SECURITY_DISABLE_ERROR_SANITIZATION: 'true',
    };
    const issues = collectSecurityPlatformIssues(loadSecurityPlatformConfig(env), env);
    expect(issues).toContain(
      'SECURITY_DISABLE_ERROR_SANITIZATION is forbidden when NODE_ENV=production',
    );
  });

  it('requires an explicit API host allowlist in production', () => {
    const env = {
      NODE_ENV: 'production',
      JWT_SECRET: 'production-secret-16+',
      DATABASE_URL: 'postgresql://trp:trp@localhost:5432/trp',
    };
    expect(() => assertSecurityPlatformBoot(env)).toThrow(
      'API_ALLOWED_HOSTS must list the public API hosts when NODE_ENV=production',
    );
  });

  it('loads bounded HTTP size and timeout defaults', () => {
    const config = loadSecurityPlatformConfig({
      API_MAX_REQUEST_BODY_BYTES: '4096',
      API_REQUEST_TIMEOUT_MS: '45000',
    });
    expect(config.maxRequestBodyBytes).toBe(4096);
    expect(config.requestTimeoutMs).toBe(45000);
  });

  it('loads separate platform and sensitive abuse quotas', () => {
    const config = loadSecurityPlatformConfig({
      API_PLATFORM_RATE_LIMIT: '150',
      API_PLATFORM_RATE_WINDOW_MS: '120000',
      API_SENSITIVE_RATE_LIMIT: '12',
      API_SENSITIVE_RATE_WINDOW_MS: '30000',
    });

    expect(config.platformAbusePolicy).toEqual({
      general: { limit: 150, windowMs: 120000 },
      sensitive: { limit: 12, windowMs: 30000 },
    });
  });

  it('aligns Nest throttler defaults with the platform general quota', () => {
    expect(
      resolveNestThrottlerOptions({
        API_PLATFORM_RATE_LIMIT: '150',
        API_PLATFORM_RATE_WINDOW_MS: '120000',
      }),
    ).toEqual({ limit: 150, ttl: 120000 });

    expect(
      resolveNestThrottlerOptions({
        API_PLATFORM_RATE_LIMIT: '120',
        API_THROTTLE_LIMIT: '80',
        API_THROTTLE_TTL_MS: '45000',
      }),
    ).toEqual({ limit: 80, ttl: 45000 });
  });

  it('refuses production boot when browser policy is disabled', () => {
    expect(() =>
      assertSecurityPlatformBoot({
        NODE_ENV: 'production',
        JWT_SECRET: 'production-secret-16+',
        DATABASE_URL: 'postgresql://trp:trp@localhost:5432/trp',
        API_ALLOWED_HOSTS: 'api.trp.example',
        SECURITY_DISABLE_BROWSER_POLICY: 'true',
      }),
    ).toThrow(SecurityPlatformBootError);
  });
});
