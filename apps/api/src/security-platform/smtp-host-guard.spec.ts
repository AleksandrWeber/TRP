import { describe, expect, it } from 'vitest';
import { validateSmtpOutboundHost } from './smtp-host-guard';

describe('validateSmtpOutboundHost', () => {
  it('allows a public SMTP hostname', () => {
    expect(validateSmtpOutboundHost('smtp.example.com')).toEqual({
      ok: true,
      host: 'smtp.example.com',
    });
  });

  it('blocks private, loopback, and metadata addresses', () => {
    expect(validateSmtpOutboundHost('127.0.0.1').ok).toBe(false);
    expect(validateSmtpOutboundHost('10.0.0.12').ok).toBe(false);
    expect(validateSmtpOutboundHost('192.168.1.20').ok).toBe(false);
    expect(validateSmtpOutboundHost('169.254.169.254').ok).toBe(false);
    expect(validateSmtpOutboundHost('localhost').ok).toBe(false);
    expect(validateSmtpOutboundHost('::1').ok).toBe(false);
  });

  it('rejects schemes and path injection', () => {
    expect(validateSmtpOutboundHost('https://smtp.example.com').ok).toBe(false);
    expect(validateSmtpOutboundHost('smtp.example.com/steal').ok).toBe(false);
    expect(validateSmtpOutboundHost('').ok).toBe(false);
  });
});
