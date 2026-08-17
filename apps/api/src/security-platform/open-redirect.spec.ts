import { describe, expect, it } from 'vitest';
import { validateOpenRedirectTarget } from './open-redirect';

describe('open-redirect (V3-S04-b)', () => {
  const allowed = ['https://app.example.com', 'http://localhost:5173'];

  it('allows relative in-app paths', () => {
    expect(validateOpenRedirectTarget('/reset-password?token=abc', allowed)).toEqual({
      ok: true,
      target: '/reset-password?token=abc',
    });
  });

  it('rejects protocol-relative targets', () => {
    expect(validateOpenRedirectTarget('//evil.example/phish', allowed)).toEqual({
      ok: false,
      reason: 'protocol_relative',
    });
  });

  it('rejects external absolute targets', () => {
    expect(validateOpenRedirectTarget('https://evil.example/phish', allowed)).toEqual({
      ok: false,
      reason: 'external',
    });
  });

  it('allows explicitly allowlisted absolute targets', () => {
    expect(validateOpenRedirectTarget('https://app.example.com/dashboard', allowed)).toEqual({
      ok: true,
      target: 'https://app.example.com/dashboard',
    });
  });
});
