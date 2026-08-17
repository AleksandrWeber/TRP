import { describe, expect, it } from 'vitest';
import { ExchangeSessionAudit } from './exchange-session.audit';
import { ExchangeSessionService } from './exchange-session.service';
import { IllegalExchangeSessionTransitionError } from './exchange-session.state';

function memoryAudit() {
  const events: Array<{ outcome: string }> = [];
  return {
    events,
    record: async (write: { outcome: string }) => {
      events.push({ outcome: write.outcome });
    },
  };
}

describe('Exchange session service (W2-S02-c)', () => {
  it('establishes, expires, and loses a session without automatically reconnecting', async () => {
    const audit = memoryAudit();
    const sessions = new ExchangeSessionService(new ExchangeSessionAudit(audit as never));

    expect(sessions.projection('EXCHANGE', 'CONNECTED')?.health).toBe('HEALTHY');
    expect(sessions.observe('CONNECTED', 'SESSION_EXPIRED')).toBe('SESSION_EXPIRED');
    expect(sessions.observe('CONNECTED', 'CONNECTION_LOST')).toBe('CONNECTION_LOST');
    expect(sessions.automaticReconnectEnabled()).toBe(false);
    expect(() => sessions.observe('DISCONNECTED', 'CONNECTION_LOST')).toThrow(
      IllegalExchangeSessionTransitionError,
    );

    const actor = {
      workspaceId: 'workspace-a',
      actorUserId: 'operator-a',
      connectionId: 'connection-a',
      provider: 'BINANCE',
    };
    await sessions.established(actor);
    await sessions.expired(actor);
    await sessions.connectionLost(actor);

    expect(audit.events.map((event) => event.outcome)).toEqual([
      'session_established',
      'session_expired',
      'reconnect_required',
      'connection_lost',
      'reconnect_required',
    ]);
  });
});
