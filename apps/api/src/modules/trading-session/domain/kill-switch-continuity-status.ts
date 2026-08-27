/**
 * W3-O04-d — Process-local Kill Switch continuity outcomes.
 *
 * Records hydrate integrity so Operational Continuity can project readiness
 * without a second persistence owner or recovery engine.
 */

import type { KillSwitchRecoveryDiagnostics } from './kill-switch-restart-recovery';
import { W3_O04_C_KILL_SWITCH_RECOVERY_OWNER } from './kill-switch-restart-recovery';

export type KillSwitchRecoveryOutcome = 'ready' | 'unavailable';

export type KillSwitchOwnerReadiness = 'ready' | 'unavailable' | 'degraded';

export type KillSwitchContinuityRecord = Readonly<{
  owner: typeof W3_O04_C_KILL_SWITCH_RECOVERY_OWNER;
  outcome: KillSwitchRecoveryOutcome;
  ownerReadiness: KillSwitchOwnerReadiness;
  integrityVerified: boolean;
  integrityFailure: boolean;
  reason?: string;
  diagnostics: KillSwitchRecoveryDiagnostics | null;
  recoveryStartedAt: string | null;
  recoveryCompletedAt: string | null;
  recoveryDurationMs: number | null;
}>;

let recoveryStartedAtMs: number | null = null;
let record: KillSwitchContinuityRecord | null = null;

export function recordKillSwitchRecoveryStart(atMs: number = Date.now()): void {
  recoveryStartedAtMs = atMs;
  record = Object.freeze({
    owner: W3_O04_C_KILL_SWITCH_RECOVERY_OWNER,
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

export function recordKillSwitchRecoverySuccess(input: {
  diagnostics: KillSwitchRecoveryDiagnostics;
  reason?: string;
  ownerReadiness?: KillSwitchOwnerReadiness;
  completedAtMs?: number;
}): void {
  const completedAtMs = input.completedAtMs ?? Date.now();
  const startedAtMs = recoveryStartedAtMs ?? completedAtMs;
  record = Object.freeze({
    owner: W3_O04_C_KILL_SWITCH_RECOVERY_OWNER,
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

export function recordKillSwitchRecoveryFailure(input: {
  reason: string;
  ownerReadiness?: KillSwitchOwnerReadiness;
  completedAtMs?: number;
}): void {
  const completedAtMs = input.completedAtMs ?? Date.now();
  const startedAtMs = recoveryStartedAtMs ?? completedAtMs;
  record = Object.freeze({
    owner: W3_O04_C_KILL_SWITCH_RECOVERY_OWNER,
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
export function recordKillSwitchIntegrityFailure(reason: string): void {
  if (!record) {
    recordKillSwitchRecoveryStart();
  }
  record = Object.freeze({
    ...record!,
    outcome: record!.outcome === 'unavailable' ? 'unavailable' : 'ready',
    integrityVerified: false,
    integrityFailure: true,
    reason,
  });
}

export function recordKillSwitchOwnerReadiness(
  ownerReadiness: KillSwitchOwnerReadiness,
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

export function getKillSwitchContinuityRecord(): KillSwitchContinuityRecord | null {
  return record;
}

export function isKillSwitchRecovering(): boolean {
  return record !== null && record.recoveryCompletedAt === null;
}

/** Test / process isolation helper. */
export function resetKillSwitchContinuity(): void {
  recoveryStartedAtMs = null;
  record = null;
}
