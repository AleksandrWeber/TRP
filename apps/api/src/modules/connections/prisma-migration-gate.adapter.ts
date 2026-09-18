/**
 * FIV-CONN-04-B-02 — Durable MigrationGatePort adapter (DB singleton lease SoT).
 *
 * CHECK-THEN-SAVE ALONE IS FORBIDDEN for protected mutation.
 * Authority = atomic updateMany CAS predicates + DB NOW().
 * No Vault / HTTP / external I/O inside lease transactions.
 */

import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../storage/prisma/prisma.module';
import {
  PrismaTransactionService,
  prismaClientForTransaction,
  type TransactionContext,
} from '../../storage/prisma/prisma-transaction.service';
import { ConnectionMigrationGateAudit } from './connection-migration-gate-audit';
import { MIGRATION_GATE_DEFAULT_TTL_MS } from './migration-gate.constants';
import {
  MIGRATION_GATE_KEY_FIV_CONN_04,
  MIGRATION_GATE_MAX_AUTHORIZED_WINDOW_MS,
  MIGRATION_GATE_PURPOSE_FIV_CONN_04_MIGRATION_BACKFILL,
  assertAcquireInput,
  assertHeartbeatCeiling,
  classifyGrantShape,
  computeAuthorizedUntilIso,
  type MigrationGateGrant,
  type MigrationGateObservation,
  type MigrationGateReasonCode,
  type PrivilegedActorContext,
} from './migration-gate';
import type {
  MigrationGateAcquireInput,
  MigrationGateAcquireResult,
  MigrationGateHeartbeatInput,
  MigrationGateHeartbeatResult,
  MigrationGateObservationResult,
  MigrationGatePort,
  MigrationGateReleaseInput,
  MigrationGateReleaseResult,
  MigrationGateValidateResult,
} from './migration-gate.port';

