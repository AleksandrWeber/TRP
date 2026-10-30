/**
 * FIV-CONN-04-D / P-D-02 + Stage 3 — Conn04SystemJobMigrationEntry + Nest export isolation.
 */

import { MODULE_METADATA } from '@nestjs/common/constants';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockLeaseClient = {
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
  prismaClientForTransaction: () => mockLeaseClient,
}));

import { PrismaTransactionService } from '../../storage/prisma/prisma-transaction.service';
import { Conn04MigrationBoundaryService } from './conn04-migration-boundary.service';
import { ConnectionMigrationGateAudit } from './connection-migration-gate-audit';
import { ConnectionsModule } from './connections.module';
import { FivConn04APreflightService } from './fiv-conn-04-a-preflight.service';
import { FivConn04DEnvironmentBackfillWrite } from './fiv-conn-04-d-environment-backfill-write';
import {
  FIV_CONN_04_D_SYSTEM_JOB_ACTOR_ID,
  buildFivConn04DSystemJobActor,
} from './fiv-conn-04-d-system-job-identity';
import { Conn04SystemJobMigrationEntry } from './fiv-conn-04-d-system-job-migration-entry';
import {
  MIGRATION_GATE_AUDIT_EVENT_TYPE,
  MIGRATION_GATE_KEY_FIV_CONN_04,
  MIGRATION_GATE_PURPOSE_FIV_CONN_04_MIGRATION_BACKFILL,
  type MigrationGateGrant,
} from './migration-gate';
import { MIGRATION_GATE_DURABLE_AUTHORITY } from './migration-gate-durable-authority.port';
import { MIGRATION_GATE_PORT } from './migration-gate.port';
import { PrismaMigrationGateAdapter } from './prisma-migration-gate.adapter';

const ACQUIRED = '2026-10-30T10:00:00.000Z';
const EXPIRES = '2026-10-30T10:15:00.000Z';

function grant(overrides: Partial<MigrationGateGrant> = {}): MigrationGateGrant {
  return Object.freeze({
    gateKey: MIGRATION_GATE_KEY_FIV_CONN_04,
    purpose: MIGRATION_GATE_PURPOSE_FIV_CONN_04_MIGRATION_BACKFILL,
    holderId: FIV_CONN_04_D_SYSTEM_JOB_ACTOR_ID,
    fenceGeneration: 1,
    acquiredAt: ACQUIRED,
    expiresAt: EXPIRES,
    authorizedWindowMs: 4 * 60 * 60 * 1000,
    ...overrides,
  });
}

function moduleExports(): unknown[] {
  const raw = Reflect.getMetadata(MODULE_METADATA.EXPORTS, ConnectionsModule) as unknown;
  return Array.isArray(raw) ? raw : [];
}

function moduleProviders(): unknown[] {
  const raw = Reflect.getMetadata(MODULE_METADATA.PROVIDERS, ConnectionsModule) as unknown;
  return Array.isArray(raw) ? raw : [];
}

