import { describe, expect, it } from 'vitest';
import { ExchangeCapabilityAudit } from './exchange-capability.audit';

describe('Exchange capability audit (W2-S02-d)', () => {
  it('emits capability verification events without secrets or trading claims', async () => {
    const writes: unknown[] = [];
    const audit = new ExchangeCapabilityAudit({
      record: async (write: unknown) => {
        writes.push(write);
      },
    } as never);

    await audit.record({
      outcome: 'capability_verification_started',
      workspaceId: 'workspace-a',
      actorUserId: 'operator-a',
      connectionId: 'connection-a',
      provider: 'BINANCE',
    });
    await audit.record({
      outcome: 'capability_verification_completed',
      workspaceId: 'workspace-a',
      actorUserId: 'operator-a',
      connectionId: 'connection-a',
      provider: 'BINANCE',
    });
    await audit.record({
      outcome: 'capability_verification_failed',
      workspaceId: 'workspace-a',
      actorUserId: 'operator-a',
      connectionId: 'connection-a',
      provider: 'BINANCE',
    });

    expect(writes).toEqual([
      capabilityWrite('capability_verification_started'),
      capabilityWrite('capability_verification_completed'),
      capabilityWrite('capability_verification_failed'),
    ]);
    expect(JSON.stringify(writes)).not.toMatch(/apiKey|apiSecret|signature|ciphertext/i);
    expect(JSON.stringify(writes)).not.toContain('Trading enabled');
    expect(JSON.stringify(writes)).not.toContain('balances');
  });
});

function capabilityWrite(outcome: string) {
  return {
    eventType: 'connection.validation',
    outcome,
    source: 'exchange-connectivity',
    attribution: {
      workspaceId: 'workspace-a',
      actorId: 'operator-a',
      resourceType: 'connection',
      resourceId: 'connection-a',
    },
    payload: { capabilityVerification: true, provider: 'BINANCE' },
  };
}
