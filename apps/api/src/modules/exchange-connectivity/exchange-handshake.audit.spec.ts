import { describe, expect, it } from 'vitest';
import { ExchangeHandshakeAudit } from './exchange-handshake.audit';

describe('Exchange handshake audit (W2-S02-b)', () => {
  it('emits handshake started, succeeded, and failed without secrets', async () => {
    const writes: unknown[] = [];
    const audit = new ExchangeHandshakeAudit({
      record: async (write: unknown) => {
        writes.push(write);
      },
    } as never);

    await audit.record({
      outcome: 'handshake_started',
      workspaceId: 'workspace-a',
      actorUserId: 'operator-a',
      connectionId: 'connection-a',
      provider: 'BINANCE',
    });
    await audit.record({
      outcome: 'handshake_succeeded',
      workspaceId: 'workspace-a',
      actorUserId: 'operator-a',
      connectionId: 'connection-a',
      provider: 'BINANCE',
    });
    await audit.record({
      outcome: 'handshake_failed',
      workspaceId: 'workspace-a',
      actorUserId: 'operator-a',
      connectionId: 'connection-a',
      provider: 'BINANCE',
      failure: 'AUTHENTICATION_FAILED',
    });

    expect(writes).toEqual([
      {
        eventType: 'connection.validation',
        outcome: 'handshake_started',
        source: 'exchange-connectivity',
        attribution: {
          workspaceId: 'workspace-a',
          actorId: 'operator-a',
          resourceType: 'connection',
          resourceId: 'connection-a',
        },
        payload: { handshake: true, provider: 'BINANCE' },
      },
      {
        eventType: 'connection.validation',
        outcome: 'handshake_succeeded',
        source: 'exchange-connectivity',
        attribution: {
          workspaceId: 'workspace-a',
          actorId: 'operator-a',
          resourceType: 'connection',
          resourceId: 'connection-a',
        },
        payload: { handshake: true, provider: 'BINANCE' },
      },
      {
        eventType: 'connection.validation',
        outcome: 'handshake_failed',
        source: 'exchange-connectivity',
        attribution: {
          workspaceId: 'workspace-a',
          actorId: 'operator-a',
          resourceType: 'connection',
          resourceId: 'connection-a',
        },
        payload: { handshake: true, provider: 'BINANCE', failure: 'AUTHENTICATION_FAILED' },
      },
    ]);
    expect(JSON.stringify(writes)).not.toMatch(/apiKey|apiSecret|signature|ciphertext/i);
  });
});