type LeaseRow = {
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

const GATE_KEY = MIGRATION_GATE_KEY_FIV_CONN_04;
const PURPOSE = MIGRATION_GATE_PURPOSE_FIV_CONN_04_MIGRATION_BACKFILL;

function failAcquire(
  reason: MigrationGateReasonCode,
  observation?: MigrationGateObservation,
): MigrationGateAcquireResult {
  return observation === undefined ? { ok: false, reason } : { ok: false, reason, observation };
}

function failRelease(
  reason: MigrationGateReasonCode,
  observation?: MigrationGateObservation,
): MigrationGateReleaseResult {
  return observation === undefined ? { ok: false, reason } : { ok: false, reason, observation };
}

function failHeartbeat(
  reason: MigrationGateReasonCode,
  observation?: MigrationGateObservation,
): MigrationGateHeartbeatResult {
  return observation === undefined ? { ok: false, reason } : { ok: false, reason, observation };
}

@Injectable()
export class PrismaMigrationGateAdapter implements MigrationGatePort {
  constructor(
    private readonly prisma: PrismaService,
    private readonly transactions: PrismaTransactionService,
    private readonly audit: ConnectionMigrationGateAudit,
  ) {}

  async acquire(input: MigrationGateAcquireInput): Promise<MigrationGateAcquireResult> {
    const checked = assertAcquireInput(input);
    if (!checked.ok) {
      return failAcquire(checked.reason, checked.observation);
    }
    const { purpose, actor, requestedTtlMs } = checked.value;
    const correlationId = input.correlationId ?? actor.correlationId;

    try {
      return await this.transactions.run(async (tx) => {
        const client = prismaClientForTransaction(tx);
        const dbNow = await this.readDbNow(client);
        await this.lockSingleton(client);

        const row = await client.connectionMigrationGateLease.findUnique({
          where: { gateKey: GATE_KEY },
        });
        if (!row) {
          await this.safeAudit(
            {
              outcome: 'gate_acquire_denied',
              actorId: actor.actorId,
              correlationId,
              payload: {
                gateKey: GATE_KEY,
                purpose,
                outcome: 'gate_acquire_denied',
                reasonCode: 'GATE_UNKNOWN',
                observation: 'UNKNOWN',
              },
            },
            tx,
          );
          return failAcquire('GATE_UNKNOWN', 'UNKNOWN');
        }
        if (row.purpose !== PURPOSE || purpose !== PURPOSE) {
          await this.safeAudit(
            {
              outcome: 'gate_acquire_denied',
              actorId: actor.actorId,
              correlationId,
              payload: {
                gateKey: GATE_KEY,
                purpose,
                outcome: 'gate_acquire_denied',
                reasonCode: 'GATE_PURPOSE_MISMATCH',
              },
            },
            tx,
          );
          return failAcquire('GATE_PURPOSE_MISMATCH');
        }

        const activeUnexpired =
          row.state === 'ACTIVE' &&
          row.expiresAt !== null &&
          row.expiresAt.getTime() > dbNow.getTime();
        if (activeUnexpired) {
          await this.safeAudit(
            {
              outcome: 'gate_acquire_denied',
              actorId: actor.actorId,
              correlationId,
              payload: {
                gateKey: GATE_KEY,
                purpose,
                holderId: row.holderId ?? undefined,
                fenceGeneration: row.fenceGeneration,
                outcome: 'gate_acquire_denied',
                reasonCode: 'GATE_CONTENTION',
                observation: 'CONTENTION_DENIED',
              },
            },
            tx,
          );
          return failAcquire('GATE_CONTENTION', 'CONTENTION_DENIED');
        }

        const authorizedWindowMs = MIGRATION_GATE_MAX_AUTHORIZED_WINDOW_MS;
        const ttlMs = Math.min(
          Math.max(1, requestedTtlMs ?? MIGRATION_GATE_DEFAULT_TTL_MS),
          authorizedWindowMs,
        );
        const priorFence = row.fenceGeneration;
        if (priorFence >= Number.MAX_SAFE_INTEGER - 1 || priorFence >= 2_147_483_646) {
          return failAcquire('GATE_UNKNOWN', 'UNKNOWN');
        }
        const newFence = priorFence + 1;
        const acquiredAt = dbNow;
        const authorizedUntil = new Date(acquiredAt.getTime() + authorizedWindowMs);
        const expiresAt = new Date(
          Math.min(acquiredAt.getTime() + ttlMs, authorizedUntil.getTime()),
        );
        const wasExpired =
          row.state === 'ACTIVE' &&
          row.expiresAt !== null &&
          row.expiresAt.getTime() <= dbNow.getTime();

        const updated = await client.connectionMigrationGateLease.updateMany({
          where: {
            gateKey: GATE_KEY,
            purpose: PURPOSE,
            fenceGeneration: priorFence,
            OR: [
              { state: 'INACTIVE' },
              {
                state: 'ACTIVE',
                expiresAt: { lte: dbNow },
              },
            ],
          },
          data: {
            state: 'ACTIVE',
            holderId: actor.actorId,
            fenceGeneration: newFence,
            purpose: PURPOSE,
            acquiredAt,
            expiresAt,
            authorizedWindowMs,
            authorizedUntil,
            heartbeatAt: dbNow,
            actorKind: actor.actorKind,
            correlationId: correlationId ?? null,
          },
        });

        if (updated.count !== 1) {
          await this.safeAudit(
            {
              outcome: 'gate_acquire_denied',
              actorId: actor.actorId,
              correlationId,
              payload: {
                gateKey: GATE_KEY,
                purpose,
                outcome: 'gate_acquire_denied',
                reasonCode: 'GATE_CONTENTION',
                observation: 'CONTENTION_DENIED',
              },
            },
            tx,
          );
          return failAcquire('GATE_CONTENTION', 'CONTENTION_DENIED');
        }

        const grant = this.toGrant({
          holderId: actor.actorId,
          fenceGeneration: newFence,
          acquiredAt,
          expiresAt,
          authorizedWindowMs,
          correlationId,
        });

        if (wasExpired) {
          await this.safeAudit(
            {
              outcome: 'lease_expired_reclaim',
              actorId: actor.actorId,
              correlationId,
              payload: {
                gateKey: GATE_KEY,
                purpose,
                holderId: grant.holderId,
                fenceGeneration: grant.fenceGeneration,
                acquiredAt: grant.acquiredAt,
                expiresAt: grant.expiresAt,
                authorizedWindowMs: grant.authorizedWindowMs,
                outcome: 'lease_expired_reclaim',
                observation: 'ACTIVE',
              },
            },
            tx,
          );
        }
        await this.safeAudit(
          {
            outcome: 'gate_acquired',
            actorId: actor.actorId,
            correlationId,
            payload: {
              gateKey: GATE_KEY,
              purpose,
              holderId: grant.holderId,
              fenceGeneration: grant.fenceGeneration,
              acquiredAt: grant.acquiredAt,
              expiresAt: grant.expiresAt,
              authorizedWindowMs: grant.authorizedWindowMs,
              outcome: 'gate_acquired',
              observation: 'ACTIVE',
            },
          },
          tx,
        );
        return { ok: true, grant };
      });
    } catch {
      return failAcquire('GATE_UNKNOWN', 'UNKNOWN');
    }
  }

  /**
   * Privileged operator reclaim before TTL (COND-B02-06 / IMPL-COND-B02-03).
   * Not exposed on public Connections HTTP in B-02.
   */
  async reclaimAsOperator(input: {
    actor: PrivilegedActorContext;
    correlationId?: string;
  }): Promise<MigrationGateAcquireResult> {
    const checked = assertAcquireInput({
      purpose: PURPOSE,
      actor: input.actor,
    });
    if (!checked.ok) {
      return failAcquire(checked.reason, checked.observation);
    }
    if (checked.value.actor.actorKind !== 'OPERATOR') {
      return failAcquire('GATE_UNAUTHORIZED');
    }
    const actor = checked.value.actor;
    const correlationId = input.correlationId ?? actor.correlationId;

    try {
      return await this.transactions.run(async (tx) => {
        const client = prismaClientForTransaction(tx);
        const dbNow = await this.readDbNow(client);
        await this.lockSingleton(client);

        const row = await client.connectionMigrationGateLease.findUnique({
          where: { gateKey: GATE_KEY },
        });
        if (!row || row.purpose !== PURPOSE) {
          return failAcquire('GATE_UNKNOWN', 'UNKNOWN');
        }
        if (row.state !== 'ACTIVE' || row.holderId === null) {
          return failAcquire('GATE_ALREADY_INACTIVE', 'INACTIVE');
        }

        const priorFence = row.fenceGeneration;
        if (priorFence >= 2_147_483_646) {
          return failAcquire('GATE_UNKNOWN', 'UNKNOWN');
        }
        const newFence = priorFence + 1;
        const authorizedWindowMs = MIGRATION_GATE_MAX_AUTHORIZED_WINDOW_MS;
        const ttlMs = MIGRATION_GATE_DEFAULT_TTL_MS;
        const acquiredAt = dbNow;
        const authorizedUntil = new Date(acquiredAt.getTime() + authorizedWindowMs);
        const expiresAt = new Date(
          Math.min(acquiredAt.getTime() + ttlMs, authorizedUntil.getTime()),
        );

        const updated = await client.connectionMigrationGateLease.updateMany({
          where: {
            gateKey: GATE_KEY,
            purpose: PURPOSE,
            state: 'ACTIVE',
            fenceGeneration: priorFence,
            holderId: row.holderId,
          },
          data: {
            holderId: actor.actorId,
            fenceGeneration: newFence,
            acquiredAt,
            expiresAt,
            authorizedWindowMs,
            authorizedUntil,
            heartbeatAt: dbNow,
            actorKind: actor.actorKind,
            correlationId: correlationId ?? null,
          },
        });
        if (updated.count !== 1) {
          await this.safeAudit(
            {
              outcome: 'gate_acquire_denied',
              actorId: actor.actorId,
              correlationId,
              payload: {
                gateKey: GATE_KEY,
                purpose: PURPOSE,
                outcome: 'gate_acquire_denied',
                reasonCode: 'GATE_CONTENTION',
                observation: 'CONTENTION_DENIED',
              },
            },
            tx,
          );
          return failAcquire('GATE_CONTENTION', 'CONTENTION_DENIED');
        }

        const grant = this.toGrant({
          holderId: actor.actorId,
          fenceGeneration: newFence,
          acquiredAt,
          expiresAt,
          authorizedWindowMs,
          correlationId,
        });
        await this.safeAudit(
          {
            outcome: 'gate_stale_reclaim',
            actorId: actor.actorId,
            correlationId,
            payload: {
              gateKey: GATE_KEY,
              purpose: PURPOSE,
              holderId: grant.holderId,
              fenceGeneration: grant.fenceGeneration,
              acquiredAt: grant.acquiredAt,
              expiresAt: grant.expiresAt,
              authorizedWindowMs: grant.authorizedWindowMs,
              outcome: 'gate_stale_reclaim',
              observation: 'ACTIVE',
            },
          },
          tx,
        );
        await this.safeAudit(
          {
            outcome: 'gate_acquired',
            actorId: actor.actorId,
            correlationId,
            payload: {
              gateKey: GATE_KEY,
              purpose: PURPOSE,
              holderId: grant.holderId,
              fenceGeneration: grant.fenceGeneration,
              acquiredAt: grant.acquiredAt,
              expiresAt: grant.expiresAt,
              authorizedWindowMs: grant.authorizedWindowMs,
              outcome: 'gate_acquired',
              observation: 'ACTIVE',
            },
          },
          tx,
        );
        return { ok: true, grant };
      });
    } catch {
      return failAcquire('GATE_UNKNOWN', 'UNKNOWN');
    }
  }

  async release(input: MigrationGateReleaseInput): Promise<MigrationGateReleaseResult> {
    const shaped = classifyGrantShape(input.grant);
    if (!shaped.ok) {
      return failRelease(shaped.reason, shaped.observation ?? 'UNKNOWN');
    }
    if (!input.actor || typeof input.actor.actorId !== 'string') {
      return failRelease('GATE_UNAUTHORIZED');
    }
    const grant = shaped.value;

    try {
      return await this.transactions.run(async (tx) => {
        const client = prismaClientForTransaction(tx);
        const dbNow = await this.readDbNow(client);
        await this.lockSingleton(client);

        const row = await client.connectionMigrationGateLease.findUnique({
          where: { gateKey: GATE_KEY },
        });
        if (!row) {
          return failRelease('GATE_UNKNOWN', 'UNKNOWN');
        }

        const priorExpires = row.expiresAt;
        const updated = await client.connectionMigrationGateLease.updateMany({
          where: {
            gateKey: GATE_KEY,
            purpose: PURPOSE,
            state: 'ACTIVE',
            holderId: grant.holderId,
            fenceGeneration: grant.fenceGeneration,
          },
          data: {
            state: 'INACTIVE',
            holderId: null,
            acquiredAt: null,
            expiresAt: null,
            authorizedWindowMs: null,
            authorizedUntil: null,
            heartbeatAt: null,
            actorKind: null,
            correlationId: null,
          },
        });

        if (updated.count === 1) {
          const observation: 'INACTIVE' | 'EXPIRED' =
            priorExpires !== null && priorExpires.getTime() <= dbNow.getTime()
              ? 'EXPIRED'
              : 'INACTIVE';
          await this.safeAudit(
            {
              outcome: 'gate_released',
              actorId: input.actor.actorId,
              correlationId: grant.correlationId ?? input.actor.correlationId,
              payload: {
                gateKey: GATE_KEY,
                purpose: PURPOSE,
                holderId: grant.holderId,
                fenceGeneration: grant.fenceGeneration,
                outcome: 'gate_released',
                observation,
              },
            },
            tx,
          );
          return { ok: true, observation };
        }

        if (row.state === 'INACTIVE') {
          return failRelease('GATE_ALREADY_INACTIVE', 'INACTIVE');
        }
        if (row.holderId !== grant.holderId) {
          await this.safeAudit(
            {
              outcome: 'stale_holder_rejected',
              actorId: input.actor.actorId,
              correlationId: grant.correlationId,
              payload: {
                gateKey: GATE_KEY,
                purpose: PURPOSE,
                holderId: grant.holderId,
                fenceGeneration: grant.fenceGeneration,
                outcome: 'stale_holder_rejected',
                reasonCode: 'GATE_OWNERSHIP_LOST',
                observation: 'OWNERSHIP_LOST',
              },
            },
            tx,
          );
          return failRelease('GATE_OWNERSHIP_LOST', 'OWNERSHIP_LOST');
        }
        if (row.fenceGeneration !== grant.fenceGeneration) {
          await this.safeAudit(
            {
              outcome: 'gate_fencing_rejected',
              actorId: input.actor.actorId,
              correlationId: grant.correlationId,
              payload: {
                gateKey: GATE_KEY,
                purpose: PURPOSE,
                holderId: grant.holderId,
                fenceGeneration: grant.fenceGeneration,
                outcome: 'gate_fencing_rejected',
                reasonCode: 'GATE_FENCE_MISMATCH',
                observation: 'OWNERSHIP_LOST',
              },
            },
            tx,
          );
          return failRelease('GATE_FENCE_MISMATCH', 'OWNERSHIP_LOST');
        }
        if (row.expiresAt !== null && row.expiresAt.getTime() <= dbNow.getTime()) {
          return failRelease('GATE_EXPIRED', 'EXPIRED');
        }
        return failRelease('GATE_UNKNOWN', 'UNKNOWN');
      });
    } catch {
      return failRelease('GATE_UNKNOWN', 'UNKNOWN');
    }
  }

  async heartbeat(input: MigrationGateHeartbeatInput): Promise<MigrationGateHeartbeatResult> {
    const shaped = classifyGrantShape(input.grant);
    if (!shaped.ok) {
      return failHeartbeat(shaped.reason, shaped.observation ?? 'UNKNOWN');
    }
    const grant = shaped.value;

    try {
      return await this.transactions.run(async (tx) => {
        const client = prismaClientForTransaction(tx);
        const dbNow = await this.readDbNow(client);
        await this.lockSingleton(client);

        const ceiling = assertHeartbeatCeiling({
          grant,
          proposedExpiresAt: input.proposedExpiresAt,
          nowMs: dbNow.getTime(),
        });
        if (!ceiling.ok) {
          await this.safeAudit(
            {
              outcome: 'gate_heartbeat_failed',
              actorId: input.actor.actorId,
              correlationId: grant.correlationId ?? input.actor.correlationId,
              payload: {
                gateKey: GATE_KEY,
                purpose: PURPOSE,
                holderId: grant.holderId,
                fenceGeneration: grant.fenceGeneration,
                outcome: 'gate_heartbeat_failed',
                reasonCode: ceiling.reason,
                observation: ceiling.observation,
              },
            },
            tx,
          );
          return failHeartbeat(ceiling.reason, ceiling.observation);
        }

        const proposed = new Date(ceiling.value.newExpiresAt);
        const updated = await client.connectionMigrationGateLease.updateMany({
          where: {
            gateKey: GATE_KEY,
            purpose: PURPOSE,
            state: 'ACTIVE',
            holderId: grant.holderId,
            fenceGeneration: grant.fenceGeneration,
            expiresAt: { gt: dbNow },
            authorizedUntil: { gt: dbNow },
            AND: [{ authorizedUntil: { gte: proposed } }],
          },
          data: {
            expiresAt: proposed,
            heartbeatAt: dbNow,
          },
        });

        if (updated.count !== 1) {
          const row = await client.connectionMigrationGateLease.findUnique({
            where: { gateKey: GATE_KEY },
          });
          const mapped = this.mapHeartbeatMiss(row, grant, dbNow);
          await this.safeAudit(
            {
              outcome:
                mapped.reason === 'GATE_FENCE_MISMATCH' || mapped.reason === 'GATE_OWNERSHIP_LOST'
                  ? 'stale_holder_rejected'
                  : 'heartbeat_rejected',
              actorId: input.actor.actorId,
              correlationId: grant.correlationId,
              payload: {
                gateKey: GATE_KEY,
                purpose: PURPOSE,
                holderId: grant.holderId,
                fenceGeneration: grant.fenceGeneration,
                outcome: 'heartbeat_rejected',
                reasonCode: mapped.reason,
                observation: mapped.observation,
              },
            },
            tx,
          );
          return failHeartbeat(mapped.reason, mapped.observation);
        }

        return {
          ok: true,
          grant: this.toGrant({
            holderId: grant.holderId,
            fenceGeneration: grant.fenceGeneration,
            acquiredAt: new Date(grant.acquiredAt),
            expiresAt: proposed,
            authorizedWindowMs: grant.authorizedWindowMs,
            correlationId: grant.correlationId,
          }),
        };
      });
    } catch {
      return failHeartbeat('GATE_UNKNOWN', 'UNKNOWN');
    }
  }

  async observe(): Promise<MigrationGateObservationResult> {
    try {
      const dbNow = await this.readDbNow(this.prisma);
      const row = await this.prisma.connectionMigrationGateLease.findUnique({
        where: { gateKey: GATE_KEY },
      });
      if (!row) {
        return { ok: false, reason: 'GATE_UNKNOWN', observation: 'UNKNOWN' };
      }
      if (row.purpose !== PURPOSE) {
        return { ok: false, reason: 'GATE_UNKNOWN', observation: 'UNKNOWN' };
      }
      if (row.state === 'INACTIVE') {
        return { ok: true, observation: 'INACTIVE' };
      }
      if (row.state === 'ACTIVE') {
        if (row.expiresAt === null || row.expiresAt.getTime() <= dbNow.getTime()) {
          return { ok: true, observation: 'EXPIRED' };
        }
        if (row.holderId === null || row.acquiredAt === null || row.authorizedWindowMs === null) {
          return { ok: false, reason: 'GATE_UNKNOWN', observation: 'UNKNOWN' };
        }
        return {
          ok: true,
          observation: 'ACTIVE',
          grant: this.toGrant({
            holderId: row.holderId,
            fenceGeneration: row.fenceGeneration,
            acquiredAt: row.acquiredAt,
            expiresAt: row.expiresAt,
            authorizedWindowMs: row.authorizedWindowMs,
            correlationId: row.correlationId ?? undefined,
          }),
        };
      }
      return { ok: false, reason: 'GATE_UNKNOWN', observation: 'UNKNOWN' };
    } catch {
      return { ok: false, reason: 'GATE_UNKNOWN', observation: 'UNKNOWN' };
    }
  }

  async validate(grant: MigrationGateGrant): Promise<MigrationGateValidateResult> {
    try {
      const dbNow = await this.readDbNow(this.prisma);
      const shaped = classifyGrantShape(grant);
      if (!shaped.ok) {
        return {
          ok: false,
          reason: shaped.reason,
          observation: shaped.observation ?? 'UNKNOWN',
        };
      }
      const g = shaped.value;
      const row = await this.prisma.connectionMigrationGateLease.findUnique({
        where: { gateKey: GATE_KEY },
      });
      if (!row) {
        return { ok: false, reason: 'GATE_UNKNOWN', observation: 'UNKNOWN' };
      }
      if (row.gateKey !== g.gateKey) {
        return { ok: false, reason: 'GATE_KEY_MISMATCH', observation: 'UNKNOWN' };
      }
      if (row.purpose !== g.purpose || row.purpose !== PURPOSE) {
        return { ok: false, reason: 'GATE_PURPOSE_MISMATCH', observation: 'UNKNOWN' };
      }
      if (row.state === 'INACTIVE') {
        return { ok: false, reason: 'GATE_INACTIVE', observation: 'INACTIVE' };
      }
      if (row.expiresAt === null || row.expiresAt.getTime() <= dbNow.getTime()) {
        return { ok: false, reason: 'GATE_EXPIRED', observation: 'EXPIRED' };
      }
      if (row.holderId !== g.holderId) {
        return { ok: false, reason: 'GATE_OWNERSHIP_LOST', observation: 'OWNERSHIP_LOST' };
      }
      if (row.fenceGeneration !== g.fenceGeneration) {
        return { ok: false, reason: 'GATE_FENCE_MISMATCH', observation: 'OWNERSHIP_LOST' };
      }
      if (row.state !== 'ACTIVE') {
        return { ok: false, reason: 'GATE_UNKNOWN', observation: 'UNKNOWN' };
      }
      return { ok: true, grant: g, observation: 'ACTIVE' };
    } catch {
      return { ok: false, reason: 'GATE_UNKNOWN', observation: 'UNKNOWN' };
    }
  }

  /**
   * Same-txn CAS helper for future 04-D protected UPDATE (B-02 does not mutate Connection).
   * Returns true iff durable authority matches grant under DB NOW().
   */
  async assertDurableAuthorityCas(
    transaction: TransactionContext,
    grant: MigrationGateGrant,
  ): Promise<boolean> {
    const client = prismaClientForTransaction(transaction);
    const dbNow = await this.readDbNow(client);
    const shaped = classifyGrantShape(grant);
    if (!shaped.ok) return false;
    const g = shaped.value;
    const updated = await client.connectionMigrationGateLease.updateMany({
      where: {
        gateKey: GATE_KEY,
        purpose: PURPOSE,
        state: 'ACTIVE',
        holderId: g.holderId,
        fenceGeneration: g.fenceGeneration,
        expiresAt: { gt: dbNow },
      },
      data: {
        // Touch updatedAt only — no authority change; proves row matched CAS.
        heartbeatAt: dbNow,
      },
    });
    return updated.count === 1;
  }

  private mapHeartbeatMiss(
    row: LeaseRow | null,
    grant: MigrationGateGrant,
    dbNow: Date,
  ): { reason: MigrationGateReasonCode; observation?: MigrationGateObservation } {
    if (!row) return { reason: 'GATE_UNKNOWN', observation: 'UNKNOWN' };
    if (row.state === 'INACTIVE') return { reason: 'GATE_INACTIVE', observation: 'INACTIVE' };
    if (row.holderId !== grant.holderId) {
      return { reason: 'GATE_OWNERSHIP_LOST', observation: 'OWNERSHIP_LOST' };
    }
    if (row.fenceGeneration !== grant.fenceGeneration) {
      return { reason: 'GATE_FENCE_MISMATCH', observation: 'OWNERSHIP_LOST' };
    }
    if (row.expiresAt === null || row.expiresAt.getTime() <= dbNow.getTime()) {
      return { reason: 'GATE_EXPIRED', observation: 'EXPIRED' };
    }
    if (row.authorizedUntil !== null && row.authorizedUntil.getTime() <= dbNow.getTime()) {
      return { reason: 'GATE_MAX_WINDOW_EXCEEDED' };
    }
    return { reason: 'GATE_HEARTBEAT_REJECTED' };
  }

  private toGrant(input: {
    holderId: string;
    fenceGeneration: number;
    acquiredAt: Date;
    expiresAt: Date;
    authorizedWindowMs: number;
    correlationId?: string | null;
  }): MigrationGateGrant {
    const grant: MigrationGateGrant = Object.freeze({
      gateKey: GATE_KEY,
      purpose: PURPOSE,
      holderId: input.holderId,
      fenceGeneration: input.fenceGeneration,
      acquiredAt: input.acquiredAt.toISOString(),
      expiresAt: input.expiresAt.toISOString(),
      authorizedWindowMs: input.authorizedWindowMs,
      ...(input.correlationId ? { correlationId: input.correlationId } : {}),
    });
    // Ensure authorizedUntil coherence for callers using pure helpers.
    void computeAuthorizedUntilIso(grant);
    return grant;
  }

  private async readDbNow(client: Prisma.TransactionClient | PrismaService): Promise<Date> {
    const rows = await client.$queryRaw<Array<{ now: Date }>>`SELECT NOW() AS now`;
    const now = rows[0]?.now;
    if (!(now instanceof Date) || Number.isNaN(now.getTime())) {
      throw new Error('migration-gate: failed to read DB NOW()');
    }
    return now;
  }

  private async lockSingleton(client: Prisma.TransactionClient): Promise<void> {
    await client.$queryRaw(
      Prisma.sql`SELECT 1 FROM connection_migration_gate_leases WHERE gate_key = ${GATE_KEY} FOR UPDATE`,
    );
  }

  private async safeAudit(
    input: {
      outcome: Parameters<ConnectionMigrationGateAudit['record']>[0]['outcome'];
      actorId: string;
      payload: Readonly<Record<string, unknown>>;
      correlationId?: string;
    },
    tx: TransactionContext,
  ): Promise<void> {
    await this.audit.record(input, tx);
  }
}
