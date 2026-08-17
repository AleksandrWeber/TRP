import { describe, expect, it } from 'vitest';
import { ConnectionValidationAudit } from './connection-validation-audit';

describe('ConnectionValidationAudit (W2-S01-c)', () => {
  it('emits a workspace-attributed lifecycle event without credential material', async () => {
    const writes: unknown[] = [];
    const audit = new ConnectionValidationAudit({
      record: async (write: unknown) => {
        writes.push(write);
      },
    } as never);

    await audit.record({
      outcome: 'started',
      workspaceId: 'workspace-a',
      actorUserId: 'operator-a',
      connectionId: 'connection-a',
      provider: 'BINANCE',
    });

    expect(writes).toEqual([
      {
        eventType: 'connection.validation',
        outcome: 'started',
        source: 'connections',
        attribution: {
          workspaceId: 'workspace-a',
          actorId: 'operator-a',
          resourceType: 'connection',
          resourceId: 'connection-a',
        },
        payload: { provider: 'BINANCE' },
      },
    ]);
  });
});
