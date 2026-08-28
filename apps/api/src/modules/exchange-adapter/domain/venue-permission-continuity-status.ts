/**
 * W4-E05-c — Process-local Venue Permission Verification continuity outcomes.
 *
 * Records hydrate integrity so Operational Continuity (W4-E05-d) can project readiness
 * without a second persistence owner or recovery engine.
 */

import type { VenuePermissionVerificationRecoveryDiagnostics } from './venue-permission-restart-recovery';
import { W4_E05_C_VENUE_PERMISSION_RECOVERY_OWNER } from './venue-permission-restart-recovery';

export type VenuePermissionRecoveryOutcome = 'ready' | 'unavailable';

export type VenuePermissionOwnerReadiness = 'ready' | 'unavailable' | 'degraded';

export type VenuePermissionContinuityRecord = Readonly<{
  owner: typeof W4_E05_C_VENUE_PERMISSION_RECOVERY_OWNER;
  outcome: VenuePermissionRecoveryOutcome;
  ownerReadiness: VenuePermissionOwnerReadiness;
  integrityVerified: boolean;
  integrityFailure: boolean;
  reason?: string;
  diagnostics: VenuePermissionVerificationRecoveryDiagnostics | null;
  recoveryStartedAt: string | null;
  recoveryCompletedAt: string | null;
  recoveryDurationMs: number | null;
}>;

let recoveryStartedAtMs: number | null = null;
let record: VenuePermissionContinuityRecord | null = null;

export function recordVenuePermissionRecoveryStart(atMs: number = Date.now()): void {
  recoveryStartedAtMs = atMs;
  record = Object.freeze({
    owner: W4_E05_C_VENUE_PERMISSION_RECOVERY_OWNER,
    outcome: 'unavailable',
    ownerReadiness: 'ready',
    integrityVerified: false,
    integrityFailure: false,
    reason: 'recovering',
    diagnostics: null,
    recoveryStartedAt: new Date(atMs).toISOString(),
    recoveryCompletedAt: null,
    recoveryDurationMs: null,
  });
}

export function recordVenuePermissionRecoverySuccess(input: {
  diagnostics: VenuePermissionVerificationRecoveryDiagnostics;
  reason?: string;
  ownerReadiness?: VenuePermissionOwnerReadiness;
  completedAtMs?: number;
}): void {
  const completedAtMs = input.completedAtMs ?? Date.now();
  const startedAtMs = recoveryStartedAtMs ?? completedAtMs;
  record = Object.freeze({
    owner: W4_E05_C_VENUE_PERMISSION_RECOVERY_OWNER,
    outcome: 'ready',
    ownerReadiness: input.ownerReadiness ?? 'ready',
    integrityVerified: true,
    integrityFailure: false,
    reason: input.reason ?? 'hydrate-ok',
    diagnostics: input.diagnostics,
    recoveryStartedAt: new Date(startedAtMs).toISOString(),
    recoveryCompletedAt: new Date(completedAtMs).toISOString(),
    recoveryDurationMs: Math.max(0, completedAtMs - startedAtMs),
  });
}

export function recordVenuePermissionRecoveryFailure(input: {
  reason: string;
  ownerReadiness?: VenuePermissionOwnerReadiness;
  completedAtMs?: number;
}): void {
  const completedAtMs = input.completedAtMs ?? Date.now();
  const startedAtMs = recoveryStartedAtMs ?? completedAtMs;
  record = Object.freeze({
    owner: W4_E05_C_VENUE_PERMISSION_RECOVERY_OWNER,
    outcome: 'unavailable',
    ownerReadiness: input.ownerReadiness ?? 'unavailable',
    integrityVerified: false,
    integrityFailure: false,
    reason: input.reason,
    diagnostics: null,
    recoveryStartedAt: new Date(startedAtMs).toISOString(),
    recoveryCompletedAt: new Date(completedAtMs).toISOString(),
    recoveryDurationMs: Math.max(0, completedAtMs - startedAtMs),
  });
}

/** Integrity failure honesty — Degraded, never fabricates Ready. */
export function recordVenuePermissionIntegrityFailure(reason: string): void {
  if (!record) {
    recordVenuePermissionRecoveryStart();
  }
  record = Object.freeze({
    ...record!,
    outcome: record!.outcome === 'unavailable' ? 'unavailable' : 'ready',
    integrityVerified: false,
    integrityFailure: true,
    reason,
  });
}

export function getVenuePermissionContinuityRecord(): VenuePermissionContinuityRecord | null {
  return record;
}

export function isVenuePermissionRecovering(): boolean {
  return record !== null && record.recoveryCompletedAt === null;
}

/** Test / process isolation helper. */
export function resetVenuePermissionContinuity(): void {
  recoveryStartedAtMs = null;
  record = null;
}
