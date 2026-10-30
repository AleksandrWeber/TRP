/**
 * FIV-CONN-04-D / P-D-02 + Stage 3 + VMP-1 — Conn04SystemJobMigrationEntry (Option A).
 *
 * Trusted D orchestration boundary for SYSTEM_JOB ↔ B-04.
 * Constructs the ratified identity internally. Does NOT accept caller-supplied
 * actor identity fields or raw privileged context from callers.
 * Does NOT UPDATE Connection.environment, expose HTTP, or activate cron.
 * Stage 3 attaches write-unit authority/CAS scaffolding only (no backfill loop).
 * VMP-1: injects Vault metadata port and exposes a callable INTERNAL lookup seam
 * with Connection-derived binding + blank-ID zero-I/O guards (not Stage 4 loop).
 * Must remain unexported from ConnectionsModule until a separately authorized consumer exists.
 */

import { Inject, Injectable } from '@nestjs/common';
import {
  PrismaTransactionService,
  type TransactionContext,
} from '../../storage/prisma/prisma-transaction.service';
import {
  FIV_CONN_04_D_VAULT_METADATA_PORT,
  type FivConn04DVaultMetadataLookupResult,
  type FivConn04DVaultMetadataPort,
} from '../secret-vault/fiv-conn-04-d-vault-metadata.port';
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

function isNonBlankId(value: string | null | undefined): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

/** Connection-derived binding inputs for the internal Vault metadata seam (same Connection only). */
type Conn04VaultMetadataConnectionBinding = Readonly<{
  workspaceId: string;
  vaultSecretId: string | null;
}>;

@Injectable()
export class Conn04SystemJobMigrationEntry {
  constructor(
    private readonly boundary: Conn04MigrationBoundaryService,
    private readonly writeUnit: FivConn04DEnvironmentBackfillWrite,
    private readonly transactions: PrismaTransactionService,
    @Inject(FIV_CONN_04_D_VAULT_METADATA_PORT)
    private readonly vaultMetadata: FivConn04DVaultMetadataPort,
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

  /**
   * Callable INTERNAL Entry lookup seam (VMP-1 / OQ-VMP-04).
   * Derives `{ workspaceId, vaultSecretId }` from the same Connection only.
   * Blank-ID validation before any port/repository I/O. Propagates fail-closed
   * NOT_FOUND / UNAVAILABLE / INVALID. Does NOT run Stage 4 freshness / occupancy / C
   * orchestration, env UPDATE, or backfill.
   */
  async lookupVaultMetadataForConnection(
    connection: Conn04VaultMetadataConnectionBinding,
  ): Promise<FivConn04DVaultMetadataLookupResult> {
    const workspaceId = connection.workspaceId;
    const vaultSecretId = connection.vaultSecretId;
    if (!isNonBlankId(workspaceId) || !isNonBlankId(vaultSecretId)) {
      return Object.freeze({ ok: false, reason: 'INVALID' });
    }
    return this.vaultMetadata.lookupExact({
      workspaceId: workspaceId.trim(),
      vaultSecretId: vaultSecretId.trim(),
    });
  }
}
