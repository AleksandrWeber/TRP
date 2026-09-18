/**
 * FIV-CONN-04-B-02 — durable migration-gate adapter tests (mocked Prisma CAS).
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockClient = {
  $queryRaw: vi.fn(),
  connectionMigrationGateLease: {
    findUnique: vi.fn(),
    updateMany: vi.fn(),
  },
};

vi.mock('../../storage/prisma/prisma-transaction.service', () => ({
  PrismaTransactionService: class {
    run<T>(work: (tx: object) => Promise<T>): Promise<T> {
      return work({});
    }
  },
  prismaClientForTransaction: () => mockClient,
}));

import {
  MIGRATION_GATE_KEY_FIV_CONN_04,
  MIGRATION_GATE_MAX_AUTHORIZED_WINDOW_MS,
  MIGRATION_GATE_PURPOSE_FIV_CONN_04_MIGRATION_BACKFILL,
  type MigrationGateGrant,
} from './migration-gate';
import { MIGRATION_GATE_DEFAULT_TTL_MS } from './migration-gate.constants';
import { PrismaMigrationGateAdapter } from './prisma-migration-gate.adapter';

type Row = {
  gateKey: string;
  purpose: string;
  state: string;
  holderId: string | null;
  fenceGeneration: number;
  acquiredAt: Date | null;
  expiresAt: Date | null;
  authorizedWindowMs: number | null;
  authorizedUntil: Date | null;
  heartbeatAt: Date | null;
  actorKind: string | null;
  correlationId: string | null;
};

function inactive(fence = 0): Row {
  return {
    gateKey: MIGRATION_GATE_KEY_FIV_CONN_04,
    purpose: MIGRATION_GATE_PURPOSE_FIV_CONN_04_MIGRATION_BACKFILL,
    state: 'INACTIVE',
    holderId: null,
    fenceGeneration: fence,
    acquiredAt: null,
    expiresAt: null,
    authorizedWindowMs: null,
    authorizedUntil: null,
    heartbeatAt: null,
    actorKind: null,
    correlationId: null,
  };
}

function active(
  partial: Partial<Row> &
    Pick<
      Row,
      | 'holderId'
      | 'fenceGeneration'
      | 'acquiredAt'
      | 'expiresAt'
      | 'authorizedWindowMs'
      | 'authorizedUntil'
    >,
): Row {
  return {
    ...inactive(partial.fenceGeneration),
    state: 'ACTIVE',
    ...partial,
  };
}

describe('PrismaMigrationGateAdapter', () => {
  let row: Row | null;
  let dbNow: Date;
  let auditRecord: ReturnType<typeof vi.fn>;
  let adapter: PrismaMigrationGateAdapter;

  const operator = { actorId: 'op-1', actorKind: 'OPERATOR' as const, correlationId: 'corr-1' };
  const job = { actorId: 'job-1', actorKind: 'SYSTEM_JOB' as const };

  beforeEach(() => {
    row = inactive(0);
    dbNow = new Date('2026-09-18T12:00:00.000Z');
    auditRecord = vi.fn(async () => undefined);
    vi.clearAllMocks();

    mockClient.$queryRaw.mockImplementation(async (arg: unknown) => {
      if (arg && typeof arg === 'object' && 'strings' in (arg as object)) {
        return [{ '?column?': 1 }];
      }
      return [{ now: dbNow }];
    });
    mockClient.connectionMigrationGateLease.findUnique.mockImplementation(async () => row);
    mockClient.connectionMigrationGateLease.updateMany.mockImplementation(
      async ({
        where,
        data,
      }: {
        where: Record<string, unknown>;
        data: Record<string, unknown>;
      }) => {
        if (!row) return { count: 0 };
        if (where.gateKey !== undefined && where.gateKey !== row.gateKey) return { count: 0 };
        if (where.purpose !== undefined && where.purpose !== row.purpose) return { count: 0 };
        if (where.fenceGeneration !== undefined && where.fenceGeneration !== row.fenceGeneration) {
          return { count: 0 };
        }
        if (where.holderId !== undefined && where.holderId !== row.holderId) return { count: 0 };

        const or = where.OR as Array<Record<string, unknown>> | undefined;
        if (or) {
          const ok = or.some((clause) => {
            if (clause.state === 'INACTIVE') return row!.state === 'INACTIVE';
            if (clause.state === 'ACTIVE') {
              const lte = (clause.expiresAt as { lte?: Date } | undefined)?.lte;
              return (
                row!.state === 'ACTIVE' &&
                row!.expiresAt !== null &&
                lte instanceof Date &&
                row!.expiresAt.getTime() <= lte.getTime()
              );
            }
            return false;
          });
          if (!ok) return { count: 0 };
        } else if (where.state !== undefined && where.state !== row.state) {
          return { count: 0 };
        }

        if (where.expiresAt && typeof where.expiresAt === 'object' && 'gt' in where.expiresAt) {
          const gt = (where.expiresAt as { gt: Date }).gt;
          if (!row.expiresAt || row.expiresAt.getTime() <= gt.getTime()) return { count: 0 };
        }
        if (
          where.authorizedUntil &&
          typeof where.authorizedUntil === 'object' &&
          'gt' in where.authorizedUntil
        ) {
          const gt = (where.authorizedUntil as { gt: Date }).gt;
          if (!row.authorizedUntil || row.authorizedUntil.getTime() <= gt.getTime())
            return { count: 0 };
        }
        const and = where.AND as Array<Record<string, unknown>> | undefined;
        if (and) {
          for (const clause of and) {
            if (clause.authorizedUntil && typeof clause.authorizedUntil === 'object') {
              const gte = (clause.authorizedUntil as { gte?: Date }).gte;
              if (gte && (!row.authorizedUntil || row.authorizedUntil.getTime() < gte.getTime())) {
                return { count: 0 };
              }
            }
          }
        }

        row = { ...row, ...(data as Partial<Row>) } as Row;
        return { count: 1 };
      },
    );

    adapter = new PrismaMigrationGateAdapter(
      mockClient as never,
      { run: async <T>(work: (tx: object) => Promise<T>) => work({}) } as never,
      { record: auditRecord } as never,
    );
  });

  it('T03/T04: acquire from INACTIVE advances fence 0→1 and audits', async () => {
    const result = await adapter.acquire({
      purpose: MIGRATION_GATE_PURPOSE_FIV_CONN_04_MIGRATION_BACKFILL,
      actor: operator,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.grant.fenceGeneration).toBe(1);
    expect(result.grant.holderId).toBe('op-1');
    expect(result.grant.authorizedWindowMs).toBe(MIGRATION_GATE_MAX_AUTHORIZED_WINDOW_MS);
    const expiresMs = Date.parse(result.grant.expiresAt) - Date.parse(result.grant.acquiredAt);
    expect(expiresMs).toBe(MIGRATION_GATE_DEFAULT_TTL_MS);
    expect(auditRecord).toHaveBeenCalledWith(
      expect.objectContaining({ outcome: 'gate_acquired' }),
      expect.anything(),
    );
    expect(row?.state).toBe('ACTIVE');
    expect(row?.fenceGeneration).toBe(1);
  });

  it('T05/S04: ACTIVE unexpired acquire returns CONTENTION without fence bump', async () => {
    const acquiredAt = dbNow;
    row = active({
      holderId: 'other',
      fenceGeneration: 3,
      acquiredAt,
      expiresAt: new Date(dbNow.getTime() + 60_000),
      authorizedWindowMs: MIGRATION_GATE_MAX_AUTHORIZED_WINDOW_MS,
      authorizedUntil: new Date(dbNow.getTime() + MIGRATION_GATE_MAX_AUTHORIZED_WINDOW_MS),
    });
    const result = await adapter.acquire({
      purpose: MIGRATION_GATE_PURPOSE_FIV_CONN_04_MIGRATION_BACKFILL,
      actor: operator,
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toBe('GATE_CONTENTION');
    expect(result.observation).toBe('CONTENTION_DENIED');
    expect(row.fenceGeneration).toBe(3);
  });

  it('T07/T08/S07: expired ACTIVE reclaim bumps fence and audits lease_expired_reclaim', async () => {
    row = active({
      holderId: 'stale',
      fenceGeneration: 2,
      acquiredAt: new Date(dbNow.getTime() - 120_000),
      expiresAt: new Date(dbNow.getTime() - 1_000),
      authorizedWindowMs: MIGRATION_GATE_MAX_AUTHORIZED_WINDOW_MS,
      authorizedUntil: new Date(dbNow.getTime() + MIGRATION_GATE_MAX_AUTHORIZED_WINDOW_MS),
    });
    const result = await adapter.acquire({
      purpose: MIGRATION_GATE_PURPOSE_FIV_CONN_04_MIGRATION_BACKFILL,
      actor: job,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.grant.fenceGeneration).toBe(3);
    expect(result.grant.holderId).toBe('job-1');
    expect(auditRecord).toHaveBeenCalledWith(
      expect.objectContaining({ outcome: 'lease_expired_reclaim' }),
      expect.anything(),
    );
  });

  it('T12/S16/S17: reject wrong purpose and unauthorized actor', async () => {
    const badPurpose = await adapter.acquire({
      purpose: 'OTHER' as never,
      actor: operator,
    });
    expect(badPurpose.ok).toBe(false);
    if (!badPurpose.ok) expect(badPurpose.reason).toBe('GATE_PURPOSE_MISMATCH');

    const badActor = await adapter.acquire({
      purpose: MIGRATION_GATE_PURPOSE_FIV_CONN_04_MIGRATION_BACKFILL,
      actor: { actorId: '', actorKind: 'OPERATOR' },
    });
    expect(badActor.ok).toBe(false);
    if (!badActor.ok) expect(badActor.reason).toBe('GATE_UNAUTHORIZED');
  });

  it('T12: requestedTtlMs above 4h rejected by acquire input contract', async () => {
    const result = await adapter.acquire({
      purpose: MIGRATION_GATE_PURPOSE_FIV_CONN_04_MIGRATION_BACKFILL,
      actor: operator,
      requestedTtlMs: MIGRATION_GATE_MAX_AUTHORIZED_WINDOW_MS + 1,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('GATE_MAX_WINDOW_EXCEEDED');
  });

  it('T09/S02/S15: stale release with old fence fails and does not clear newer lease', async () => {
    const acquiredAt = dbNow;
    row = active({
      holderId: 'new-owner',
      fenceGeneration: 5,
      acquiredAt,
      expiresAt: new Date(dbNow.getTime() + 60_000),
      authorizedWindowMs: MIGRATION_GATE_MAX_AUTHORIZED_WINDOW_MS,
      authorizedUntil: new Date(dbNow.getTime() + MIGRATION_GATE_MAX_AUTHORIZED_WINDOW_MS),
    });
    const staleGrant: MigrationGateGrant = {
      gateKey: MIGRATION_GATE_KEY_FIV_CONN_04,
      purpose: MIGRATION_GATE_PURPOSE_FIV_CONN_04_MIGRATION_BACKFILL,
      holderId: 'old-owner',
      fenceGeneration: 4,
      acquiredAt: acquiredAt.toISOString(),
      expiresAt: new Date(dbNow.getTime() + 60_000).toISOString(),
      authorizedWindowMs: MIGRATION_GATE_MAX_AUTHORIZED_WINDOW_MS,
    };
    const result = await adapter.release({ grant: staleGrant, actor: operator });
    expect(result.ok).toBe(false);
    expect(row.state).toBe('ACTIVE');
    expect(row.holderId).toBe('new-owner');
    expect(row.fenceGeneration).toBe(5);
  });

  it('T10/S01: stale heartbeat with old fence fails', async () => {
    const acquiredAt = dbNow;
    row = active({
      holderId: 'new-owner',
      fenceGeneration: 5,
      acquiredAt,
      expiresAt: new Date(dbNow.getTime() + 60_000),
      authorizedWindowMs: MIGRATION_GATE_MAX_AUTHORIZED_WINDOW_MS,
      authorizedUntil: new Date(dbNow.getTime() + MIGRATION_GATE_MAX_AUTHORIZED_WINDOW_MS),
    });
    const staleGrant: MigrationGateGrant = {
      gateKey: MIGRATION_GATE_KEY_FIV_CONN_04,
      purpose: MIGRATION_GATE_PURPOSE_FIV_CONN_04_MIGRATION_BACKFILL,
      holderId: 'old-owner',
      fenceGeneration: 4,
      acquiredAt: acquiredAt.toISOString(),
      expiresAt: new Date(dbNow.getTime() + 30_000).toISOString(),
      authorizedWindowMs: MIGRATION_GATE_MAX_AUTHORIZED_WINDOW_MS,
    };
    const result = await adapter.heartbeat({
      grant: staleGrant,
      actor: operator,
      proposedExpiresAt: new Date(dbNow.getTime() + 90_000).toISOString(),
    });
    expect(result.ok).toBe(false);
    expect(row.fenceGeneration).toBe(5);
  });

  it('T11/ST-B22: heartbeat cannot extend past authorizedUntil', async () => {
    const acquiredAt = dbNow;
    const authorizedUntil = new Date(acquiredAt.getTime() + 60_000);
    row = active({
      holderId: 'op-1',
      fenceGeneration: 1,
      acquiredAt,
      expiresAt: new Date(dbNow.getTime() + 30_000),
      authorizedWindowMs: 60_000,
      authorizedUntil,
    });
    const grant: MigrationGateGrant = {
      gateKey: MIGRATION_GATE_KEY_FIV_CONN_04,
      purpose: MIGRATION_GATE_PURPOSE_FIV_CONN_04_MIGRATION_BACKFILL,
      holderId: 'op-1',
      fenceGeneration: 1,
      acquiredAt: acquiredAt.toISOString(),
      expiresAt: new Date(dbNow.getTime() + 30_000).toISOString(),
      authorizedWindowMs: 60_000,
    };
    const over = await adapter.heartbeat({
      grant,
      actor: operator,
      proposedExpiresAt: new Date(authorizedUntil.getTime() + 1).toISOString(),
    });
    expect(over.ok).toBe(false);
    if (!over.ok) expect(over.reason).toBe('GATE_MAX_WINDOW_EXCEEDED');
  });

  it('T06/S06: heartbeat at/after expiry fails (no resurrection)', async () => {
    const acquiredAt = new Date(dbNow.getTime() - 120_000);
    row = active({
      holderId: 'op-1',
      fenceGeneration: 1,
      acquiredAt,
      expiresAt: new Date(dbNow.getTime() - 1),
      authorizedWindowMs: MIGRATION_GATE_MAX_AUTHORIZED_WINDOW_MS,
      authorizedUntil: new Date(acquiredAt.getTime() + MIGRATION_GATE_MAX_AUTHORIZED_WINDOW_MS),
    });
    const grant: MigrationGateGrant = {
      gateKey: MIGRATION_GATE_KEY_FIV_CONN_04,
      purpose: MIGRATION_GATE_PURPOSE_FIV_CONN_04_MIGRATION_BACKFILL,
      holderId: 'op-1',
      fenceGeneration: 1,
      acquiredAt: acquiredAt.toISOString(),
      expiresAt: new Date(dbNow.getTime() - 1).toISOString(),
      authorizedWindowMs: MIGRATION_GATE_MAX_AUTHORIZED_WINDOW_MS,
    };
    const result = await adapter.heartbeat({
      grant,
      actor: operator,
      proposedExpiresAt: new Date(dbNow.getTime() + 60_000).toISOString(),
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('GATE_EXPIRED');
  });

  it('release success clears ACTIVE without fence bump', async () => {
    const acquiredAt = dbNow;
    row = active({
      holderId: 'op-1',
      fenceGeneration: 2,
      acquiredAt,
      expiresAt: new Date(dbNow.getTime() + 60_000),
      authorizedWindowMs: MIGRATION_GATE_MAX_AUTHORIZED_WINDOW_MS,
      authorizedUntil: new Date(dbNow.getTime() + MIGRATION_GATE_MAX_AUTHORIZED_WINDOW_MS),
    });
    const grant: MigrationGateGrant = {
      gateKey: MIGRATION_GATE_KEY_FIV_CONN_04,
      purpose: MIGRATION_GATE_PURPOSE_FIV_CONN_04_MIGRATION_BACKFILL,
      holderId: 'op-1',
      fenceGeneration: 2,
      acquiredAt: acquiredAt.toISOString(),
      expiresAt: new Date(dbNow.getTime() + 60_000).toISOString(),
      authorizedWindowMs: MIGRATION_GATE_MAX_AUTHORIZED_WINDOW_MS,
    };
    const result = await adapter.release({ grant, actor: operator });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.observation).toBe('INACTIVE');
    expect(row.state).toBe('INACTIVE');
    expect(row.fenceGeneration).toBe(2);
    expect(row.holderId).toBeNull();
  });

  it('ST-B21/S18: operator reclaim requires OPERATOR actorKind', async () => {
    row = active({
      holderId: 'job-1',
      fenceGeneration: 1,
      acquiredAt: dbNow,
      expiresAt: new Date(dbNow.getTime() + 60_000),
      authorizedWindowMs: MIGRATION_GATE_MAX_AUTHORIZED_WINDOW_MS,
      authorizedUntil: new Date(dbNow.getTime() + MIGRATION_GATE_MAX_AUTHORIZED_WINDOW_MS),
    });
    const denied = await adapter.reclaimAsOperator({ actor: job });
    expect(denied.ok).toBe(false);
    if (!denied.ok) expect(denied.reason).toBe('GATE_UNAUTHORIZED');

    const ok = await adapter.reclaimAsOperator({ actor: operator });
    expect(ok.ok).toBe(true);
    if (ok.ok) {
      expect(ok.grant.fenceGeneration).toBe(2);
      expect(ok.grant.holderId).toBe('op-1');
    }
    expect(auditRecord).toHaveBeenCalledWith(
      expect.objectContaining({ outcome: 'gate_stale_reclaim' }),
      expect.anything(),
    );
  });

  it('T16/S08: missing row observe/validate → UNKNOWN', async () => {
    row = null;
    const obs = await adapter.observe();
    expect(obs.ok).toBe(false);
    if (!obs.ok) {
      expect(obs.observation).toBe('UNKNOWN');
      expect(obs.reason).toBe('GATE_UNKNOWN');
    }
    const grant: MigrationGateGrant = {
      gateKey: MIGRATION_GATE_KEY_FIV_CONN_04,
      purpose: MIGRATION_GATE_PURPOSE_FIV_CONN_04_MIGRATION_BACKFILL,
      holderId: 'op-1',
      fenceGeneration: 1,
      acquiredAt: dbNow.toISOString(),
      expiresAt: new Date(dbNow.getTime() + 60_000).toISOString(),
      authorizedWindowMs: MIGRATION_GATE_MAX_AUTHORIZED_WINDOW_MS,
    };
    const val = await adapter.validate(grant);
    expect(val.ok).toBe(false);
    if (!val.ok) expect(val.observation).toBe('UNKNOWN');
  });

  it('T13/ST-B23/S03: assertDurableAuthorityCas requires current fence+ACTIVE+not expired', async () => {
    const acquiredAt = dbNow;
    row = active({
      holderId: 'op-1',
      fenceGeneration: 7,
      acquiredAt,
      expiresAt: new Date(dbNow.getTime() + 60_000),
      authorizedWindowMs: MIGRATION_GATE_MAX_AUTHORIZED_WINDOW_MS,
      authorizedUntil: new Date(dbNow.getTime() + MIGRATION_GATE_MAX_AUTHORIZED_WINDOW_MS),
    });
    const good: MigrationGateGrant = {
      gateKey: MIGRATION_GATE_KEY_FIV_CONN_04,
      purpose: MIGRATION_GATE_PURPOSE_FIV_CONN_04_MIGRATION_BACKFILL,
      holderId: 'op-1',
      fenceGeneration: 7,
      acquiredAt: acquiredAt.toISOString(),
      expiresAt: new Date(dbNow.getTime() + 60_000).toISOString(),
      authorizedWindowMs: MIGRATION_GATE_MAX_AUTHORIZED_WINDOW_MS,
    };
    await expect(adapter.assertDurableAuthorityCas({} as never, good)).resolves.toBe(true);

    const stale = { ...good, fenceGeneration: 6 };
    await expect(adapter.assertDurableAuthorityCas({} as never, stale)).resolves.toBe(false);
  });

  it('T15/S09: DB failure during acquire maps to UNKNOWN', async () => {
    mockClient.$queryRaw.mockRejectedValueOnce(new Error('db down'));
    const result = await adapter.acquire({
      purpose: MIGRATION_GATE_PURPOSE_FIV_CONN_04_MIGRATION_BACKFILL,
      actor: operator,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe('GATE_UNKNOWN');
      expect(result.observation).toBe('UNKNOWN');
    }
  });

  it('T17/ST-B26: audit payloads use fenceGeneration never fencingToken', async () => {
    await adapter.acquire({
      purpose: MIGRATION_GATE_PURPOSE_FIV_CONN_04_MIGRATION_BACKFILL,
      actor: operator,
    });
    const payload = auditRecord.mock.calls[0]?.[0]?.payload as Record<string, unknown>;
    expect(payload).toBeDefined();
    expect(payload.fenceGeneration).toBe(1);
    expect(Object.keys(payload).some((k) => /fencingToken/i.test(k))).toBe(false);
  });

  it('S19: adapter does not expose generic freeze / EmergencyManager APIs', () => {
    const keys = Object.getOwnPropertyNames(Object.getPrototypeOf(adapter));
    expect(keys).not.toContain('freezeAll');
    expect(keys).not.toContain('emergencyLock');
  });
});
