/**
 * FIV-CONN-04-B-06 / concurrency — sequential dual logical clients (C-B06-01).
 *
 * RACE-05 / RACE-06 (SoT) / RACE-10 (adapter) / AC-B20 case 1 (wrong-fence release).
 * IPR-B06-01: CAS-fidelity mocks. NOT live multi-process (C-B06-02 residual OPEN).
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

/** IPR-B06-01 — B-02-class CAS predicates; no unconditional overwrite. */
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
      if (
        where.authorizedUntil &&
        typeof where.authorizedUntil === 'object' &&
        'gt' in where.authorizedUntil
      ) {
        const gt = (where.authorizedUntil as { gt: Date }).gt;
        if (!row.authorizedUntil || row.authorizedUntil.getTime() <= gt.getTime())
          return { count: 0 };
      }

      setRow({ ...row, ...(data as Partial<Row>) } as Row);
      return { count: 1 };
    },
  );
}

describe('FIV-CONN-04-B-06 concurrency (sequential dual logical clients)', () => {
  let row: Row | null;
  let dbNow: Date;
  let adapterA: PrismaMigrationGateAdapter;
  let adapterB: PrismaMigrationGateAdapter;

  const actorA = { actorId: 'client-a', actorKind: 'SYSTEM_JOB' as const };
  const actorB = { actorId: 'client-b', actorKind: 'SYSTEM_JOB' as const };

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
    // Dual logical clients share the SAME mockClient / mutable lease row (SoT).
    adapterA = new PrismaMigrationGateAdapter(mockClient as never, tx as never, audit as never);
    adapterB = new PrismaMigrationGateAdapter(mockClient as never, tx as never, audit as never);
  });

  it('RACE-05 / N2 / B06-AC07: second acquire denied; fence unchanged; A remains authoritative', async () => {
    const first = await adapterA.acquire({
      purpose: MIGRATION_GATE_PURPOSE_FIV_CONN_04_MIGRATION_BACKFILL,
      actor: actorA,
    });
    expect(first.ok).toBe(true);
    if (!first.ok) return;
    const fenceAfterA = first.grant.fenceGeneration;
    expect(row?.holderId).toBe('client-a');
    expect(row?.fenceGeneration).toBe(fenceAfterA);

    const second = await adapterB.acquire({
      purpose: MIGRATION_GATE_PURPOSE_FIV_CONN_04_MIGRATION_BACKFILL,
      actor: actorB,
    });
    expect(second.ok).toBe(false);
    if (!second.ok) {
      expect(second.reason).toBe('GATE_CONTENTION');
      expect(second.observation).toBe('CONTENTION_DENIED');
    }
    expect(row?.holderId).toBe('client-a');
    expect(row?.fenceGeneration).toBe(fenceAfterA);
    expect(row?.state).toBe('ACTIVE');
  });

  it('RACE-06 / B06-AC01: both logical clients observe the same shared lease row', async () => {
    const acquired = await adapterA.acquire({
      purpose: MIGRATION_GATE_PURPOSE_FIV_CONN_04_MIGRATION_BACKFILL,
      actor: actorA,
    });
    expect(acquired.ok).toBe(true);
    if (!acquired.ok) return;

    const obsA = await adapterA.observe();
    const obsB = await adapterB.observe();
    expect(obsA.ok).toBe(true);
    expect(obsB.ok).toBe(true);
    if (!obsA.ok || !obsB.ok) return;
    expect(obsA.observation).toBe('ACTIVE');
    expect(obsB.observation).toBe('ACTIVE');
    expect(obsA.grant?.holderId).toBe(acquired.grant.holderId);
    expect(obsB.grant?.holderId).toBe(acquired.grant.holderId);
    expect(obsA.grant?.fenceGeneration).toBe(acquired.grant.fenceGeneration);
    expect(obsB.grant?.fenceGeneration).toBe(acquired.grant.fenceGeneration);
  });

  it('AC-B20 CASE 1 / N5: wrong-fence release is rejected', async () => {
    const acquired = await adapterA.acquire({
      purpose: MIGRATION_GATE_PURPOSE_FIV_CONN_04_MIGRATION_BACKFILL,
      actor: actorA,
    });
    expect(acquired.ok).toBe(true);
    if (!acquired.ok) return;

    const wrongFence: MigrationGateGrant = {
      ...acquired.grant,
      fenceGeneration: acquired.grant.fenceGeneration - 1,
    };
    const release = await adapterB.release({ grant: wrongFence, actor: actorA });
    expect(release.ok).toBe(false);
    expect(row?.state).toBe('ACTIVE');
    expect(row?.holderId).toBe('client-a');
    expect(row?.fenceGeneration).toBe(acquired.grant.fenceGeneration);
  });

  it('RACE-10 / N8: after reclaim, cached grant cannot release or heartbeat', async () => {
    const first = await adapterA.acquire({
      purpose: MIGRATION_GATE_PURPOSE_FIV_CONN_04_MIGRATION_BACKFILL,
      actor: actorA,
    });
    expect(first.ok).toBe(true);
    if (!first.ok) return;
    const staleGrant = first.grant;

    // Expire + reclaim via B (B-02 TTL reclaim seam on acquire).
    dbNow = new Date(dbNow.getTime() + MIGRATION_GATE_DEFAULT_TTL_MS + 60_000);
    // Keep authorizedUntil in the future so expiry reclaim path applies.
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
    expect(reclaim.grant.fenceGeneration).toBeGreaterThan(staleGrant.fenceGeneration);
    expect(row?.holderId).toBe('client-b');

    const staleRelease = await adapterA.release({ grant: staleGrant, actor: actorA });
    expect(staleRelease.ok).toBe(false);
    const staleHb = await adapterA.heartbeat({
      grant: staleGrant,
      actor: actorA,
      proposedExpiresAt: new Date(dbNow.getTime() + 30_000).toISOString(),
    });
    expect(staleHb.ok).toBe(false);
    expect(row?.holderId).toBe('client-b');
  });
});
