/**
 * FIV-CONN-04-B-05 / B05-S1 — Audit integrity regression (TEST-ONLY).
 *
 * Proves AC-B12 / OD-B-06 / SEC-B12 via canonical path:
 *   ConnectionMigrationGateAudit → SecurityAuditService.record
 * Consumes CLOSED B-02/B-03 emitters; no production changes (IMPL-COND-B05-01/05).
 */

import { ConflictException } from '@nestjs/common';
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

import { isClassifiedSecurityAuditEvent } from '../security-audit/security-audit-classification';
import { ConnectionMigrationGateAudit } from './connection-migration-gate-audit';
import {
  GATE_DENY_PUBLIC_MESSAGE,
  assertDenySetAllowed,
} from './connection-migration-gate-enforcement';
import {
  MIGRATION_GATE_AUDIT_EVENT_TYPE,
  MIGRATION_GATE_AUDIT_OUTCOMES,
  MIGRATION_GATE_KEY_FIV_CONN_04,
  MIGRATION_GATE_PURPOSE_FIV_CONN_04_MIGRATION_BACKFILL,
  isMigrationGateAuditOutcome,
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

describe('FIV-CONN-04-B-05 B05-S1 audit integrity', () => {
  describe('catalog / OD-B-06 representability (B05-AC03 / B05-AC06)', () => {
    it('registers connection.migration-gate in Security Audit classification', () => {
      expect(isClassifiedSecurityAuditEvent(MIGRATION_GATE_AUDIT_EVENT_TYPE)).toBe(true);
    });

    it('required OD-B-06 outcomes remain representable', () => {
      for (const outcome of [
        'gate_acquired',
        'gate_acquire_denied',
        'lifecycle_mutation_blocked',
        'gate_released',
        'lease_expired_reclaim',
        'stale_holder_rejected',
        'acquire_timeout',
      ] as const) {
        expect(isMigrationGateAuditOutcome(outcome)).toBe(true);
        expect(MIGRATION_GATE_AUDIT_OUTCOMES).toContain(outcome);
      }
    });
  });

  describe('canonical emit path (B05-AC01 / AC05 / F / IMPL-COND-B05-02)', () => {
    it('ConnectionMigrationGateAudit reaches SecurityAuditService.record with eventType + attribution', async () => {
      const record = vi.fn(async () => ({ id: 'audit-1' }));
      const audit = new ConnectionMigrationGateAudit({ record } as never);
      await audit.record({
        outcome: 'gate_acquired',
        actorId: 'op-b05',
        correlationId: 'corr-b05',
        payload: {
          gateKey: MIGRATION_GATE_KEY_FIV_CONN_04,
          purpose: MIGRATION_GATE_PURPOSE_FIV_CONN_04_MIGRATION_BACKFILL,
          fenceGeneration: 2,
          outcome: 'gate_acquired',
          result: 'acquired',
        },
      });
      expect(record).toHaveBeenCalledTimes(1);
      expect(record).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: MIGRATION_GATE_AUDIT_EVENT_TYPE,
          outcome: 'gate_acquired',
          source: 'connections',
          attribution: expect.objectContaining({
            actorId: 'op-b05',
            resourceType: 'migration-gate',
            resourceId: 'FIV-CONN-04',
          }),
          correlationId: 'corr-b05',
          payload: expect.objectContaining({
            fenceGeneration: 2,
            gateKey: MIGRATION_GATE_KEY_FIV_CONN_04,
          }),
        }),
        undefined,
      );
    });
  });

  describe('B-02 same-txn lifecycle audit (B05-AC01 / IMPL-COND-B05-02)', () => {
    let row: Row | null;
    let dbNow: Date;
    let securityRecord: ReturnType<typeof vi.fn>;
    let adapter: PrismaMigrationGateAdapter;

    beforeEach(() => {
      row = inactive(0);
      dbNow = new Date('2026-09-18T12:00:00.000Z');
      securityRecord = vi.fn(async () => ({ id: 'b02-audit' }));
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
          row = { ...row, ...(data as Partial<Row>) } as Row;
          return { count: 1 };
        },
      );

      const gateAudit = new ConnectionMigrationGateAudit({ record: securityRecord } as never);
      adapter = new PrismaMigrationGateAdapter(
        mockClient as never,
        {
          run: async <T>(work: (tx: object) => Promise<T>) => work({ marker: 'lease-txn' }),
        } as never,
        gateAudit,
      );
    });

    it('acquire emits gate_acquired through canonical audit with transaction argument', async () => {
      const result = await adapter.acquire({
        purpose: MIGRATION_GATE_PURPOSE_FIV_CONN_04_MIGRATION_BACKFILL,
        actor: { actorId: 'op-1', actorKind: 'OPERATOR', correlationId: 'c-1' },
      });
      expect(result.ok).toBe(true);
      expect(securityRecord).toHaveBeenCalled();
      const [event, txn] = securityRecord.mock.calls[0] ?? [];
      expect(event).toEqual(
        expect.objectContaining({
          eventType: MIGRATION_GATE_AUDIT_EVENT_TYPE,
          outcome: 'gate_acquired',
          attribution: expect.objectContaining({ actorId: 'op-1' }),
        }),
      );
      expect(txn).toEqual(expect.objectContaining({ marker: 'lease-txn' }));
    });

    it('contention acquire emits gate_acquire_denied with transaction argument', async () => {
      row = {
        ...inactive(3),
        state: 'ACTIVE',
        holderId: 'other',
        fenceGeneration: 3,
        acquiredAt: dbNow,
        expiresAt: new Date(dbNow.getTime() + 60_000),
        authorizedWindowMs: 4 * 60 * 60 * 1000,
        authorizedUntil: new Date(dbNow.getTime() + 4 * 60 * 60 * 1000),
      };
      const result = await adapter.acquire({
        purpose: MIGRATION_GATE_PURPOSE_FIV_CONN_04_MIGRATION_BACKFILL,
        actor: { actorId: 'op-2', actorKind: 'OPERATOR' },
      });
      expect(result.ok).toBe(false);
      expect(securityRecord).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: MIGRATION_GATE_AUDIT_EVENT_TYPE,
          outcome: 'gate_acquire_denied',
          attribution: expect.objectContaining({ actorId: 'op-2' }),
        }),
        expect.objectContaining({ marker: 'lease-txn' }),
      );
    });
  });

  describe('B-03 denial audit (B05-AC02 / AC04 / AC07)', () => {
    it('ACTIVE deny emits lifecycle_mutation_blocked with workspace + actor before ConflictException', async () => {
      const record = vi.fn(async () => ({ id: 'deny-1' }));
      const gateAudit = new ConnectionMigrationGateAudit({ record } as never);
      await expect(
        assertDenySetAllowed({
          migrationGate: {
            observe: async () => ({ ok: true as const, observation: 'ACTIVE' as const }),
          } as never,
          audit: gateAudit,
          method: 'storeCredentials',
          workspaceId: 'ws-b05',
          actorUserId: 'user-b05',
          connectionId: 'conn-1',
        }),
      ).rejects.toBeInstanceOf(ConflictException);

      expect(record).toHaveBeenCalledTimes(1);
      expect(record).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: MIGRATION_GATE_AUDIT_EVENT_TYPE,
          outcome: 'lifecycle_mutation_blocked',
          attribution: expect.objectContaining({
            actorId: 'user-b05',
            workspaceId: 'ws-b05',
          }),
          payload: expect.objectContaining({
            observation: 'ACTIVE',
            operation: 'CREDENTIAL_STORE',
            workspaceId: 'ws-b05',
            connectionId: 'conn-1',
            result: 'denied',
          }),
        }),
        undefined,
      );
    });

    it('UNKNOWN deny audits then fails closed with public message', async () => {
      const record = vi.fn(async () => ({ id: 'deny-u' }));
      const gateAudit = new ConnectionMigrationGateAudit({ record } as never);
      await expect(
        assertDenySetAllowed({
          migrationGate: {
            observe: async () => ({ ok: true as const, observation: 'UNKNOWN' as const }),
          } as never,
          audit: gateAudit,
          method: 'create',
          connectionType: 'EXCHANGE',
          workspaceId: 'ws-u',
          actorUserId: 'user-u',
        }),
      ).rejects.toMatchObject({ message: GATE_DENY_PUBLIC_MESSAGE });
      expect(record).toHaveBeenCalledWith(
        expect.objectContaining({
          outcome: 'lifecycle_mutation_blocked',
          payload: expect.objectContaining({
            observation: 'UNKNOWN',
            reasonCode: 'GATE_UNKNOWN',
            operation: 'EXCHANGE_CREATE',
          }),
        }),
        undefined,
      );
    });

    it('audit failure on deny path fails closed (no soft-pass)', async () => {
      const record = vi.fn(async () => {
        throw new Error('audit unavailable');
      });
      const gateAudit = new ConnectionMigrationGateAudit({ record } as never);
      await expect(
        assertDenySetAllowed({
          migrationGate: {
            observe: async () => ({ ok: true as const, observation: 'ACTIVE' as const }),
          } as never,
          audit: gateAudit,
          method: 'replaceCredentials',
          workspaceId: 'ws-a',
          actorUserId: 'user-a',
          connectionId: 'c-1',
        }),
      ).rejects.toThrow(/audit unavailable|payload rejected|Migration-gate audit/);
    });
  });
});
