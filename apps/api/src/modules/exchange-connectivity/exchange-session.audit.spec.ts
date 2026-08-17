import { describe, expect, it } from 'vitest';
import { ExchangeSessionAudit } from './exchange-session.audit';

describe('Exchange session audit (W2-S02-c)', () => {
  it('emits session lifecycle events without secrets or trading claims', async () => {
    const writes: unknown[] = [];
    const audit = new ExchangeSessionAudit({
      record: async (write: unknown) => {
        writes.push(write);
      },
    } as never);

    await audit.record({
      outcome: 'session_established',
      workspaceId: 'workspace-a',
      actorUserId: 'operator-a',
      connectionId: 'connection-a',
      provider: 'BINANCE',
    });
    await audit.record({
      outcome: 'session_expired',
      workspaceId: 'workspace-a',
      actorUserId: 'operator-a',
      connectionId: 'connection-a',
      provider: 'BINANCE',
    });
    await audit.record({
      outcome: 'connection_lost',
      workspaceId: 'workspace-a',
      actorUserId: 'operator-a',
      connectionId: 'connection-a',
      provider: 'BINANCE',
    });
    await audit.record({
      outcome: 'reconnect_required',
      workspaceId: 'workspace-a',
      actorUserId: 'operator-a',
      connectionId: 'connection-a',
      provider: 'BINANCE',
    });

    expect(writes).toEqual([
      sessionWrite('session_established'),
      sessionWrite('session_expired'),
      sessionWrite('connection_lost'),
      sessionWrite('reconnect_required'),
    ]);
    expect(JSON.stringify(writes)).not.toMatch(/apiKey|apiSecret|signature|ciphertext/i);
    expect(JSON.stringify(writes)).not.toContain('Trading enabled');
  });
});

function sessionWrite(outcome: string) {
  return {
    eventType: 'connection.lifecycle',
    outcome,
    source: 'exchange-connectivity',
    attribution: {
      workspaceId: 'workspace-a',
      actorId: 'operator-a',
      resourceType: 'connection',
      resourceId: 'connection-a',
    },
    payload: { session: true, provider: 'BINANCE' },
  };
}
