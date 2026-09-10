/**
 * W5-N19-c — Process-local Notification Platform Retry Scheduling continuity outcomes.
 *
 * Records hydrate integrity so Operational Continuity (W5-N19-d) can project readiness
 * without a second persistence owner or recovery engine.
 */

import type { NotificationPlatformRetrySchedulingRecoveryDiagnostics } from './notification-platform-retry-scheduling-restart-recovery';
import { W5_N19_C_NOTIFICATION_PLATFORM_RETRY_SCHEDULING_RECOVERY_OWNER } from './notification-platform-retry-scheduling-restart-recovery';

export type NotificationPlatformRetrySchedulingRecoveryOutcome = 'ready' | 'unavailable';

export type NotificationPlatformRetrySchedulingOwnerReadiness =
  'ready' | 'unavailable' | 'degraded';

export type NotificationPlatformRetrySchedulingContinuityRecord = Readonly<{
  owner: typeof W5_N19_C_NOTIFICATION_PLATFORM_RETRY_SCHEDULING_RECOVERY_OWNER;
  outcome: NotificationPlatformRetrySchedulingRecoveryOutcome;
  ownerReadiness: NotificationPlatformRetrySchedulingOwnerReadiness;
  integrityVerified: boolean;
  integrityFailure: boolean;
  reason?: string;
  diagnostics: NotificationPlatformRetrySchedulingRecoveryDiagnostics | null;
  recoveryStartedAt: string | null;
  recoveryCompletedAt: string | null;
  recoveryDurationMs: number | null;
}>;

let recoveryStartedAtMs: number | null = null;
let record: NotificationPlatformRetrySchedulingContinuityRecord | null = null;

export function recordNotificationPlatformRetrySchedulingRecoveryStart(
  atMs: number = Date.now(),
): void {
  recoveryStartedAtMs = atMs;
  record = Object.freeze({
    owner: W5_N19_C_NOTIFICATION_PLATFORM_RETRY_SCHEDULING_RECOVERY_OWNER,
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

export function recordNotificationPlatformRetrySchedulingRecoverySuccess(input: {
  diagnostics: NotificationPlatformRetrySchedulingRecoveryDiagnostics;
  reason?: string;
  ownerReadiness?: NotificationPlatformRetrySchedulingOwnerReadiness;
  completedAtMs?: number;
}): void {
  const completedAtMs = input.completedAtMs ?? Date.now();
  const startedAtMs = recoveryStartedAtMs ?? completedAtMs;
  record = Object.freeze({
    owner: W5_N19_C_NOTIFICATION_PLATFORM_RETRY_SCHEDULING_RECOVERY_OWNER,
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

export function recordNotificationPlatformRetrySchedulingRecoveryFailure(input: {
  reason: string;
  ownerReadiness?: NotificationPlatformRetrySchedulingOwnerReadiness;
  completedAtMs?: number;
}): void {
  const completedAtMs = input.completedAtMs ?? Date.now();
  const startedAtMs = recoveryStartedAtMs ?? completedAtMs;
  record = Object.freeze({
    owner: W5_N19_C_NOTIFICATION_PLATFORM_RETRY_SCHEDULING_RECOVERY_OWNER,
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
export function recordNotificationPlatformRetrySchedulingIntegrityFailure(reason: string): void {
  if (!record) {
    recordNotificationPlatformRetrySchedulingRecoveryStart();
  }
  record = Object.freeze({
    ...record!,
    outcome: record!.outcome === 'unavailable' ? 'unavailable' : 'ready',
    integrityVerified: false,
    integrityFailure: true,
    reason,
  });
}

export function getNotificationPlatformRetrySchedulingContinuityRecord(): NotificationPlatformRetrySchedulingContinuityRecord | null {
  return record;
}

export function isNotificationPlatformRetrySchedulingRecovering(): boolean {
  return record !== null && record.recoveryCompletedAt === null;
}

/** Test / process isolation helper. */
export function resetNotificationPlatformRetrySchedulingContinuity(): void {
  recoveryStartedAtMs = null;
  record = null;
}
