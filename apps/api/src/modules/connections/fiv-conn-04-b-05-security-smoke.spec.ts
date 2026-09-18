/**
 * FIV-CONN-04-B-05 / B05-S3 — Cross-slice security regression / smoke (TEST-ONLY).
 *
 * IMPL-COND-B05-04: exercise real CLOSED B-02/B-03/B-04 boundary paths.
 * Smoke only — no new architecture, no B-06 harness (C-B05-04).
 */

import { ConflictException } from '@nestjs/common';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { TransactionContext } from '../../storage/prisma/prisma-transaction.service';
import { Conn04MigrationBoundaryService } from './conn04-migration-boundary.service';
import {
  GATE_DENY_PUBLIC_MESSAGE,
  assertDenySetAllowed,
  observeOrUnknown,
} from './connection-migration-gate-enforcement';
import {
  MIGRATION_GATE_KEY_FIV_CONN_04,
  MIGRATION_GATE_MAX_AUTHORIZED_WINDOW_MS,
  MIGRATION_GATE_PURPOSE_FIV_CONN_04_MIGRATION_BACKFILL,
  type MigrationGateGrant,
  type PrivilegedActorContext,
} from './migration-gate';
import type { MigrationGateDurableAuthority } from './migration-gate-durable-authority.port';
import type { MigrationGatePort } from './migration-gate.port';
import { PrismaMigrationGateAdapter } from './prisma-migration-gate.adapter';

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

function grant(overrides: Partial<MigrationGateGrant> = {}): MigrationGateGrant {
  return Object.freeze({
    gateKey: MIGRATION_GATE_KEY_FIV_CONN_04,
    purpose: MIGRATION_GATE_PURPOSE_FIV_CONN_04_MIGRATION_BACKFILL,
    holderId: 'job-1',
    fenceGeneration: 3,
    acquiredAt: '2026-09-18T10:00:00.000Z',
    expiresAt: '2026-09-18T10:15:00.000Z',
    authorizedWindowMs: 4 * 60 * 60 * 1000,
    ...overrides,
  });
}

function operator(overrides: Partial<PrivilegedActorContext> = {}): PrivilegedActorContext {
  return Object.freeze({
    actorId: 'job-1',
    actorKind: 'SYSTEM_JOB' as const,
    ...overrides,
  });
}

