import { describe, expect, it } from 'vitest';
import { validateWebPushEndpointUrl } from './web-push-endpoint-guard';

/** Synthetic fixture — not a live Push service credential. */
const VALID = 'https://fcm.googleapis.com/fcm/send/abc123:APA91bExampleSyntheticEndpointNotReal';

function reasonOf(target: string): string | undefined {
  const result = validateWebPushEndpointUrl(target);
  return result.ok ? undefined : result.reason;
}

describe('Web Push endpoint URL guard', () => {
  it('accepts HTTPS push endpoints and preserves the exact URL', () => {
    const result = validateWebPushEndpointUrl(VALID);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.preservedUrl).toBe(VALID);
      expect(result.url.protocol).toBe('https:');
    }
  });

  it('accepts default HTTPS port and rejects non-443 custom ports', () => {
    expect(validateWebPushEndpointUrl('https://push.example.com/v1/send/token').ok).toBe(true);
    expect(validateWebPushEndpointUrl('https://push.example.com:443/v1/send/token').ok).toBe(true);
    expect(reasonOf('https://push.example.com:8443/v1/send/token')).toBe('blocked_port');
  });

  it('rejects HTTP scheme', () => {
    expect(reasonOf('http://push.example.com/v1/send/token')).toBe('blocked_scheme');
  });

  it('rejects localhost, loopback, private, link-local, and metadata destinations', () => {
    expect(reasonOf('https://localhost/push')).toBe('blocked_address');
    expect(reasonOf('https://app.localhost/push')).toBe('blocked_address');
    expect(reasonOf('https://127.0.0.1/push')).toBe('blocked_address');
    expect(reasonOf('https://10.0.0.8/push')).toBe('blocked_address');
    expect(reasonOf('https://192.168.1.1/push')).toBe('blocked_address');
    expect(reasonOf('https://172.16.5.1/push')).toBe('blocked_address');
    expect(reasonOf('https://169.254.169.254/latest')).toBe('blocked_address');
    expect(reasonOf('https://metadata.google.internal/')).toBe('blocked_address');
  });

  it('rejects IP literal hostnames even when not in private ranges', () => {
    expect(reasonOf('https://8.8.8.8/push')).toBe('blocked_ip_literal');
    expect(reasonOf('https://[2001:4860:4860::8888]/push')).toBe('blocked_ip_literal');
  });

  it('rejects userinfo and fragment', () => {
    expect(reasonOf('https://user:pass@push.example.com/v1/send')).toBe('userinfo');
    expect(reasonOf(`${VALID}#frag`)).toBe('fragment');
  });

  it('rejects empty, invalid, and oversized URLs', () => {
    expect(reasonOf('')).toBe('invalid');
    expect(reasonOf('   ')).toBe('invalid');
    expect(reasonOf('not-a-url')).toBe('invalid');
    expect(reasonOf(`https://push.example.com/${'a'.repeat(4100)}`)).toBe('too_long');
  });

  it('trims surrounding whitespace before validation', () => {
    const padded = `  ${VALID}  `;
    const result = validateWebPushEndpointUrl(padded);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.preservedUrl).toBe(VALID);
    }
  });
});
