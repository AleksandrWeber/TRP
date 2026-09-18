/**
 * FIV-CONN-04-B-04 — Privileged internal 04-D integration boundary façade.
 *
 * Thin composition over MigrationGatePort + MigrationGateDurableAuthority.
 * NOT a second lease/fence SoT. Does NOT UPDATE Connection.environment,
 * mutate Vault, perform venue I/O, or expose public HTTP.
 *
 * CHECK-THEN-SAVE ALONE IS FORBIDDEN for write authority.
 * assertWriteAuthority MUST use caller-provided TransactionContext (IMPL-COND-B04-02).
 */

import { Inject, Injectable } from '@nestjs/common';
import type { TransactionContext } from '../../storage/prisma/prisma-transaction.service';
import {
  MIGRATION_GATE_PURPOSE_FIV_CONN_04_MIGRATION_BACKFILL,
  classifyGrantShape,
  isPrivilegedActorContext,
  type MigrationGateGrant,
  type MigrationGateObservation,
  type MigrationGateReasonCode,
  type PrivilegedActorContext,
} from './migration-gate';
import {
  MIGRATION_GATE_DURABLE_AUTHORITY,
  type MigrationGateDurableAuthority,
} from './migration-gate-durable-authority.port';
import {
  MIGRATION_GATE_PORT,
  type MigrationGateAcquireResult,
  type MigrationGateHeartbeatResult,
  type MigrationGatePort,
  type MigrationGateReleaseResult,
  type MigrationGateValidateResult,
} from './migration-gate.port';

export type Conn04BoundaryFail = Readonly<{
  ok: false;
  reason: MigrationGateReasonCode;
  observation?: MigrationGateObservation;
}>;

export type Conn04StartResult =
  | Readonly<{ ok: true; grant: MigrationGateGrant }>
  | Conn04BoundaryFail;

export type Conn04ResumeResult =
  | Readonly<{ ok: true; grant: MigrationGateGrant; observation: 'ACTIVE' }>
  | Conn04BoundaryFail;

export type Conn04WriteProofResult =
  | Readonly<{ ok: true }>
  | Conn04BoundaryFail;

function refuse(
  reason: MigrationGateReasonCode,
  observation?: MigrationGateObservation,
): Conn04BoundaryFail {
  return observation === undefined ? { ok: false, reason } : { ok: false, reason, observation };
}

@Injectable()
export class Conn04MigrationBoundaryService {
  constructor(
    @Inject(MIGRATION_GATE_PORT)
    private readonly migrationGate: MigrationGatePort,
    @Inject(MIGRATION_GATE_DURABLE_AUTHORITY)
    private readonly durableAuthority: MigrationGateDurableAuthority,
  ) {}

  /**
   * PRIMARY start — durable acquire. observe()-only MUST NEVER succeed here.
   */
  async start(input: {
    actor: PrivilegedActorContext;
    correlationId?: string;
    requestedTtlMs?: number;
  }): Promise<Conn04StartResult> {
    if (!isPrivilegedActorContext(input.actor)) {
      return refuse('GATE_UNAUTHORIZED');
    }
    const result: MigrationGateAcquireResult = await this.migrationGate.acquire({
      purpose: MIGRATION_GATE_PURPOSE_FIV_CONN_04_MIGRATION_BACKFILL,
      actor: input.actor,
      ...(input.correlationId !== undefined ? { correlationId: input.correlationId } : {}),
      ...(input.requestedTtlMs !== undefined ? { requestedTtlMs: input.requestedTtlMs } : {}),
    });
    if (!result.ok) {
      return refuse(result.reason, result.observation);
    }
    return { ok: true, grant: result.grant };
  }

  /**
   * Resume / continue — validate only. MUST NOT silently acquire.
   */
  async resume(input: {
    actor: PrivilegedActorContext;
    grant: MigrationGateGrant;
  }): Promise<Conn04ResumeResult> {
    if (!isPrivilegedActorContext(input.actor)) {
      return refuse('GATE_UNAUTHORIZED');
    }
    const shaped = classifyGrantShape(input.grant);
    if (!shaped.ok) {
      return refuse(shaped.reason, shaped.observation);
    }
    const result: MigrationGateValidateResult = await this.migrationGate.validate(shaped.value);
    if (!result.ok) {
      return refuse(result.reason, result.observation);
    }
    return { ok: true, grant: result.grant, observation: 'ACTIVE' };
  }

  async heartbeat(input: {
    actor: PrivilegedActorContext;
    grant: MigrationGateGrant;
    proposedExpiresAt: string;
  }): Promise<MigrationGateHeartbeatResult> {
    if (!isPrivilegedActorContext(input.actor)) {
      return { ok: false, reason: 'GATE_UNAUTHORIZED' };
    }
    const shaped = classifyGrantShape(input.grant);
    if (!shaped.ok) {
      return { ok: false, reason: shaped.reason, observation: shaped.observation };
    }
    return this.migrationGate.heartbeat({
      grant: shaped.value,
      actor: input.actor,
      proposedExpiresAt: input.proposedExpiresAt,
    });
  }

  async release(input: {
    actor: PrivilegedActorContext;
    grant: MigrationGateGrant;
  }): Promise<MigrationGateReleaseResult> {
    if (!isPrivilegedActorContext(input.actor)) {
      return { ok: false, reason: 'GATE_UNAUTHORIZED' };
    }
    const shaped = classifyGrantShape(input.grant);
    if (!shaped.ok) {
      return { ok: false, reason: shaped.reason, observation: shaped.observation };
    }
    return this.migrationGate.release({
      grant: shaped.value,
      actor: input.actor,
    });
  }

  /**
   * Durable write-authority proof for future 04-D (same caller txn).
   * Does NOT UPDATE Connection.environment.
   * observe()/validate() alone are NEVER sufficient (IMPL-COND-B04-04).
   */
  async assertWriteAuthority(
    transaction: TransactionContext,
    grant: MigrationGateGrant,
  ): Promise<Conn04WriteProofResult> {
    const shaped = classifyGrantShape(grant);
    if (!shaped.ok) {
      return refuse(shaped.reason, shaped.observation ?? 'UNKNOWN');
    }
    try {
      const ok = await this.durableAuthority.assertDurableAuthorityCas(
        transaction,
        shaped.value,
      );
      if (!ok) {
        return refuse('GATE_FENCE_MISMATCH', 'OWNERSHIP_LOST');
      }
      return { ok: true };
    } catch {
      return refuse('GATE_UNKNOWN', 'UNKNOWN');
    }
  }
}
