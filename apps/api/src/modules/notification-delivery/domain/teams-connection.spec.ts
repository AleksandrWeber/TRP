import { describe, expect, it } from 'vitest';
import {
  bindTeamsChannel,
  disconnectTeamsConnection,
  markTeamsWebhookFailed,
  markTeamsWebhookVerified,
  notConnectedTeams,
} from './teams-connection';

describe('TeamsConnection domain', () => {
  it('bind → pending; successful test → connected; failed test stays pending; disconnect clears', () => {
    const base = notConnectedTeams('ws-1', 'user-1', '2026-09-16T00:00:00.000Z');
    expect(base.status).toBe('not-connected');

    const pending = bindTeamsChannel(base, '2026-09-16T00:01:00.000Z');
    expect(pending.status).toBe('pending');
    expect(pending.boundAt).toBe('2026-09-16T00:01:00.000Z');

    const failed = markTeamsWebhookFailed(
      pending,
      '2026-09-16T00:02:00.000Z',
      'teams_webhook_timeout',
    );
    expect(failed.status).toBe('pending');
    expect(failed.lastErrorCode).toBe('teams_webhook_timeout');

    const connected = markTeamsWebhookVerified(pending, '2026-09-16T00:03:00.000Z');
    expect(connected.status).toBe('connected');
    expect(connected.verifiedAt).toBe('2026-09-16T00:03:00.000Z');
    expect(connected.lastErrorCode).toBeUndefined();

    const disconnected = disconnectTeamsConnection(connected, '2026-09-16T00:04:00.000Z');
    expect(disconnected.status).toBe('not-connected');
    expect(disconnected.boundAt).toBeUndefined();
  });

  it('rejects verify when not bound', () => {
    const base = notConnectedTeams('ws-1', 'user-1', '2026-09-16T00:00:00.000Z');
    expect(() => markTeamsWebhookVerified(base, '2026-09-16T00:01:00.000Z')).toThrow(/not bound/);
  });
});
