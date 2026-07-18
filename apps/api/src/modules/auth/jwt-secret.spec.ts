import { describe, expect, it } from 'vitest';
import { DEV_JWT_FALLBACK_SECRET, resolveJwtSecret } from './jwt-secret';

function config(values: Record<string, string | undefined>) {
  return {
    get: (key: string) => values[key],
  };
}

describe('US158 — JWT secret hardening', () => {
  it('allows the development fallback outside production', () => {
    expect(resolveJwtSecret(config({}), { NODE_ENV: 'development' })).toBe(DEV_JWT_FALLBACK_SECRET);
    expect(
      resolveJwtSecret(config({ JWT_SECRET: DEV_JWT_FALLBACK_SECRET }), {
        NODE_ENV: 'test',
      }),
    ).toBe(DEV_JWT_FALLBACK_SECRET);
  });

  it('rejects insecure production fallbacks and short secrets', () => {
    expect(() => resolveJwtSecret(config({}), { NODE_ENV: 'production' })).toThrow(
      /JWT_SECRET must be set/,
    );
    expect(() =>
      resolveJwtSecret(config({ JWT_SECRET: DEV_JWT_FALLBACK_SECRET, NODE_ENV: 'production' }), {
        NODE_ENV: 'production',
      }),
    ).toThrow(/JWT_SECRET must be set/);
    expect(() =>
      resolveJwtSecret(config({ JWT_SECRET: 'too-short', NODE_ENV: 'development' }), {
        NODE_ENV: 'development',
      }),
    ).toThrow(/at least 16 characters/);
  });
});
