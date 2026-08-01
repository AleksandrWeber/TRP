import { randomUUID } from 'node:crypto';

/**
 * US293 — Minimal durable Recovery Incident (safety artifact only).
 * Provisional pending E19 Safety Incident productization (ADL-013).
 * Not a Session status and not a RecoveryPhase.
 * RecoveryState may reference Incident; Incident must not own RecoveryState.
 */
export const RECOVERY_INCIDENT_SCHEMA_VERSION = 1;

export const RECOVERY_INCIDENT_STATUS_OPEN = 'OPEN' as const;

export type RecoveryIncidentStatus = typeof RECOVERY_INCIDENT_STATUS_OPEN;

/**
 * Approved ambiguity / corruption classes (E17 §4.5 / §7) — no E19 product taxonomy.
 */
export type RecoveryIncidentReasonClass =
  | 'reconciliation_ambiguity'
  | 'checkpoint_corruption'
  | 'lease_acquire_impossible'
  | 'resume_blocked_ambiguity'
  | 'completion_blocked_ambiguity'
  | 'stopping_ambiguity'
  | 'split_brain_lease'
  | 'data_corruption'
  | 'recovery_unrecoverable';

export type RecoveryIncident = Readonly<{
  incidentId: string;
  workspaceId: string;
  sessionId: string;
  /** Correlation only — not RecoveryState lifecycle authority. */
  recoveryId: string | null;
  recoveryAttempt: number | null;
  reasonClass: RecoveryIncidentReasonClass;
  /** Human/diagnostic reason; must not contain secrets. */
  failureReason: string;
  status: RecoveryIncidentStatus;
  /** Always true for US293 open Incidents — fail-closed block. */
  blocking: true;
  createdAt: string;
  schemaVersion: number;
}>;

export type CreateRecoveryIncidentInput = Readonly<{
  workspaceId: string;
  sessionId: string;
  recoveryId?: string | null;
  recoveryAttempt?: number | null;
  reasonClass: RecoveryIncidentReasonClass;
  failureReason: string;
  createdAt: string;
  /** Idempotent re-entry: reuse existing open Incident identity when provided. */
  incidentId?: string;
}>;

/**
 * Pure factory for a minimal Recovery Incident.
 * Does not resolve, clear, or reference RecoveryState as lifecycle authority.
 */
export function createRecoveryIncident(input: CreateRecoveryIncidentInput): RecoveryIncident {
  const failureReason = required(input.failureReason, 'failureReason');
  assertNoSecrets(failureReason);

  return Object.freeze({
    incidentId: input.incidentId?.trim() ? input.incidentId.trim() : randomUUID(),
    workspaceId: required(input.workspaceId, 'workspaceId'),
    sessionId: required(input.sessionId, 'sessionId'),
    recoveryId: input.recoveryId?.trim() ? input.recoveryId.trim() : null,
    recoveryAttempt: input.recoveryAttempt ?? null,
    reasonClass: input.reasonClass,
    failureReason,
    status: RECOVERY_INCIDENT_STATUS_OPEN,
    blocking: true as const,
    createdAt: input.createdAt,
    schemaVersion: RECOVERY_INCIDENT_SCHEMA_VERSION,
  });
}

function required(value: string, label: string): string {
  const result = value.trim();
  if (result === '') throw new Error(`${label} is required`);
  return result;
}

/** Soft hygiene guard — reject obvious secret-shaped payloads. */
function assertNoSecrets(payload: string): void {
  if (/password\s*=|api[_-]?key\s*=|secret\s*=|Bearer\s+[A-Za-z0-9._-]+/i.test(payload)) {
    throw new Error('recovery incident payload must not contain secrets');
  }
}
