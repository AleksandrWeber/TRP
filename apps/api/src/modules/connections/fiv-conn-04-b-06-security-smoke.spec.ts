/**
 * FIV-CONN-04-B-06 / security-smoke — RACE-06 deny from shared SoT (IPR-B06-02),
 * N9, walls. OD-B-06 / D-B03 residuals untouched. Sequential dual clients only.
 */

import { ConflictException } from '@nestjs/common';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
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
  GATE_DENY_PUBLIC_MESSAGE,
  assertDenySetAllowed,
} from './connection-migration-gate-enforcement';
import {
  MIGRATION_GATE_KEY_FIV_CONN_04,
  MIGRATION_GATE_PURPOSE_FIV_CONN_04_MIGRATION_BACKFILL,
} from './migration-gate';
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

      setRow({ ...row, ...(data as Partial<Row>) } as Row);
      return { count: 1 };
    },
  );
}

describe('FIV-CONN-04-B-06 security smoke', () => {
  let row: Row | null;
  let dbNow: Date;
  let adapterA: PrismaMigrationGateAdapter;
  let adapterB: PrismaMigrationGateAdapter;
  let dSpy: ReturnType<typeof vi.fn>;

  const actorA = { actorId: 'smoke-a', actorKind: 'OPERATOR' as const };

  beforeEach(() => {
    row = inactive(0);
    dbNow = new Date('2026-09-18T12:00:00.000Z');
    dSpy = vi.fn();
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

  it('RACE-06 / N9 / IPR-B06-02: deny-set follows adapter.observe() of shared SoT (not hardcoded ACTIVE)', async () => {
    const acquired = await adapterA.acquire({
      purpose: MIGRATION_GATE_PURPOSE_FIV_CONN_04_MIGRATION_BACKFILL,
      actor: actorA,
    });
    expect(acquired.ok).toBe(true);

    // Causal chain: shared row → adapterB.observe() → deny (IPR-B06-02).
    const gateFromSharedSoT = {
      observe: async () => adapterB.observe(),
    };

    await expect(
      assertDenySetAllowed({
        migrationGate: gateFromSharedSoT as never,
        audit: {
          record: async () => undefined,
        } as never,
        method: 'storeCredentials',
        workspaceId: 'ws-b06',
        actorUserId: 'user-b06',
        connectionId: 'conn-b06',
      }),
    ).rejects.toBeInstanceOf(ConflictException);

    const obs = await adapterB.observe();
    expect(obs.ok).toBe(true);
    if (obs.ok) expect(obs.observation).toBe('ACTIVE');
    expect(row?.state).toBe('ACTIVE');
    expect(GATE_DENY_PUBLIC_MESSAGE.length).toBeGreaterThan(0);
    expect(dSpy).not.toHaveBeenCalled();
  });

  it('N9: while shared SoT ACTIVE, privileged D path is not entered from deny observer', async () => {
    await adapterA.acquire({
      purpose: MIGRATION_GATE_PURPOSE_FIV_CONN_04_MIGRATION_BACKFILL,
      actor: actorA,
    });
    const gateFromSharedSoT = { observe: async () => adapterB.observe() };
    try {
      await assertDenySetAllowed({
        migrationGate: gateFromSharedSoT as never,
        audit: { record: async () => undefined } as never,
        method: 'replaceCredentials',
        workspaceId: 'ws-2',
        actorUserId: 'u-2',
        connectionId: 'c-2',
      });
      dSpy();
    } catch {
      // expected deny
    }
    expect(dSpy).not.toHaveBeenCalled();
  });

  it('walls: B-06 does not introduce Vault/env UPDATE/public migration HTTP/second SoT', () => {
    const b06Specs = [
      'fiv-conn-04-b-06-concurrency.spec.ts',
      'fiv-conn-04-b-06-crash-ttl.spec.ts',
      'fiv-conn-04-b-06-boundary-concurrency.spec.ts',
      'fiv-conn-04-b-06-security-smoke.spec.ts',
    ];
    for (const file of b06Specs) {
      const src = readFileSync(join(__dirname, file), 'utf8');
      expect(src).not.toMatch(/from\s+['"][^'"]*testcontainers[^'"]*['"]/i);
      expect(src).not.toMatch(/require\(\s*['"][^'"]*testcontainers/i);
      expect(src).not.toMatch(/from\s+['"][^'"]*secret-vault[^'"]*['"]/i);
      expect(src).not.toMatch(/from\s+['"][^'"]*live-venue[^'"]*['"]/i);
      expect(src).not.toMatch(/\ballowRealVenueIo\s*=/);
    }

    const boundarySrc = readFileSync(
      join(__dirname, 'conn04-migration-boundary.service.ts'),
      'utf8',
    );
    expect(boundarySrc).not.toMatch(/@Controller|@Post\(/);
    expect(boundarySrc).not.toMatch(/connectionRecord\.(update|create)/);
    expect(boundarySrc).not.toMatch(/SecretVaultService/);
    expect(boundarySrc).not.toMatch(/allowRealVenueIo|ExecutionAdapterPort/);
  });

  it('B06-AC10: residuals / OD-B-06 not silently closed or redesigned by B-06', () => {
    for (const file of [
      'fiv-conn-04-b-06-concurrency.spec.ts',
      'fiv-conn-04-b-06-crash-ttl.spec.ts',
      'fiv-conn-04-b-06-boundary-concurrency.spec.ts',
      'fiv-conn-04-b-06-security-smoke.spec.ts',
    ]) {
      const src = readFileSync(join(__dirname, file), 'utf8');
      expect(src).not.toMatch(/from\s+['"][^'"]*security-audit-classification[^'"]*['"]/);
      expect(src).not.toMatch(/MIGRATION_GATE_AUDIT_OUTCOMES\s*=/);
      expect(src).not.toMatch(/\bcloseResidualDB03\b|\bremediateDB03\b/);
    }
  });
});