describe('Conn04SystemJobMigrationEntry (P-D-02 Option A + Stage 3)', () => {
  let boundary: {
    start: ReturnType<typeof vi.fn>;
    resume: ReturnType<typeof vi.fn>;
    heartbeat: ReturnType<typeof vi.fn>;
    release: ReturnType<typeof vi.fn>;
  };
  let writeUnit: { assertWriteAuthorityInTransaction: ReturnType<typeof vi.fn> };
  let transactions: { run: ReturnType<typeof vi.fn> };
  let entry: Conn04SystemJobMigrationEntry;

  beforeEach(() => {
    boundary = {
      start: vi.fn(),
      resume: vi.fn(),
      heartbeat: vi.fn(),
      release: vi.fn(),
    };
    writeUnit = {
      assertWriteAuthorityInTransaction: vi.fn(),
    };
    transactions = {
      run: vi.fn(async (work: (tx: object) => Promise<unknown>) => work({ marker: 'entry-txn' })),
    };
    entry = new Conn04SystemJobMigrationEntry(
      boundary as unknown as Conn04MigrationBoundaryService,
      writeUnit as unknown as FivConn04DEnvironmentBackfillWrite,
      transactions as unknown as PrismaTransactionService,
    );
  });

  it('constructs identity internally and passes canonical actor to B-04 start', async () => {
    const g = grant();
    boundary.start.mockResolvedValue({ ok: true, grant: g });
    const result = await entry.start({ correlationId: 'pd02-corr' });
    expect(result).toEqual({ ok: true, grant: g });
    expect(boundary.start).toHaveBeenCalledTimes(1);
    expect(boundary.start).toHaveBeenCalledWith({
      actor: {
        actorId: FIV_CONN_04_D_SYSTEM_JOB_ACTOR_ID,
        actorKind: 'SYSTEM_JOB',
        correlationId: 'pd02-corr',
      },
      correlationId: 'pd02-corr',
    });
  });

  it('start / resume / heartbeat / release preserve canonical actor attribution', async () => {
    const g = grant();
    const next = grant({ expiresAt: '2026-10-30T10:20:00.000Z' });
    boundary.start.mockResolvedValue({ ok: true, grant: g });
    boundary.resume.mockResolvedValue({ ok: true, grant: g, observation: 'ACTIVE' });
    boundary.heartbeat.mockResolvedValue({ ok: true, grant: next });
    boundary.release.mockResolvedValue({ ok: true, observation: 'INACTIVE' });

    await entry.start();
    await entry.resume({ grant: g });
    await entry.heartbeat({ grant: g, proposedExpiresAt: next.expiresAt });
    await entry.release({ grant: g });

    const expectedActor = buildFivConn04DSystemJobActor();
    expect(boundary.start.mock.calls[0]?.[0].actor).toEqual(expectedActor);
    expect(boundary.resume.mock.calls[0]?.[0].actor).toEqual(expectedActor);
    expect(boundary.heartbeat.mock.calls[0]?.[0].actor).toEqual(expectedActor);
    expect(boundary.release.mock.calls[0]?.[0].actor).toEqual(expectedActor);
  });

  it('propagates lease contention from B-04 without inventing success', async () => {
    boundary.start.mockResolvedValue({
      ok: false,
      reason: 'GATE_CONTENTION',
      observation: 'CONTENTION_DENIED',
    });
    const result = await entry.start();
    expect(result).toEqual({
      ok: false,
      reason: 'GATE_CONTENTION',
      observation: 'CONTENTION_DENIED',
    });
  });

  it('method signatures reject caller-supplied actor fields (compile-time surface + runtime ignore)', async () => {
    const src = readFileSync(
      join(__dirname, 'fiv-conn-04-d-system-job-migration-entry.ts'),
      'utf8',
    );
    expect(src).not.toMatch(/async start\(input:[^)]*actor:/);
    expect(src).not.toMatch(/actorId\s*:/);
    expect(src).not.toMatch(/actorKind\s*:/);
    expect(src).not.toMatch(/import\s+.*PrivilegedActorContext/);
    expect(src).not.toMatch(/runAs|run-as/i);

    boundary.start.mockResolvedValue({ ok: true, grant: grant() });
    // Even if a caller smuggles unexpected props, Entry must not forward them as actor.
    await entry.start({ correlationId: 'x', actorId: 'spoof', actorKind: 'OPERATOR' } as never);
    const passed = boundary.start.mock.calls[0]?.[0];
    expect(passed.actor.actorId).toBe(FIV_CONN_04_D_SYSTEM_JOB_ACTOR_ID);
    expect(passed.actor.actorKind).toBe('SYSTEM_JOB');
    expect(passed.actorId).toBeUndefined();
  });

  it('source walls: no HTTP controller, cron, env UPDATE, Prisma lease writes, job identity', () => {
    const src = readFileSync(
      join(__dirname, 'fiv-conn-04-d-system-job-migration-entry.ts'),
      'utf8',
    );
    expect(src).not.toMatch(/@Controller|@Post\(|@Patch\(|@Put\(|@Get\(/);
    expect(src).not.toMatch(/Cron|Scheduler|@Interval/);
    expect(src).not.toMatch(/connectionRecord\.(update|create)/i);
    expect(src).not.toMatch(/environment\s*:/);
    expect(src).not.toMatch(/connectionMigrationGateLease/);
    expect(src).not.toMatch(/process\.env/);
    expect(src).not.toMatch(/SecretVault|TradingRuntime|ExecutionAdapter/);
    expect(src).not.toMatch(/runEnvironmentBackfill/);

    const controllerSrc = readFileSync(join(__dirname, 'connections.controller.ts'), 'utf8');
    expect(controllerSrc).not.toMatch(/Conn04SystemJobMigrationEntry/);
    expect(controllerSrc).not.toMatch(/fiv-conn-04-d-system-job/);
    expect(controllerSrc).not.toMatch(/FivConn04DEnvironmentBackfillWrite|proveWriteAuthority/);
  });

  it('T-S3-01: start / heartbeat / release remain wired to canonical SYSTEM_JOB actor', async () => {
    const g = grant();
    const next = grant({ expiresAt: '2026-10-30T10:20:00.000Z' });
    boundary.start.mockResolvedValue({ ok: true, grant: g });
    boundary.heartbeat.mockResolvedValue({ ok: true, grant: next });
    boundary.release.mockResolvedValue({ ok: true, observation: 'INACTIVE' });

    expect(await entry.start()).toEqual({ ok: true, grant: g });
    expect(await entry.heartbeat({ grant: g, proposedExpiresAt: next.expiresAt })).toEqual({
      ok: true,
      grant: next,
    });
    expect(await entry.release({ grant: g })).toEqual({ ok: true, observation: 'INACTIVE' });

    const expectedActor = buildFivConn04DSystemJobActor();
    expect(boundary.start.mock.calls[0]?.[0].actor).toEqual(expectedActor);
    expect(boundary.heartbeat.mock.calls[0]?.[0].actor).toEqual(expectedActor);
    expect(boundary.release.mock.calls[0]?.[0].actor).toEqual(expectedActor);
  });

  it('T-S3-02: proveWriteAuthority opens txn and delegates to write-unit; success is not invented', async () => {
    const g = grant();
    writeUnit.assertWriteAuthorityInTransaction.mockResolvedValue({ ok: true });
    const result = await entry.proveWriteAuthority({ grant: g });
    expect(result).toEqual({ ok: true });
    expect(transactions.run).toHaveBeenCalledTimes(1);
    expect(writeUnit.assertWriteAuthorityInTransaction).toHaveBeenCalledWith(
      { marker: 'entry-txn' },
      g,
    );
  });

  it('T-S3-02: proveWriteAuthority fails closed on authority/CAS miss', async () => {
    writeUnit.assertWriteAuthorityInTransaction.mockResolvedValue({
      ok: false,
      reason: 'GATE_FENCE_MISMATCH',
      observation: 'OWNERSHIP_LOST',
    });
    const result = await entry.proveWriteAuthority({ grant: grant() });
    expect(result).toEqual({
      ok: false,
      reason: 'GATE_FENCE_MISMATCH',
      observation: 'OWNERSHIP_LOST',
    });
  });

  it('T-S3-02: proveWriteAuthority maps transaction failure to fail-closed UNKNOWN', async () => {
    transactions.run.mockRejectedValue(new Error('txn boom'));
    const result = await entry.proveWriteAuthority({ grant: grant() });
    expect(result).toEqual({ ok: false, reason: 'GATE_UNKNOWN', observation: 'UNKNOWN' });
    expect(writeUnit.assertWriteAuthorityInTransaction).not.toHaveBeenCalled();
  });
});

describe('P-D-02 ConnectionsModule Nest export isolation (CONDITION-2)', () => {
  it('does not export Conn04MigrationBoundaryService', () => {
    expect(moduleExports()).not.toContain(Conn04MigrationBoundaryService);
  });

  it('does not export MIGRATION_GATE_PORT', () => {
    expect(moduleExports()).not.toContain(MIGRATION_GATE_PORT);
  });

  it('does not export MIGRATION_GATE_DURABLE_AUTHORITY', () => {
    expect(moduleExports()).not.toContain(MIGRATION_GATE_DURABLE_AUTHORITY);
  });

  it('does not export Conn04SystemJobMigrationEntry', () => {
    expect(moduleExports()).not.toContain(Conn04SystemJobMigrationEntry);
  });

  it('T-S3-03: does not export FivConn04DEnvironmentBackfillWrite', () => {
    expect(moduleExports()).not.toContain(FivConn04DEnvironmentBackfillWrite);
  });

  it('does not export identity factory / constants as Nest exports', () => {
    const exports = moduleExports();
    expect(exports).not.toContain(buildFivConn04DSystemJobActor);
    expect(exports).not.toContain(FIV_CONN_04_D_SYSTEM_JOB_ACTOR_ID);
  });

  it('keeps Entry + write-unit + B-04 + ports as internal providers; preserves preflight export', () => {
    const providers = moduleProviders();
    expect(providers).toContain(Conn04SystemJobMigrationEntry);
    expect(providers).toContain(FivConn04DEnvironmentBackfillWrite);
    expect(providers).toContain(Conn04MigrationBoundaryService);
    expect(
      providers.some(
        (p) =>
          typeof p === 'object' &&
          p !== null &&
          'provide' in p &&
          (p as { provide: unknown }).provide === MIGRATION_GATE_PORT,
      ),
    ).toBe(true);
    expect(
      providers.some(
        (p) =>
          typeof p === 'object' &&
          p !== null &&
          'provide' in p &&
          (p as { provide: unknown }).provide === MIGRATION_GATE_DURABLE_AUTHORITY,
      ),
    ).toBe(true);

    expect(moduleExports()).toContain(FivConn04APreflightService);
    expect(moduleExports()).not.toContain(Conn04MigrationBoundaryService);
    expect(moduleExports()).not.toContain(MIGRATION_GATE_PORT);
    expect(moduleExports()).not.toContain(MIGRATION_GATE_DURABLE_AUTHORITY);
    expect(moduleExports()).not.toContain(Conn04SystemJobMigrationEntry);
    expect(moduleExports()).not.toContain(FivConn04DEnvironmentBackfillWrite);
  });
});

describe('P-D-02 Entry-driven audit attribution', () => {
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

  it('Entry → B-04 → adapter acquire audits attribution.actorId as canonical SYSTEM_JOB', async () => {
    let row: Row = {
      gateKey: MIGRATION_GATE_KEY_FIV_CONN_04,
      purpose: MIGRATION_GATE_PURPOSE_FIV_CONN_04_MIGRATION_BACKFILL,
      state: 'INACTIVE',
      holderId: null,
      fenceGeneration: 0,
      acquiredAt: null,
      expiresAt: null,
      authorizedWindowMs: null,
      authorizedUntil: null,
      heartbeatAt: null,
      actorKind: null,
      correlationId: null,
    };
    const dbNow = new Date('2026-10-30T12:00:00.000Z');
    const securityRecord = vi.fn(async (_event: unknown, _txn?: unknown) => ({
      id: 'pd02-audit',
    }));
    vi.clearAllMocks();

    mockLeaseClient.$queryRaw.mockImplementation(async (arg: unknown) => {
      if (arg && typeof arg === 'object' && 'strings' in (arg as object)) {
        return [{ '?column?': 1 }];
      }
      return [{ now: dbNow }];
    });
    mockLeaseClient.connectionMigrationGateLease.findUnique.mockImplementation(async () => row);
    mockLeaseClient.connectionMigrationGateLease.updateMany.mockImplementation(
      async ({
        where,
        data,
      }: {
        where: Record<string, unknown>;
        data: Record<string, unknown>;
      }) => {
        if (where.gateKey !== undefined && where.gateKey !== row.gateKey) return { count: 0 };
        if (where.purpose !== undefined && where.purpose !== row.purpose) return { count: 0 };
        if (where.fenceGeneration !== undefined && where.fenceGeneration !== row.fenceGeneration) {
          return { count: 0 };
        }
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
        row = { ...row, ...(data as Partial<Row>) } as Row;
        return { count: 1 };
      },
    );

    const gateAudit = new ConnectionMigrationGateAudit({ record: securityRecord } as never);
    const adapter = new PrismaMigrationGateAdapter(
      mockLeaseClient as never,
      {
        run: async <T>(work: (tx: object) => Promise<T>) => work({ marker: 'pd02-lease-txn' }),
      } as never,
      gateAudit,
    );
    const boundary = new Conn04MigrationBoundaryService(adapter, {
      assertDurableAuthorityCas: vi.fn(),
    } as never);
    const writeUnit = new FivConn04DEnvironmentBackfillWrite(boundary);
    const entry = new Conn04SystemJobMigrationEntry(boundary, writeUnit, {
      run: async <T>(work: (tx: object) => Promise<T>) => work({ marker: 'pd02-write-txn' }),
    } as never);

    const result = await entry.start({ correlationId: 'pd02-audit-corr' });
    expect(result.ok).toBe(true);
    expect(securityRecord).toHaveBeenCalled();
    const event = securityRecord.mock.calls[0]?.[0] as
      | {
          attribution: { actorId: string };
          eventType: string;
          outcome: string;
        }
      | undefined;
    expect(event).toEqual(
      expect.objectContaining({
        eventType: MIGRATION_GATE_AUDIT_EVENT_TYPE,
        outcome: 'gate_acquired',
        attribution: expect.objectContaining({
          actorId: FIV_CONN_04_D_SYSTEM_JOB_ACTOR_ID,
        }),
      }),
    );
    expect(event?.attribution.actorId).toBe('system-job:fiv-conn-04-migration-backfill');
  });
});
