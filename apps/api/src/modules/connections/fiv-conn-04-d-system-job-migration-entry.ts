/**
 * FIV-CONN-04-D / P-D-02 + Stage 3 + VMP-1 + Stage 4 PS-A — Conn04SystemJobMigrationEntry.
 *
 * Trusted D orchestration boundary for SYSTEM_JOB ↔ B-04.
 * Constructs the ratified identity internally. Does NOT accept caller-supplied
 * actor identity fields or raw privileged context from callers.
 * Does NOT UPDATE Connection.environment, expose HTTP, or activate cron.
 * Stage 3 attaches write-unit authority/CAS scaffolding only (no backfill loop).
 * VMP-1: injects Vault metadata port and exposes a callable INTERNAL lookup seam
 * with Connection-derived binding + blank-ID zero-I/O guards.
 * Stage 4 (D-CONN04-FULL-D-IA-S4-EXEC / PS-A): per-attempt freshness proof path
 * Trusted Connection → VMP-1 → typed occupancy → C → existing B-04 only.
 * Must remain unexported from ConnectionsModule until a separately authorized consumer exists.
 */

import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../../storage/prisma/prisma.module';
import {
  PrismaTransactionService,
  type TransactionContext,
} from '../../storage/prisma/prisma-transaction.service';
import {
  FIV_CONN_04_D_VAULT_METADATA_PORT,
  type FivConn04DVaultMetadataLookupResult,
  type FivConn04DVaultMetadataPort,
  type FivConn04DVaultMetadataView,
} from '../secret-vault/fiv-conn-04-d-vault-metadata.port';
import {
  Conn04MigrationBoundaryService,
  type Conn04BoundaryFail,
  type Conn04ResumeResult,
  type Conn04StartResult,
  type Conn04WriteProofResult,
} from './conn04-migration-boundary.service';
import { FivConn04DEnvironmentBackfillWrite } from './fiv-conn-04-d-environment-backfill-write';
import { resolveFivConn04DLiveSlotOccupancy } from './fiv-conn-04-d-live-slot-occupancy';
import { buildFivConn04DSystemJobActor } from './fiv-conn-04-d-system-job-identity';
import {
  classifyFivConn04LiveConnection,
  type FivConn04LiveClassificationResult,
  type FivConn04LiveConnectionInput,
  type FivConn04LiveSlotOccupancy,
  type FivConn04LiveVaultMetaInput,
} from './fiv-conn-04-live-classifier';
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

/** Stage 4 attempt stop reasons (distinct fail-closed stages). */
export type Conn04Stage4AttemptStopReason =
  | 'CONNECTION_NOT_FOUND'
  | 'CONNECTION_UNAVAILABLE'
  | 'PRE_PORT_INVALID_IDENTIFIERS'
  | 'VAULT_NOT_FOUND'
  | 'VAULT_UNAVAILABLE'
  | 'VAULT_INVALID'
  | 'C_NOT_ELIGIBLE'
  | 'B04_DENIED'
  | 'B04_UNKNOWN';

export type Conn04Stage4AttemptSuccess = Readonly<{
  ok: true;
  connection: FivConn04LiveConnectionInput;
  vaultMetadata: FivConn04LiveVaultMetaInput;
  occupancy: FivConn04LiveSlotOccupancy;
  classification: FivConn04LiveClassificationResult;
  writeProof: Conn04WriteProofResult & { ok: true };
}>;

export type Conn04Stage4AttemptFailure = Readonly<{
  ok: false;
  stop: Conn04Stage4AttemptStopReason;
  connection?: FivConn04LiveConnectionInput;
  vaultLookup?: FivConn04DVaultMetadataLookupResult;
  occupancy?: FivConn04LiveSlotOccupancy;
  classification?: FivConn04LiveClassificationResult;
  writeProof?: Conn04WriteProofResult;
}>;

export type Conn04Stage4AttemptResult = Conn04Stage4AttemptSuccess | Conn04Stage4AttemptFailure;

export type Conn04Stage4AttemptInput = Readonly<{
  /** Persisted Connection id to load/re-read for this attempt. */
  connectionId: string;
  /**
   * Optional workspace binding. When provided, the loaded Connection must match
   * this workspaceId (same-tenant binding). Never used as a vaultSecretId override.
   */
  workspaceId?: string;
  /** Existing B-04 lease grant for write-authority proof after eligibility. */
  grant: MigrationGateGrant;
}>;

type TrustedConnectionLoadResult =
  | Readonly<{ ok: true; connection: FivConn04LiveConnectionInput }>
  | Readonly<{ ok: false; stop: 'CONNECTION_NOT_FOUND' | 'CONNECTION_UNAVAILABLE' }>;

