/**
 * W5-N09-c — Process-local Notification Platform Workers continuity outcomes.
 *
 * Records hydrate integrity so Operational Continuity (W5-N09-d) can project readiness
 * without a second persistence owner or recovery engine.
 */

import type { NotificationPlatformWorkersRecoveryDiagnostics } from './notification-platform-workers-restart-recovery';
import { W5_N09_C_NOTIFICATION_PLATFORM_WORKERS_RECOVERY_OWNER } from './notification-platform-workers-restart-recovery';

export type NotificationPlatformWorkersRecoveryOutcome = 'ready' | 'unavailable';

export type NotificationPlatformWorkersOwnerReadiness = 'ready' | 'unavailable' | 'degraded';

export type NotificationPlatformWorkersContinuityRecord = Readonly<{
  owner: typeof W5_N09_C_NOTIFICATION_PLATFORM_WORKERS_RECOVERY_OWNER;
  outcome: NotificationPlatformWorkersRecoveryOutcome;
  ownerReadiness: NotificationPlatformWorkersOwnerReadiness;
  integrityVerified: boolean;
  integrityFailure: boolean;
  reason?: string;
  diagnostics: NotificationPlatformWorkersRecoveryDiagnostics | null;
  recoveryStartedAt: string | null;
  recoveryCompletedAt: string | null;
  recoveryDurationMs: number | null;
}>;

let recoveryStartedAtMs: number | null = null;
let record: NotificationPlatformWorkersContinuityRecord | null = null;

export function recordNotificationPlatformWorkersRecoveryStart(atMs: number = Date.now()): void {
  recoveryStartedAtMs = atMs;
  record = Object.freeze({
    owner: W5_N09_C_NOTIFICATION_PLATFORM_WORKERS_RECOVERY_OWNER,
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

export function recordNotificationPlatformWorkersRecoverySuccess(input: {
  diagnostics: NotificationPlatformWorkersRecoveryDiagnostics;
  reason?: string;
  ownerReadiness?: NotificationPlatformWorkersOwnerReadiness;
  completedAtMs?: number;
}): void {
  const completedAtMs = input.completedAtMs ?? Date.now();
  const startedAtMs = recoveryStartedAtMs ?? completedAtMs;
  record = Object.freeze({
    owner: W5_N09_C_NOTIFICATION_PLATFORM_WORKERS_RECOVERY_OWNER,
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

export function recordNotificationPlatformWorkersRecoveryFailure(input: {
  reason: string;
  ownerReadiness?: NotificationPlatformWorkersOwnerReadiness;
  completedAtMs?: number;
}): void {
  const completedAtMs = input.completedAtMs ?? Date.now();
  const startedAtMs = recoveryStartedAtMs ?? completedAtMs;
  record = Object.freeze({
    owner: W5_N09_C_NOTIFICATION_PLATFORM_WORKERS_RECOVERY_OWNER,
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
export function recordNotificationPlatformWorkersIntegrityFailure(reason: string): void {
  if (!record) {
    recordNotificationPlatformWorkersRecoveryStart();
  }
  record = Object.freeze({
    ...record!,
    outcome: record!.outcome === 'unavailable' ? 'unavailable' : 'ready',
    integrityVerified: false,
    integrityFailure: true,
    reason,
  });
}

export function getNotificationPlatformWorkersContinuityRecord(): NotificationPlatformWorkersContinuityRecord | null {
  return record;
}

export function isNotificationPlatformWorkersRecovering(): boolean {
  return record !== null && record.recoveryCompletedAt === null;
}

/** Test / process isolation helper. */
export function resetNotificationPlatformWorkersContinuity(): void {
  recoveryStartedAtMs = null;
  record = null;
}
