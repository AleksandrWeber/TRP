import { describe, expect, it } from 'vitest';
import {
  bindEmailRecipient,
  disconnectEmailConnection,
  markEmailSmtpFailed,
  markEmailSmtpVerified,
  notConnectedEmail,
  parseEmailRecipient,
} from './email-connection';

describe('EmailConnection', () => {
  it('does not become connected from recipient bind alone', () => {
    const base = notConnectedEmail('ws-1', 'user-1', '2026-09-14T00:00:00.000Z');
    const pending = bindEmailRecipient(base, 'ops@example.com', '2026-09-14T00:01:00.000Z');
    expect(pending.status).toBe('pending');
    expect(pending.recipient).toBe('ops@example.com');
    expect(pending.verifiedAt).toBeUndefined();
  });

  it('becomes connected only after SMTP verification', () => {
    const pending = bindEmailRecipient(
      notConnectedEmail('ws-1', 'user-1', '2026-09-14T00:00:00.000Z'),
      'ops@example.com',
      '2026-09-14T00:01:00.000Z',
    );
    const connected = markEmailSmtpVerified(pending, '2026-09-14T00:02:00.000Z');
    expect(connected.status).toBe('connected');
    expect(connected.verifiedAt).toBe('2026-09-14T00:02:00.000Z');
  });

  it('failed SMTP verification leaves pending, not connected', () => {
    const pending = bindEmailRecipient(
      notConnectedEmail('ws-1', 'user-1', '2026-09-14T00:00:00.000Z'),
      'ops@example.com',
      '2026-09-14T00:01:00.000Z',
    );
    const connected = markEmailSmtpVerified(pending, '2026-09-14T00:02:00.000Z');
    const failed = markEmailSmtpFailed(connected, '2026-09-14T00:03:00.000Z');
    expect(failed.status).toBe('pending');
    expect(failed.recipient).toBe('ops@example.com');
    expect(failed.verifiedAt).toBeUndefined();
  });

  it('disconnect clears recipient and connected state', () => {
    const connected = markEmailSmtpVerified(
      bindEmailRecipient(
        notConnectedEmail('ws-1', 'user-1', '2026-09-14T00:00:00.000Z'),
        'ops@example.com',
        '2026-09-14T00:01:00.000Z',
      ),
      '2026-09-14T00:02:00.000Z',
    );
    const disconnected = disconnectEmailConnection(connected, '2026-09-14T00:04:00.000Z');
    expect(disconnected.status).toBe('not-connected');
    expect(disconnected.recipient).toBeUndefined();
  });

  it('rejects header-injection and empty recipients', () => {
    expect(parseEmailRecipient('ops@example.com\nBcc:evil@example.com').ok).toBe(false);
    expect(parseEmailRecipient('').ok).toBe(false);
    expect(parseEmailRecipient('not-an-email').ok).toBe(false);
  });
});
