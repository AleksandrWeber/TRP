/**
 * FIV-CONN-04-D / P-D-02 + Stage 3 — Conn04SystemJobMigrationEntry (Option A).
 *
 * Trusted D orchestration boundary for SYSTEM_JOB ↔ B-04.
 * Constructs the ratified identity internally. Does NOT accept caller-supplied
 * actor identity fields or raw privileged context from callers.
 * Does NOT UPDATE Connection.environment, expose HTTP, or activate cron.
 * Stage 3 attaches write-unit authority/CAS scaffolding only (no backfill loop).
 * Must remain unexported from ConnectionsModule until a separately authorized consumer exists.
 */

import { Injectable } from '@nestjs/common';
import {
  PrismaTransactionService,
  type TransactionContext,
} from '../../storage/prisma/prisma-transaction.service';
import {
  Conn04MigrationBoundaryService,
  type Conn04BoundaryFail,
  type Conn04ResumeResult,
  type Conn04StartResult,
  type Conn04WriteProofResult,
} from './conn04-migration-boundary.service';
import { FivConn04DEnvironmentBackfillWrite } from './fiv-conn-04-d-environment-backfill-write';
import { buildFivConn04DSystemJobActor } from './fiv-conn-04-d-system-job-identity';
import type { MigrationGateGrant } from './migration-gate';
import type {
  MigrationGateHeartbeatResult,
  MigrationGateReleaseResult,
} from './migration-gate.port';

function refuseUnauthorized(): Conn04BoundaryFail {
  return { ok: false, reason: 'GATE_UNAUTHORIZED' };
}

function refuseUnknown(): Conn04WriteProofResult {
  return { ok: false, reason: 'GATE_UNKNOWN', observation: 'UNKNOWN' };
}

@Injectable()
export class Conn04SystemJobMigrationEntry {
  constructor(
    private readonly boundary: Conn04MigrationBoundaryService,
    private readonly writeUnit: FivConn04DEnvironmentBackfillWrite,
    private readonly transactions: PrismaTransactionService,
  ) {}

  /**
   * PRIMARY start — constructs canonical SYSTEM_JOB identity then delegates to B-04.
   */
  async start(input?: {
    correlationId?: string;
    requestedTtlMs?: number;
  }): Promise<Conn04StartResult> {
    let actor;
    try {
      actor = buildFivConn04DSystemJobActor(
        input?.correlationId !== undefined ? { correlationId: input.correlationId } : undefined,
      );
    } catch {
      return refuseUnauthorized();
    }
    return this.boundary.start({
      actor,
      ...(input?.correlationId !== undefined ? { correlationId: input.correlationId } : {}),
      ...(input?.requestedTtlMs !== undefined ? { requestedTtlMs: input.requestedTtlMs } : {}),
    });
  }

  async resume(input: { grant: MigrationGateGrant }): Promise<Conn04ResumeResult> {
    let actor;
    try {
      actor = buildFivConn04DSystemJobActor();
    } catch {
      return refuseUnauthorized();
    }
    return this.boundary.resume({ actor, grant: input.grant });
  }

  async heartbeat(input: {
    grant: MigrationGateGrant;
    proposedExpiresAt: string;
  }): Promise<MigrationGateHeartbeatResult> {
    let actor;
    try {
      actor = buildFivConn04DSystemJobActor();
    } catch {
      return { ok: false, reason: 'GATE_UNAUTHORIZED' };
    }
    return this.boundary.heartbeat({
      actor,
      grant: input.grant,
      proposedExpiresAt: input.proposedExpiresAt,
    });
  }

  async release(input: { grant: MigrationGateGrant }): Promise<MigrationGateReleaseResult> {
    let actor;
    try {
      actor = buildFivConn04DSystemJobActor();
    } catch {
      return { ok: false, reason: 'GATE_UNAUTHORIZED' };
    }
    return this.boundary.release({ actor, grant: input.grant });
  }

  /**
   * Stage 3 scaffold — open a short txn and prove lease write authority via the
   * write-unit (`assertWriteAuthority` / fence CAS). Fail-closed on deny/miss/throw.
   * Does NOT UPDATE Connection.environment and does NOT run backfill orchestration.
   */
  async proveWriteAuthority(input: { grant: MigrationGateGrant }): Promise<Conn04WriteProofResult> {
    try {
      return await this.transactions.run((txn: TransactionContext) =>
        this.writeUnit.assertWriteAuthorityInTransaction(txn, input.grant),
      );
    } catch {
      return refuseUnknown();
    }
  }
}
