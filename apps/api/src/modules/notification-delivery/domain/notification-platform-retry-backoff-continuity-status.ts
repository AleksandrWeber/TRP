/**
 * W5-N21-c — Process-local Notification Platform Retry Backoff continuity outcomes.
 *
 * Records hydrate integrity so Operational Continuity (W5-N21-d) can project readiness
 * without a second persistence owner or recovery engine.
 */

import type { NotificationPlatformRetryBackoffRecoveryDiagnostics } from './notification-platform-retry-backoff-restart-recovery';
import { W5_N21_C_NOTIFICATION_PLATFORM_RETRY_BACKOFF_RECOVERY_OWNER } from './notification-platform-retry-backoff-restart-recovery';

export type NotificationPlatformRetryBackoffRecoveryOutcome = 'ready' | 'unavailable';

export type NotificationPlatformRetryBackoffOwnerReadiness = 'ready' | 'unavailable' | 'degraded';

export type NotificationPlatformRetryBackoffContinuityRecord = Readonly<{
  owner: typeof W5_N21_C_NOTIFICATION_PLATFORM_RETRY_BACKOFF_RECOVERY_OWNER;
  outcome: NotificationPlatformRetryBackoffRecoveryOutcome;
  ownerReadiness: NotificationPlatformRetryBackoffOwnerReadiness;
  integrityVerified: boolean;
  integrityFailure: boolean;
  reason?: string;
  diagnostics: NotificationPlatformRetryBackoffRecoveryDiagnostics | null;
  recoveryStartedAt: string | null;
  recoveryCompletedAt: string | null;
  recoveryDurationMs: number | null;
}>;

let recoveryStartedAtMs: number | null = null;
let record: NotificationPlatformRetryBackoffContinuityRecord | null = null;

export function recordNotificationPlatformRetryBackoffRecoveryStart(
  atMs: number = Date.now(),
): void {
  recoveryStartedAtMs = atMs;
  record = Object.freeze({
    owner: W5_N21_C_NOTIFICATION_PLATFORM_RETRY_BACKOFF_RECOVERY_OWNER,
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

export function recordNotificationPlatformRetryBackoffRecoverySuccess(input: {
  diagnostics: NotificationPlatformRetryBackoffRecoveryDiagnostics;
  reason?: string;
  ownerReadiness?: NotificationPlatformRetryBackoffOwnerReadiness;
  completedAtMs?: number;
}): void {
  const completedAtMs = input.completedAtMs ?? Date.now();
  const startedAtMs = recoveryStartedAtMs ?? completedAtMs;
  record = Object.freeze({
    owner: W5_N21_C_NOTIFICATION_PLATFORM_RETRY_BACKOFF_RECOVERY_OWNER,
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

export function recordNotificationPlatformRetryBackoffRecoveryFailure(input: {
  reason: string;
  ownerReadiness?: NotificationPlatformRetryBackoffOwnerReadiness;
  completedAtMs?: number;
}): void {
  const completedAtMs = input.completedAtMs ?? Date.now();
  const startedAtMs = recoveryStartedAtMs ?? completedAtMs;
  record = Object.freeze({
    owner: W5_N21_C_NOTIFICATION_PLATFORM_RETRY_BACKOFF_RECOVERY_OWNER,
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
export function recordNotificationPlatformRetryBackoffIntegrityFailure(reason: string): void {
  if (!record) {
    recordNotificationPlatformRetryBackoffRecoveryStart();
  }
  record = Object.freeze({
    ...record!,
    outcome: record!.outcome === 'unavailable' ? 'unavailable' : 'ready',
    integrityVerified: false,
    integrityFailure: true,
    reason,
  });
}

export function getNotificationPlatformRetryBackoffContinuityRecord(): NotificationPlatformRetryBackoffContinuityRecord | null {
  return record;
}

export function isNotificationPlatformRetryBackoffRecovering(): boolean {
  return record !== null && record.recoveryCompletedAt === null;
}

/** Test / process isolation helper. */
export function resetNotificationPlatformRetryBackoffContinuity(): void {
  recoveryStartedAtMs = null;
  record = null;
}
