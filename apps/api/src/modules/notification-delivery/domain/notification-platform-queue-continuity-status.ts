/**
 * W5-N08-c — Process-local Notification Platform Queue continuity outcomes.
 *
 * Records hydrate integrity so Operational Continuity (W5-N08-d) can project readiness
 * without a second persistence owner or recovery engine.
 */

import type { NotificationPlatformQueueRecoveryDiagnostics } from './notification-platform-queue-restart-recovery';
import { W5_N08_C_NOTIFICATION_PLATFORM_QUEUE_RECOVERY_OWNER } from './notification-platform-queue-restart-recovery';

export type NotificationPlatformQueueRecoveryOutcome = 'ready' | 'unavailable';

export type NotificationPlatformQueueOwnerReadiness = 'ready' | 'unavailable' | 'degraded';

export type NotificationPlatformQueueContinuityRecord = Readonly<{
  owner: typeof W5_N08_C_NOTIFICATION_PLATFORM_QUEUE_RECOVERY_OWNER;
  outcome: NotificationPlatformQueueRecoveryOutcome;
  ownerReadiness: NotificationPlatformQueueOwnerReadiness;
  integrityVerified: boolean;
  integrityFailure: boolean;
  reason?: string;
  diagnostics: NotificationPlatformQueueRecoveryDiagnostics | null;
  recoveryStartedAt: string | null;
  recoveryCompletedAt: string | null;
  recoveryDurationMs: number | null;
}>;

let recoveryStartedAtMs: number | null = null;
let record: NotificationPlatformQueueContinuityRecord | null = null;

export function recordNotificationPlatformQueueRecoveryStart(atMs: number = Date.now()): void {
  recoveryStartedAtMs = atMs;
  record = Object.freeze({
    owner: W5_N08_C_NOTIFICATION_PLATFORM_QUEUE_RECOVERY_OWNER,
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

export function recordNotificationPlatformQueueRecoverySuccess(input: {
  diagnostics: NotificationPlatformQueueRecoveryDiagnostics;
  reason?: string;
  ownerReadiness?: NotificationPlatformQueueOwnerReadiness;
  completedAtMs?: number;
}): void {
  const completedAtMs = input.completedAtMs ?? Date.now();
  const startedAtMs = recoveryStartedAtMs ?? completedAtMs;
  record = Object.freeze({
    owner: W5_N08_C_NOTIFICATION_PLATFORM_QUEUE_RECOVERY_OWNER,
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

export function recordNotificationPlatformQueueRecoveryFailure(input: {
  reason: string;
  ownerReadiness?: NotificationPlatformQueueOwnerReadiness;
  completedAtMs?: number;
}): void {
  const completedAtMs = input.completedAtMs ?? Date.now();
  const startedAtMs = recoveryStartedAtMs ?? completedAtMs;
  record = Object.freeze({
    owner: W5_N08_C_NOTIFICATION_PLATFORM_QUEUE_RECOVERY_OWNER,
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
export function recordNotificationPlatformQueueIntegrityFailure(reason: string): void {
  if (!record) {
    recordNotificationPlatformQueueRecoveryStart();
  }
  record = Object.freeze({
    ...record!,
    outcome: record!.outcome === 'unavailable' ? 'unavailable' : 'ready',
    integrityVerified: false,
    integrityFailure: true,
    reason,
  });
}

export function getNotificationPlatformQueueContinuityRecord(): NotificationPlatformQueueContinuityRecord | null {
  return record;
}

export function isNotificationPlatformQueueRecovering(): boolean {
  return record !== null && record.recoveryCompletedAt === null;
}

/** Test / process isolation helper. */
export function resetNotificationPlatformQueueContinuity(): void {
  recoveryStartedAtMs = null;
  record = null;
}
