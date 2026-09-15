import { describe, expect, it } from 'vitest';
import {
  bindSlackChannel,
  disconnectSlackConnection,
  markSlackWebhookFailed,
  markSlackWebhookVerified,
  notConnectedSlack,
} from './slack-connection';

describe('SlackConnection domain', () => {
  it('bind → pending; successful test → connected; failed test stays pending; disconnect clears', () => {
    const base = notConnectedSlack('ws-1', 'user-1', '2026-09-15T00:00:00.000Z');
    expect(base.status).toBe('not-connected');

    const pending = bindSlackChannel(base, '2026-09-15T00:01:00.000Z');
    expect(pending.status).toBe('pending');
    expect(pending.boundAt).toBe('2026-09-15T00:01:00.000Z');

    const failed = markSlackWebhookFailed(
      pending,
      '2026-09-15T00:02:00.000Z',
      'slack_webhook_timeout',
    );
    expect(failed.status).toBe('pending');
    expect(failed.lastErrorCode).toBe('slack_webhook_timeout');

    const connected = markSlackWebhookVerified(pending, '2026-09-15T00:03:00.000Z');
    expect(connected.status).toBe('connected');
    expect(connected.verifiedAt).toBe('2026-09-15T00:03:00.000Z');
    expect(connected.lastErrorCode).toBeUndefined();

    const disconnected = disconnectSlackConnection(connected, '2026-09-15T00:04:00.000Z');
    expect(disconnected.status).toBe('not-connected');
    expect(disconnected.boundAt).toBeUndefined();
  });
});
