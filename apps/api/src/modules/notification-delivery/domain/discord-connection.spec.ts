import { describe, expect, it } from 'vitest';
import {
  bindDiscordChannel,
  disconnectDiscordConnection,
  markDiscordWebhookFailed,
  markDiscordWebhookVerified,
  notConnectedDiscord,
} from './discord-connection';

describe('DiscordConnection domain', () => {
  it('bind → pending; successful test → connected; failed test stays pending; disconnect clears', () => {
    const base = notConnectedDiscord('ws-1', 'user-1', '2026-09-16T00:00:00.000Z');
    expect(base.status).toBe('not-connected');

    const pending = bindDiscordChannel(base, '2026-09-16T00:01:00.000Z');
    expect(pending.status).toBe('pending');
    expect(pending.boundAt).toBe('2026-09-16T00:01:00.000Z');

    const failed = markDiscordWebhookFailed(
      pending,
      '2026-09-16T00:02:00.000Z',
      'discord_webhook_timeout',
    );
    expect(failed.status).toBe('pending');
    expect(failed.lastErrorCode).toBe('discord_webhook_timeout');

    const connected = markDiscordWebhookVerified(pending, '2026-09-16T00:03:00.000Z');
    expect(connected.status).toBe('connected');
    expect(connected.verifiedAt).toBe('2026-09-16T00:03:00.000Z');
    expect(connected.lastErrorCode).toBeUndefined();

    const disconnected = disconnectDiscordConnection(connected, '2026-09-16T00:04:00.000Z');
    expect(disconnected.status).toBe('not-connected');
    expect(disconnected.boundAt).toBeUndefined();
  });

  it('rejects verify when not bound', () => {
    const base = notConnectedDiscord('ws-1', 'user-1', '2026-09-16T00:00:00.000Z');
    expect(() => markDiscordWebhookVerified(base, '2026-09-16T00:01:00.000Z')).toThrow(/not bound/);
  });
});
