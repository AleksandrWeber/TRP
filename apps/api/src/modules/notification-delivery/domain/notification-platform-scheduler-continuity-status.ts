/**
 * W5-N12-c — Process-local Notification Platform Scheduler continuity outcomes.
 *
 * Records hydrate integrity so Operational Continuity (W5-N12-d) can project readiness
 * without a second persistence owner or recovery engine.
 */

import type { NotificationPlatformSchedulerRecoveryDiagnostics } from './notification-platform-scheduler-restart-recovery';
import { W5_N12_C_NOTIFICATION_PLATFORM_SCHEDULER_RECOVERY_OWNER } from './notification-platform-scheduler-restart-recovery';

export type NotificationPlatformSchedulerRecoveryOutcome = 'ready' | 'unavailable';

export type NotificationPlatformSchedulerOwnerReadiness = 'ready' | 'unavailable' | 'degraded';

export type NotificationPlatformSchedulerContinuityRecord = Readonly<{
  owner: typeof W5_N12_C_NOTIFICATION_PLATFORM_SCHEDULER_RECOVERY_OWNER;
  outcome: NotificationPlatformSchedulerRecoveryOutcome;
  ownerReadiness: NotificationPlatformSchedulerOwnerReadiness;
  integrityVerified: boolean;
  integrityFailure: boolean;
  reason?: string;
  diagnostics: NotificationPlatformSchedulerRecoveryDiagnostics | null;
  recoveryStartedAt: string | null;
  recoveryCompletedAt: string | null;
  recoveryDurationMs: number | null;
}>;

let recoveryStartedAtMs: number | null = null;
let record: NotificationPlatformSchedulerContinuityRecord | null = null;

export function recordNotificationPlatformSchedulerRecoveryStart(atMs: number = Date.now()): void {
  recoveryStartedAtMs = atMs;
  record = Object.freeze({
    owner: W5_N12_C_NOTIFICATION_PLATFORM_SCHEDULER_RECOVERY_OWNER,
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

export function recordNotificationPlatformSchedulerRecoverySuccess(input: {
  diagnostics: NotificationPlatformSchedulerRecoveryDiagnostics;
  reason?: string;
  ownerReadiness?: NotificationPlatformSchedulerOwnerReadiness;
  completedAtMs?: number;
}): void {
  const completedAtMs = input.completedAtMs ?? Date.now();
  const startedAtMs = recoveryStartedAtMs ?? completedAtMs;
  record = Object.freeze({
    owner: W5_N12_C_NOTIFICATION_PLATFORM_SCHEDULER_RECOVERY_OWNER,
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

export function recordNotificationPlatformSchedulerRecoveryFailure(input: {
  reason: string;
  ownerReadiness?: NotificationPlatformSchedulerOwnerReadiness;
  completedAtMs?: number;
}): void {
  const completedAtMs = input.completedAtMs ?? Date.now();
  const startedAtMs = recoveryStartedAtMs ?? completedAtMs;
  record = Object.freeze({
    owner: W5_N12_C_NOTIFICATION_PLATFORM_SCHEDULER_RECOVERY_OWNER,
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
export function recordNotificationPlatformSchedulerIntegrityFailure(reason: string): void {
  if (!record) {
    recordNotificationPlatformSchedulerRecoveryStart();
  }
  record = Object.freeze({
    ...record!,
    outcome: record!.outcome === 'unavailable' ? 'unavailable' : 'ready',
    integrityVerified: false,
    integrityFailure: true,
    reason,
  });
}

export function getNotificationPlatformSchedulerContinuityRecord(): NotificationPlatformSchedulerContinuityRecord | null {
  return record;
}

export function isNotificationPlatformSchedulerRecovering(): boolean {
  return record !== null && record.recoveryCompletedAt === null;
}

/** Test / process isolation helper. */
export function resetNotificationPlatformSchedulerContinuity(): void {
  recoveryStartedAtMs = null;
  record = null;
}
