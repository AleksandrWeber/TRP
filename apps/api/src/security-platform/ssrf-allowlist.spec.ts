import { describe, expect, it } from 'vitest';
import { validateOutboundSsrfTarget } from './ssrf-allowlist';

describe('ssrf-allowlist (V3-S04-e)', () => {
  it('accepts allowlisted https targets', () => {
    expect(
      validateOutboundSsrfTarget('https://hooks.example.com/path', ['hooks.example.com']),
    ).toEqual({
      ok: true,
      url: new URL('https://hooks.example.com/path'),
    });
  });

  it('blocks link-local and cloud metadata addresses', () => {
    expect(validateOutboundSsrfTarget('http://169.254.169.254/latest/meta-data')).toEqual({
      ok: false,
      reason: 'blocked_address',
    });
    expect(
      validateOutboundSsrfTarget('http://metadata.google.internal/computeMetadata/v1/'),
    ).toEqual({
      ok: false,
      reason: 'blocked_address',
    });
  });

  it('blocks loopback and private network targets', () => {
    expect(validateOutboundSsrfTarget('http://127.0.0.1:3000/admin')).toEqual({
      ok: false,
      reason: 'blocked_address',
    });
    expect(validateOutboundSsrfTarget('http://10.0.0.12/internal')).toEqual({
      ok: false,
      reason: 'blocked_address',
    });
    expect(validateOutboundSsrfTarget('http://192.168.1.20/status')).toEqual({
      ok: false,
      reason: 'blocked_address',
    });
  });

  it('blocks non-http schemes and hosts outside the allowlist', () => {
    expect(validateOutboundSsrfTarget('file:///etc/passwd')).toEqual({
      ok: false,
      reason: 'blocked_scheme',
    });
    expect(validateOutboundSsrfTarget('https://evil.example/steal', ['hooks.example.com'])).toEqual(
      {
        ok: false,
        reason: 'blocked_host',
      },
    );
  });
});
