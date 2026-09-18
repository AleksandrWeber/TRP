/**
 * FIV-CONN-04-B-06 / crash-ttl — RACE-07 / RACE-08 + AC-B07 behavioral (IPR-B06-03).
 * Sequential dual logical clients; mocked dbNow only (no sleep / no process kill).
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

function installCasMocks(
  getRow: () => Row | null,
  setRow: (r: Row | null) => void,
  getNow: () => Date,
) {
  mockClient.$queryRaw.mockImplementation(async (arg: unknown) => {
    if (arg && typeof arg === 'object' && 'strings' in (arg as object)) {
      return [{ '?column?': 1 }];
    }
    return [{ now: getNow() }];
  });
  mockClient.connectionMigrationGateLease.findUnique.mockImplementation(async () => getRow());
  mockClient.connectionMigrationGateLease.updateMany.mockImplementation(
    async ({ where, data }: { where: Record<string, unknown>; data: Record<string, unknown> }) => {
      const row = getRow();
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
          if (clause.state === 'INACTIVE') return row.state === 'INACTIVE';
          if (clause.state === 'ACTIVE') {
            const lte = (clause.expiresAt as { lte?: Date } | undefined)?.lte;
            return (
              row.state === 'ACTIVE' &&
              row.expiresAt !== null &&
              lte instanceof Date &&
              row.expiresAt.getTime() <= lte.getTime()
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

      setRow({ ...row, ...(data as Partial<Row>) } as Row);
      return { count: 1 };
    },
  );
}

describe('FIV-CONN-04-B-06 crash / TTL (RACE-07 / RACE-08)', () => {
  let row: Row | null;
  let dbNow: Date;
  let adapterA: PrismaMigrationGateAdapter;
  let adapterB: PrismaMigrationGateAdapter;

  const actorA = { actorId: 'crash-a', actorKind: 'SYSTEM_JOB' as const };
  const actorB = { actorId: 'crash-b', actorKind: 'SYSTEM_JOB' as const };

  beforeEach(() => {
    row = inactive(0);
    dbNow = new Date('2026-09-18T12:00:00.000Z');
    vi.clearAllMocks();
    installCasMocks(
      () => row,
      (r) => {
        row = r;
      },
      () => dbNow,
    );
    const audit = { record: vi.fn(async () => undefined) };
    const tx = { run: async <T>(work: (t: object) => Promise<T>) => work({}) };
    adapterA = new PrismaMigrationGateAdapter(mockClient as never, tx as never, audit as never);
    adapterB = new PrismaMigrationGateAdapter(mockClient as never, tx as never, audit as never);
  });

  it('RACE-08 / AC-B07-B / N1: discard in-memory grant; shared SoT remains authoritative', async () => {
    const acquired = await adapterA.acquire({
      purpose: MIGRATION_GATE_PURPOSE_FIV_CONN_04_MIGRATION_BACKFILL,
      actor: actorA,
    });
    expect(acquired.ok).toBe(true);
    if (!acquired.ok) return;

    // Simulate process crash: discard local grant reference (no production memory-gate API).
    let localGrant: typeof acquired.grant | undefined = acquired.grant;
    localGrant = undefined;
    void localGrant;

    const obsB = await adapterB.observe();
    expect(obsB.ok).toBe(true);
    if (!obsB.ok) return;
    expect(obsB.observation).toBe('ACTIVE');
    expect(obsB.grant?.holderId).toBe('crash-a');
    expect(row?.state).toBe('ACTIVE');
    expect(row?.holderId).toBe('crash-a');
  });

  it('RACE-07 / B06-AC04: TTL expiry reclaim bumps fence; stale grant cannot continue', async () => {
    const first = await adapterA.acquire({
      purpose: MIGRATION_GATE_PURPOSE_FIV_CONN_04_MIGRATION_BACKFILL,
      actor: actorA,
    });
    expect(first.ok).toBe(true);
    if (!first.ok) return;
    const staleGrant = first.grant;
    const priorFence = staleGrant.fenceGeneration;

    // Deterministic time advance (no sleep).
    dbNow = new Date(dbNow.getTime() + MIGRATION_GATE_DEFAULT_TTL_MS + 120_000);
    if (row) {
      row = {
        ...row,
        expiresAt: new Date(dbNow.getTime() - 1_000),
        authorizedUntil: new Date(dbNow.getTime() + MIGRATION_GATE_MAX_AUTHORIZED_WINDOW_MS),
      };
    }

    const reclaim = await adapterB.acquire({
      purpose: MIGRATION_GATE_PURPOSE_FIV_CONN_04_MIGRATION_BACKFILL,
      actor: actorB,
    });
    expect(reclaim.ok).toBe(true);
    if (!reclaim.ok) return;
    expect(reclaim.grant.fenceGeneration).toBe(priorFence + 1);
    expect(row?.holderId).toBe('crash-b');
    expect(row?.fenceGeneration).toBe(priorFence + 1);

    const staleRelease = await adapterA.release({ grant: staleGrant, actor: actorA });
    expect(staleRelease.ok).toBe(false);
    const staleHb = await adapterA.heartbeat({
      grant: staleGrant,
      actor: actorA,
      proposedExpiresAt: new Date(dbNow.getTime() + 30_000).toISOString(),
    });
    expect(staleHb.ok).toBe(false);
    expect(row?.holderId).toBe('crash-b');
  });

  it('AC-B07-A structural: adapter has no durable instance-local lease authority fields', () => {
    const ownKeys = Object.keys(adapterA as object);
    for (const forbidden of [
      'fenceGeneration',
      'holderId',
      'state',
      'leaseState',
      'expiresAt',
      'acquiredAt',
      'grant',
    ]) {
      expect(ownKeys).not.toContain(forbidden);
      expect(adapterA).not.toHaveProperty(forbidden);
    }
  });
});
