import { describe, expect, it, vi } from 'vitest';
import {
  ConnectionEnvironmentBackfillAudit,
  ENVIRONMENT_BACKFILL_AUDIT_EVENT_TYPE,
  sanitizeEnvironmentBackfillAuditPayload,
} from './connection-environment-backfill-audit';
import { FIV_CONN_04_D_SYSTEM_JOB_ACTOR_ID } from './fiv-conn-04-d-system-job-identity';

describe('sanitizeEnvironmentBackfillAuditPayload', () => {
  it('retains parent §13 safe fields and strips unknown keys', () => {
    const result = sanitizeEnvironmentBackfillAuditPayload({
      connectionId: 'conn-1',
      workspaceId: 'ws-1',
      provider: 'binance',
      connectionType: 'EXCHANGE',
      previousEnvironment: null,
      newEnvironment: 'live',
      evidenceClass: 'ELIGIBLE_LIVE',
      vaultPurpose: 'LIVE_TRADING',
      outcome: 'updated_live',
      reasonCode: 'NULL_TO_LIVE',
      unexpectedExtra: 'drop-me',
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value).toEqual({
      connectionId: 'conn-1',
      workspaceId: 'ws-1',
      provider: 'binance',
      connectionType: 'EXCHANGE',
      previousEnvironment: null,
      newEnvironment: 'live',
      evidenceClass: 'ELIGIBLE_LIVE',
      vaultPurpose: 'LIVE_TRADING',
      outcome: 'updated_live',
      reasonCode: 'NULL_TO_LIVE',
    });
    expect(result.value).not.toHaveProperty('unexpectedExtra');
  });

  it('refuses forbidden sensitive keys before persist', () => {
    for (const key of [
      'apiKey',
      'sessionToken',
      'password',
      'wrappingKey',
      'ciphertext',
      'vaultSecretId',
      'clientSecret',
    ] as const) {
      const result = sanitizeEnvironmentBackfillAuditPayload({
        connectionId: 'conn-1',
        [key]: 'never-persist',
      });
      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.reason).toMatch(/forbidden or sensitive/);
    }
  });
});

describe('ConnectionEnvironmentBackfillAudit', () => {
  it('emits connection.environment-backfill with required attribution and sanitized payload', async () => {
    const record = vi.fn(async (_write: unknown, _transaction?: unknown) => ({ id: 'a' }));
    const audit = new ConnectionEnvironmentBackfillAudit({ record } as never);
    await audit.record({
      outcome: 'updated_live',
      actorId: FIV_CONN_04_D_SYSTEM_JOB_ACTOR_ID,
      workspaceId: 'ws-1',
      resourceType: 'connection',
      resourceId: 'conn-1',
      correlationId: 'corr-1',
      payload: {
        connectionId: 'conn-1',
        workspaceId: 'ws-1',
        provider: 'binance',
        previousEnvironment: null,
        newEnvironment: 'live',
        outcome: 'updated_live',
        dropMe: true,
      },
    });
    expect(record).toHaveBeenCalledTimes(1);
    expect(record).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: ENVIRONMENT_BACKFILL_AUDIT_EVENT_TYPE,
        outcome: 'updated_live',
        source: 'connections',
        correlationId: 'corr-1',
        attribution: {
          workspaceId: 'ws-1',
          actorId: FIV_CONN_04_D_SYSTEM_JOB_ACTOR_ID,
          resourceType: 'connection',
          resourceId: 'conn-1',
        },
        payload: expect.objectContaining({
          connectionId: 'conn-1',
          newEnvironment: 'live',
          outcome: 'updated_live',
        }),
      }),
      undefined,
    );
    const written = record.mock.calls[0]?.[0] as {
      payload: Record<string, unknown>;
    };
    expect(written.payload).not.toHaveProperty('dropMe');
  });

  it('forwards TransactionContext to SecurityAuditService.record', async () => {
    const record = vi.fn(async () => ({ id: 'a' }));
    const audit = new ConnectionEnvironmentBackfillAudit({ record } as never);
    const transaction = { prisma: {} } as never;
    await audit.record(
      {
        outcome: 'operation_summary',
        actorId: FIV_CONN_04_D_SYSTEM_JOB_ACTOR_ID,
        workspaceId: 'ws-1',
        resourceType: 'environment-backfill',
        resourceId: 'run-1',
        payload: {
          scanned: 10,
          updated: 3,
          blocked: 2,
          outcome: 'operation_summary',
        },
      },
      transaction,
    );
    expect(record).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: ENVIRONMENT_BACKFILL_AUDIT_EVENT_TYPE,
        outcome: 'operation_summary',
        attribution: expect.objectContaining({
          actorId: FIV_CONN_04_D_SYSTEM_JOB_ACTOR_ID,
          workspaceId: 'ws-1',
          resourceType: 'environment-backfill',
          resourceId: 'run-1',
        }),
      }),
      transaction,
    );
  });

  it('rejects payloads containing forbidden sensitive keys without calling record', async () => {
    const record = vi.fn(async () => ({ id: 'a' }));
    const audit = new ConnectionEnvironmentBackfillAudit({ record } as never);
    await expect(
      audit.record({
        outcome: 'updated_live',
        actorId: FIV_CONN_04_D_SYSTEM_JOB_ACTOR_ID,
        workspaceId: 'ws-1',
        resourceType: 'connection',
        resourceId: 'conn-1',
        payload: { sessionToken: 'never-persist' },
      }),
    ).rejects.toThrow(/payload rejected/);
    expect(record).not.toHaveBeenCalled();
  });

  it('rejects vaultSecretId at helper boundary (shared SecurityAuditService sensitive-key alignment)', async () => {
    const record = vi.fn(async () => ({ id: 'a' }));
    const audit = new ConnectionEnvironmentBackfillAudit({ record } as never);
    await expect(
      audit.record({
        outcome: 'blocked_missing_or_dangling',
        actorId: FIV_CONN_04_D_SYSTEM_JOB_ACTOR_ID,
        workspaceId: 'ws-1',
        resourceType: 'connection',
        resourceId: 'conn-1',
        payload: { vaultSecretId: 'opaque-id-only' },
      }),
    ).rejects.toThrow(/payload rejected/);
    expect(record).not.toHaveBeenCalled();
  });
});