@Injectable()
export class Conn04SystemJobMigrationEntry {
  constructor(
    private readonly boundary: Conn04MigrationBoundaryService,
    private readonly writeUnit: FivConn04DEnvironmentBackfillWrite,
    private readonly transactions: PrismaTransactionService,
    @Inject(FIV_CONN_04_D_VAULT_METADATA_PORT)
    private readonly vaultMetadata: FivConn04DVaultMetadataPort,
    private readonly prisma: PrismaService,
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

  /**
   * Stage 4 PS-A — per-attempt freshness / write-authority proof path.
   *
   * Order (mandatory):
   * 1) Trusted persisted Connection load/re-read (same-record binding)
   * 2) Connection-derived ID validation (blank → zero Port/metadata I/O)
   * 3) Fresh VMP-1 Vault metadata lookup
   * 4) Typed module-local D-path occupancy
   * 5) C reclassification with complete trusted inputs
   * 6) Existing B-04 proveWriteAuthority only if C is ELIGIBLE_LIVE
   *
   * Does NOT UPDATE Connection.environment, run Full-D backfill, or treat
   * Preflight / Nest DI as authorization.
   */
  async proveStage4AttemptWriteAuthority(
    input: Conn04Stage4AttemptInput,
  ): Promise<Conn04Stage4AttemptResult> {
    const loaded = await this.loadTrustedConnectionForAttempt(
      input.connectionId,
      input.workspaceId,
    );
    if (!loaded.ok) {
      return Object.freeze({ ok: false, stop: loaded.stop });
    }
    const connection = loaded.connection;

    // Pre-Port identifier validation — zero Port / metadata repository calls.
    if (!isNonBlankId(connection.workspaceId) || !isNonBlankId(connection.vaultSecretId)) {
      return Object.freeze({
        ok: false,
        stop: 'PRE_PORT_INVALID_IDENTIFIERS',
        connection,
      });
    }

    const vaultLookup = await this.lookupVaultMetadataForConnection({
      workspaceId: connection.workspaceId,
      vaultSecretId: connection.vaultSecretId,
    });
    if (!vaultLookup.ok) {
      const stop: Conn04Stage4AttemptStopReason =
        vaultLookup.reason === 'NOT_FOUND'
          ? 'VAULT_NOT_FOUND'
          : vaultLookup.reason === 'UNAVAILABLE'
            ? 'VAULT_UNAVAILABLE'
            : 'VAULT_INVALID';
      return Object.freeze({
        ok: false,
        stop,
        connection,
        vaultLookup,
      });
    }

    const vaultMetadata = toLiveVaultMeta(vaultLookup.metadata);
    const occupancy = await resolveFivConn04DLiveSlotOccupancy(this.prisma, connection);
    const classification = classifyFivConn04LiveConnection(connection, vaultMetadata, occupancy);

    if (!classification.eligibleLive) {
      return Object.freeze({
        ok: false,
        stop: 'C_NOT_ELIGIBLE',
        connection,
        vaultLookup,
        occupancy,
        classification,
      });
    }

    const writeProof = await this.proveWriteAuthority({ grant: input.grant });
    if (!writeProof.ok) {
      return Object.freeze({
        ok: false,
        stop: writeProof.reason === 'GATE_UNKNOWN' ? 'B04_UNKNOWN' : 'B04_DENIED',
        connection,
        vaultLookup,
        occupancy,
        classification,
        writeProof,
      });
    }

    return Object.freeze({
      ok: true,
      connection,
      vaultMetadata,
      occupancy,
      classification,
      writeProof,
    });
  }

  /**
   * Trusted persisted Connection load/re-read for a Stage 4 attempt.
   * Derives all classifier fields from the same loaded row. Does not accept
   * caller-supplied field overrides or cross-Connection mixing.
   */
  private async loadTrustedConnectionForAttempt(
    connectionId: string,
    workspaceId: string | undefined,
  ): Promise<TrustedConnectionLoadResult> {
    if (!isNonBlankId(connectionId)) {
      return Object.freeze({ ok: false, stop: 'CONNECTION_NOT_FOUND' });
    }
    if (workspaceId !== undefined && !isNonBlankId(workspaceId)) {
      return Object.freeze({ ok: false, stop: 'CONNECTION_NOT_FOUND' });
    }

    try {
      const row = await this.prisma.connectionRecord.findFirst({
        where: {
          id: connectionId.trim(),
          ...(workspaceId !== undefined ? { workspaceId: workspaceId.trim() } : {}),
        },
        select: {
          id: true,
          workspaceId: true,
          provider: true,
          connectionType: true,
          environment: true,
          vaultSecretId: true,
          status: true,
        },
      });
      if (!row) {
        return Object.freeze({ ok: false, stop: 'CONNECTION_NOT_FOUND' });
      }
      return Object.freeze({
        ok: true,
        connection: Object.freeze({
          id: row.id,
          workspaceId: row.workspaceId,
          provider: row.provider,
          connectionType: row.connectionType,
          environment: row.environment,
          vaultSecretId: row.vaultSecretId,
          status: row.status,
        }),
      });
    } catch {
      return Object.freeze({ ok: false, stop: 'CONNECTION_UNAVAILABLE' });
    }
  }
}

function toLiveVaultMeta(view: FivConn04DVaultMetadataView): FivConn04LiveVaultMetaInput {
  return Object.freeze({
    id: view.id,
    workspaceId: view.workspaceId,
    purpose: view.purpose,
    state: view.state,
  });
}
