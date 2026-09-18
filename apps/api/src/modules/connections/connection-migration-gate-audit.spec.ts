import { describe, expect, it, vi } from 'vitest';
import { ConnectionMigrationGateAudit } from './connection-migration-gate-audit';
import { MIGRATION_GATE_AUDIT_EVENT_TYPE } from './migration-gate';

describe('ConnectionMigrationGateAudit', () => {
  it('emits connection.migration-gate with actor attribution and sanitized payload', async () => {
    const record = vi.fn(async () => ({ id: 'a' }));
    const audit = new ConnectionMigrationGateAudit({ record } as never);
    await audit.record({
      outcome: 'gate_acquired',
      actorId: 'op-1',
      correlationId: 'c-1',
      payload: {
        gateKey: 'FIV-CONN-04',
        purpose: 'FIV_CONN_04_MIGRATION_BACKFILL',
        fenceGeneration: 1,
        outcome: 'gate_acquired',
      },
    });
    expect(record).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: MIGRATION_GATE_AUDIT_EVENT_TYPE,
        outcome: 'gate_acquired',
        source: 'connections',
        attribution: expect.objectContaining({
          actorId: 'op-1',
          resourceType: 'migration-gate',
          resourceId: 'FIV-CONN-04',
        }),
      }),
      undefined,
    );
  });

  it('rejects payloads containing forbidden fencingToken key', async () => {
    const record = vi.fn(async () => ({ id: 'a' }));
    const audit = new ConnectionMigrationGateAudit({ record } as never);
    await expect(
      audit.record({
        outcome: 'gate_acquired',
        actorId: 'op-1',
        payload: { fencingToken: 1 } as never,
      }),
    ).rejects.toThrow(/payload rejected/);
    expect(record).not.toHaveBeenCalled();
  });
});