describe('FIV-CONN-04-B-05 B05-S3 security smoke', () => {
  describe('B-03 UNKNOWN fail-closed (SB-B05-05 / K)', () => {
    it('observeOrUnknown maps failures to UNKNOWN', async () => {
      expect(
        await observeOrUnknown({
          observe: async () => ({
            ok: false as const,
            reason: 'GATE_UNKNOWN' as const,
            observation: 'UNKNOWN' as const,
          }),
        } as never),
      ).toBe('UNKNOWN');
      expect(
        await observeOrUnknown({
          observe: async () => {
            throw new Error('db down');
          },
        } as never),
      ).toBe('UNKNOWN');
    });

    it('UNKNOWN denies EXCHANGE create via real enforcement path', async () => {
      const events: Array<Record<string, unknown>> = [];
      await expect(
        assertDenySetAllowed({
          migrationGate: {
            observe: async () => ({ ok: true as const, observation: 'UNKNOWN' as const }),
          } as never,
          audit: {
            record: async (input: Record<string, unknown>) => {
              events.push(input);
            },
          } as never,
          method: 'create',
          connectionType: 'EXCHANGE',
          workspaceId: 'ws-smoke',
          actorUserId: 'user-smoke',
        }),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(events[0]).toMatchObject({
        outcome: 'lifecycle_mutation_blocked',
        payload: expect.objectContaining({
          observation: 'UNKNOWN',
          reasonCode: 'GATE_UNKNOWN',
        }),
      });
      expect(GATE_DENY_PUBLIC_MESSAGE.length).toBeGreaterThan(0);
    });
  });

  describe('B-02 stale fence / ownership / privileged acquire (SB-B05-06 / SB-B05-09)', () => {
    let row: Row | null;
    let dbNow: Date;
    let adapter: PrismaMigrationGateAdapter;

    beforeEach(() => {
      row = inactive(0);
      dbNow = new Date('2026-09-18T12:00:00.000Z');
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
          if (
            where.fenceGeneration !== undefined &&
            where.fenceGeneration !== row.fenceGeneration
          ) {
            return { count: 0 };
          }
          if (where.holderId !== undefined && where.holderId !== row.holderId) return { count: 0 };
          if (where.state !== undefined && where.state !== row.state) return { count: 0 };
          row = { ...row, ...(data as Partial<Row>) } as Row;
          return { count: 1 };
        },
      );
      adapter = new PrismaMigrationGateAdapter(
        mockClient as never,
        { run: async <T>(work: (tx: object) => Promise<T>) => work({}) } as never,
        { record: vi.fn(async () => undefined) } as never,
      );
    });

    it('stale release with old fence fails and does not clear newer lease', async () => {
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
      const result = await adapter.release({
        grant: staleGrant,
        actor: { actorId: 'op-1', actorKind: 'OPERATOR' },
      });
      expect(result.ok).toBe(false);
      expect(row.state).toBe('ACTIVE');
      expect(row.holderId).toBe('new-owner');
      expect(row.fenceGeneration).toBe(5);
    });

    it('stale heartbeat with old fence fails', async () => {
      const acquiredAt = dbNow;
      row = active({
        holderId: 'owner',
        fenceGeneration: 5,
        acquiredAt,
        expiresAt: new Date(dbNow.getTime() + 60_000),
        authorizedWindowMs: MIGRATION_GATE_MAX_AUTHORIZED_WINDOW_MS,
        authorizedUntil: new Date(dbNow.getTime() + MIGRATION_GATE_MAX_AUTHORIZED_WINDOW_MS),
      });
      const staleGrant: MigrationGateGrant = {
        gateKey: MIGRATION_GATE_KEY_FIV_CONN_04,
        purpose: MIGRATION_GATE_PURPOSE_FIV_CONN_04_MIGRATION_BACKFILL,
        holderId: 'owner',
        fenceGeneration: 4,
        acquiredAt: acquiredAt.toISOString(),
        expiresAt: new Date(dbNow.getTime() + 60_000).toISOString(),
        authorizedWindowMs: MIGRATION_GATE_MAX_AUTHORIZED_WINDOW_MS,
      };
      const result = await adapter.heartbeat({
        grant: staleGrant,
        actor: { actorId: 'op-1', actorKind: 'OPERATOR' },
        proposedExpiresAt: new Date(dbNow.getTime() + 30_000).toISOString(),
      });
      expect(result.ok).toBe(false);
      expect(row.fenceGeneration).toBe(5);
    });

    it('ST-B21-class: empty actorId cannot acquire (privileged acquire smoke)', async () => {
      const result = await adapter.acquire({
        purpose: MIGRATION_GATE_PURPOSE_FIV_CONN_04_MIGRATION_BACKFILL,
        actor: { actorId: '', actorKind: 'OPERATOR' },
      });
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.reason).toBe('GATE_UNAUTHORIZED');
      expect(row?.state).toBe('INACTIVE');
    });
  });

  describe('B-04 boundary smoke (SB-B05-06 / client fence / walls)', () => {
    let port: {
      acquire: ReturnType<typeof vi.fn>;
      release: ReturnType<typeof vi.fn>;
      heartbeat: ReturnType<typeof vi.fn>;
      observe: ReturnType<typeof vi.fn>;
      validate: ReturnType<typeof vi.fn>;
    };
    let durable: { assertDurableAuthorityCas: ReturnType<typeof vi.fn> };
    let boundary: Conn04MigrationBoundaryService;

    beforeEach(() => {
      port = {
        acquire: vi.fn(),
        release: vi.fn(),
        heartbeat: vi.fn(),
        observe: vi.fn(),
        validate: vi.fn(),
      };
      durable = { assertDurableAuthorityCas: vi.fn() };
      boundary = new Conn04MigrationBoundaryService(
        port as unknown as MigrationGatePort,
        durable as unknown as MigrationGateDurableAuthority,
      );
    });

    it('UNKNOWN observation refuses start', async () => {
      port.acquire.mockResolvedValue({
        ok: false,
        reason: 'GATE_UNKNOWN',
        observation: 'UNKNOWN',
      });
      const result = await boundary.start({ actor: operator() });
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.reason).toBe('GATE_UNKNOWN');
        expect(result.observation).toBe('UNKNOWN');
      }
    });

    it('stale fence cannot authorize write proof', async () => {
      durable.assertDurableAuthorityCas.mockResolvedValue(false);
      const forged = grant({ fenceGeneration: 999 });
      const result = await boundary.assertWriteAuthority(
        Object.freeze({}) as TransactionContext,
        forged,
      );
      expect(result.ok).toBe(false);
      expect(durable.assertDurableAuthorityCas).toHaveBeenCalledWith(expect.anything(), forged);
    });

    it('heartbeat / release ownership delegates to MigrationGatePort', async () => {
      const g = grant();
      const next = grant({ expiresAt: '2026-09-18T10:20:00.000Z' });
      port.heartbeat.mockResolvedValue({ ok: true, grant: next });
      port.release.mockResolvedValue({ ok: true, observation: 'INACTIVE' });
      await expect(
        boundary.heartbeat({ actor: operator(), grant: g, proposedExpiresAt: next.expiresAt }),
      ).resolves.toEqual({ ok: true, grant: next });
      await expect(boundary.release({ actor: operator(), grant: g })).resolves.toEqual({
        ok: true,
        observation: 'INACTIVE',
      });
      expect(port.heartbeat).toHaveBeenCalledWith({
        grant: g,
        actor: operator(),
        proposedExpiresAt: next.expiresAt,
      });
      expect(port.release).toHaveBeenCalledWith({ grant: g, actor: operator() });
    });

    it('security walls: no env UPDATE / Vault / public migration HTTP / second SoT in façade', () => {
      const src = readFileSync(join(__dirname, 'conn04-migration-boundary.service.ts'), 'utf8');
      expect(src).not.toMatch(/from ['"].*secret-vault/i);
      expect(src).not.toMatch(/SecretVaultService/);
      expect(src).not.toMatch(/connectionRecord\.(update|create)/i);
      expect(src).not.toMatch(/@Controller|@Post\(|@Patch\(|@Put\(/);
      expect(src).not.toMatch(/allowRealVenueIo|ExecutionAdapterPort|live-venue/i);

      const moduleSrc = readFileSync(join(__dirname, 'connections.module.ts'), 'utf8');
      expect(moduleSrc).toMatch(/MIGRATION_GATE_DURABLE_AUTHORITY/);
      expect(moduleSrc).toMatch(/useExisting:\s*PrismaMigrationGateAdapter/);
      expect(moduleSrc).not.toMatch(/class\s+\w*Cas\w*/);

      const controllerSrc = readFileSync(join(__dirname, 'connections.controller.ts'), 'utf8');
      expect(controllerSrc).not.toMatch(
        /Conn04MigrationBoundary|migrationGate\.(acquire|release)/i,
      );
      expect(controllerSrc).not.toMatch(/assertWriteAuthority|assertDurableAuthorityCas/);
    });

    it('no parallel audit system introduced by B-05 (SB-B05-10)', () => {
      const auditSrc = readFileSync(join(__dirname, 'connection-migration-gate-audit.ts'), 'utf8');
      expect(auditSrc).toMatch(/SecurityAuditService/);
      expect(auditSrc).toMatch(/MIGRATION_GATE_AUDIT_EVENT_TYPE/);
      expect(auditSrc).not.toMatch(/createParallelAudit|AlternateAudit|secondAuditSoT/i);
    });

    it('parent non-scope walls remain outside B-05 (B05-AC12)', () => {
      const boundarySrc = readFileSync(
        join(__dirname, 'conn04-migration-boundary.service.ts'),
        'utf8',
      );
      // Structural absences — comment mentions of deferred 04-D are allowed.
      expect(boundarySrc).not.toMatch(/from ['"].*(capital|fiv-cred|c7[_-]|backfill)/i);
      expect(boundarySrc).not.toMatch(
        /\b(backfillWorker|CapitalAllocation|C7Live|allowRealVenueIo|ExecutionAdapterPort)\b/,
      );
      expect(boundarySrc).not.toMatch(/connectionRecord\.(update|create)/i);
      expect(boundarySrc).not.toMatch(/environment:\s*['"]LIVE['"]/);
    });
  });
});
