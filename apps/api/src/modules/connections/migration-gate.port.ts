/**
 * FIV-CONN-04-B-01 — MigrationGatePort (implementation-neutral contract).
 *
 * Production durable adapter is owned by B-02.
 * This module has no Prisma, Vault, or network dependencies.
 *
 * Protected mutation (04-D) must ultimately use:
 *   valid gate authority + current fencing + same-transaction CAS.
 * CHECK-THEN-SAVE ALONE IS FORBIDDEN.
 */

import type {
  MigrationGateGrant,
  MigrationGateObservation,
  MigrationGatePurpose,
  MigrationGateReasonCode,
  PrivilegedActorContext,
} from './migration-gate';

export const MIGRATION_GATE_PORT = Symbol('MIGRATION_GATE_PORT');

export type MigrationGateAcquireInput = Readonly<{
  purpose: MigrationGatePurpose;
  actor: PrivilegedActorContext;
  correlationId?: string;
  /** Optional TTL request; must be ≤ authorizedWindowMs / max 4h (B-02 enforces DB time). */
  requestedTtlMs?: number;
}>;

export type MigrationGateAcquireResult =
  | Readonly<{ ok: true; grant: MigrationGateGrant }>
  | Readonly<{
      ok: false;
      reason: MigrationGateReasonCode;
      observation?: MigrationGateObservation;
    }>;

export type MigrationGateReleaseInput = Readonly<{
  grant: MigrationGateGrant;
  actor: PrivilegedActorContext;
}>;

export type MigrationGateReleaseResult =
  | Readonly<{ ok: true; observation: 'INACTIVE' | 'EXPIRED' }>
  | Readonly<{
      ok: false;
      reason: MigrationGateReasonCode;
      observation?: MigrationGateObservation;
    }>;

export type MigrationGateHeartbeatInput = Readonly<{
  grant: MigrationGateGrant;
  actor: PrivilegedActorContext;
  /** Proposed new expiresAt (ISO-8601); must not exceed authorizedUntil. */
  proposedExpiresAt: string;
}>;

export type MigrationGateHeartbeatResult =
  | Readonly<{ ok: true; grant: MigrationGateGrant }>
  | Readonly<{
      ok: false;
      reason: MigrationGateReasonCode;
      observation?: MigrationGateObservation;
    }>;

/**
 * Non-authoritative observation of durable SoT.
 * Must not be treated as permission by itself.
 * Unreadable / absent SoT → UNKNOWN (DENY).
 */
export type MigrationGateObservationResult =
  | Readonly<{
      ok: true;
      observation: MigrationGateObservation;
      grant?: MigrationGateGrant;
      reason?: MigrationGateReasonCode;
    }>
  | Readonly<{
      ok: false;
      reason: MigrationGateReasonCode;
      observation: 'UNKNOWN';
    }>;

export type MigrationGateValidateResult =
  | Readonly<{ ok: true; grant: MigrationGateGrant; observation: 'ACTIVE' }>
  | Readonly<{
      ok: false;
      reason: MigrationGateReasonCode;
      observation: MigrationGateObservation;
    }>;

/**
 * Nest / application port for migration gate lifecycle.
 *
 * Method names map to the approved operations:
 * - acquire  ≡ acquireMigrationGate
 * - release  ≡ releaseMigrationGate
 * - heartbeat ≡ heartbeatMigrationGate
 * - observe  ≡ observeMigrationGate
 * - validate ≡ validateMigrationGate
 *
 * Acquire: privileged actor + correct purpose; on existing hold → CONTENTION
 * (no soft re-acquire / wait / queue / blind retry).
 *
 * Release: matching holderId + fenceGeneration; stale owner must not clear newer authority.
 *
 * Heartbeat: ACTIVE + owner + fence; must not resurrect expired; must not exceed
 * acquiredAt + authorizedWindowMs.
 *
 * Observe: maps durable SoT; read failure → UNKNOWN.
 *
 * Validate: grant vs durable SoT; grant alone never authorizes 04-D write without CAS.
 */
export interface MigrationGatePort {
  acquire(input: MigrationGateAcquireInput): Promise<MigrationGateAcquireResult>;
  release(input: MigrationGateReleaseInput): Promise<MigrationGateReleaseResult>;
  heartbeat(input: MigrationGateHeartbeatInput): Promise<MigrationGateHeartbeatResult>;
  observe(): Promise<MigrationGateObservationResult>;
  validate(grant: MigrationGateGrant): Promise<MigrationGateValidateResult>;
}
