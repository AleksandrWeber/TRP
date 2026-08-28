/**
 * W3-O05-d — Process-local Monitoring & Security Health continuity outcomes.
 *
 * Records hydrate integrity so Operational Continuity can project readiness
 * without a second persistence owner or recovery engine.
 */

import type { MonitoringHealthRecoveryDiagnostics } from './monitoring-health-restart-recovery';
import { W3_O05_C_MONITORING_RECOVERY_OWNER } from './monitoring-health-restart-recovery';

export type MonitoringHealthRecoveryOutcome = 'ready' | 'unavailable';

export type MonitoringHealthOwnerReadiness = 'ready' | 'unavailable' | 'degraded';

export type MonitoringHealthContinuityRecord = Readonly<{
  owner: typeof W3_O05_C_MONITORING_RECOVERY_OWNER;
  outcome: MonitoringHealthRecoveryOutcome;
  ownerReadiness: MonitoringHealthOwnerReadiness;
  integrityVerified: boolean;
  integrityFailure: boolean;
  reason?: string;
  diagnostics: MonitoringHealthRecoveryDiagnostics | null;
  recoveryStartedAt: string | null;
  recoveryCompletedAt: string | null;
  recoveryDurationMs: number | null;
}>;

let recoveryStartedAtMs: number | null = null;
let record: MonitoringHealthContinuityRecord | null = null;

export function recordMonitoringHealthRecoveryStart(atMs: number = Date.now()): void {
  recoveryStartedAtMs = atMs;
  record = Object.freeze({
    owner: W3_O05_C_MONITORING_RECOVERY_OWNER,
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

export function recordMonitoringHealthRecoverySuccess(input: {
  diagnostics: MonitoringHealthRecoveryDiagnostics;
  reason?: string;
  ownerReadiness?: MonitoringHealthOwnerReadiness;
  completedAtMs?: number;
}): void {
  const completedAtMs = input.completedAtMs ?? Date.now();
  const startedAtMs = recoveryStartedAtMs ?? completedAtMs;
  record = Object.freeze({
    owner: W3_O05_C_MONITORING_RECOVERY_OWNER,
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

export function recordMonitoringHealthRecoveryFailure(input: {
  reason: string;
  ownerReadiness?: MonitoringHealthOwnerReadiness;
  completedAtMs?: number;
}): void {
  const completedAtMs = input.completedAtMs ?? Date.now();
  const startedAtMs = recoveryStartedAtMs ?? completedAtMs;
  record = Object.freeze({
    owner: W3_O05_C_MONITORING_RECOVERY_OWNER,
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
export function recordMonitoringHealthIntegrityFailure(reason: string): void {
  if (!record) {
    recordMonitoringHealthRecoveryStart();
  }
  record = Object.freeze({
    ...record!,
    outcome: record!.outcome === 'unavailable' ? 'unavailable' : 'ready',
    integrityVerified: false,
    integrityFailure: true,
    reason,
  });
}

export function recordMonitoringHealthOwnerReadiness(
  ownerReadiness: MonitoringHealthOwnerReadiness,
  reason?: string,
): void {
  if (record) {
    record = Object.freeze({
      ...record,
      ownerReadiness,
      reason: reason ?? record.reason,
    });
  }
}

export function getMonitoringHealthContinuityRecord(): MonitoringHealthContinuityRecord | null {
  return record;
}

export function isMonitoringHealthRecovering(): boolean {
  return record !== null && record.recoveryCompletedAt === null;
}

/** Test / process isolation helper. */
export function resetMonitoringHealthContinuity(): void {
  recoveryStartedAtMs = null;
  record = null;
}
