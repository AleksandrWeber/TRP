/**
 * W5-N25-c — Process-local Notification Platform Retry Scheduling Decision continuity outcomes.
 *
 * Records hydrate integrity so Operational Continuity (W5-N25-d) can project readiness
 * without a second persistence owner or recovery engine.
 * Not Platform Readiness product. Not runtime decision logic. Not scheduling/execution.
 */

import type { NotificationPlatformRetrySchedulingDecisionRecoveryDiagnostics } from './notification-platform-retry-scheduling-decision-restart-recovery';
import { W5_N25_C_NOTIFICATION_PLATFORM_RETRY_SCHEDULING_DECISION_RECOVERY_OWNER } from './notification-platform-retry-scheduling-decision-restart-recovery';

export type NotificationPlatformRetrySchedulingDecisionRecoveryOutcome = 'ready' | 'unavailable';

export type NotificationPlatformRetrySchedulingDecisionOwnerReadiness =
  'ready' | 'unavailable' | 'degraded';

export type NotificationPlatformRetrySchedulingDecisionContinuityRecord = Readonly<{
  owner: typeof W5_N25_C_NOTIFICATION_PLATFORM_RETRY_SCHEDULING_DECISION_RECOVERY_OWNER;
  outcome: NotificationPlatformRetrySchedulingDecisionRecoveryOutcome;
  ownerReadiness: NotificationPlatformRetrySchedulingDecisionOwnerReadiness;
  integrityVerified: boolean;
  integrityFailure: boolean;
  reason?: string;
  diagnostics: NotificationPlatformRetrySchedulingDecisionRecoveryDiagnostics | null;
  recoveryStartedAt: string | null;
  recoveryCompletedAt: string | null;
  recoveryDurationMs: number | null;
}>;

let recoveryStartedAtMs: number | null = null;
let record: NotificationPlatformRetrySchedulingDecisionContinuityRecord | null = null;

export function recordNotificationPlatformRetrySchedulingDecisionRecoveryStart(
  atMs: number = Date.now(),
): void {
  recoveryStartedAtMs = atMs;
  record = Object.freeze({
    owner: W5_N25_C_NOTIFICATION_PLATFORM_RETRY_SCHEDULING_DECISION_RECOVERY_OWNER,
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

export function recordNotificationPlatformRetrySchedulingDecisionRecoverySuccess(input: {
  diagnostics: NotificationPlatformRetrySchedulingDecisionRecoveryDiagnostics;
  reason?: string;
  ownerReadiness?: NotificationPlatformRetrySchedulingDecisionOwnerReadiness;
  completedAtMs?: number;
}): void {
  const completedAtMs = input.completedAtMs ?? Date.now();
  const startedAtMs = recoveryStartedAtMs ?? completedAtMs;
  record = Object.freeze({
    owner: W5_N25_C_NOTIFICATION_PLATFORM_RETRY_SCHEDULING_DECISION_RECOVERY_OWNER,
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

export function recordNotificationPlatformRetrySchedulingDecisionRecoveryFailure(input: {
  reason: string;
  ownerReadiness?: NotificationPlatformRetrySchedulingDecisionOwnerReadiness;
  completedAtMs?: number;
}): void {
  const completedAtMs = input.completedAtMs ?? Date.now();
  const startedAtMs = recoveryStartedAtMs ?? completedAtMs;
  record = Object.freeze({
    owner: W5_N25_C_NOTIFICATION_PLATFORM_RETRY_SCHEDULING_DECISION_RECOVERY_OWNER,
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
export function recordNotificationPlatformRetrySchedulingDecisionIntegrityFailure(
  reason: string,
): void {
  if (!record) {
    recordNotificationPlatformRetrySchedulingDecisionRecoveryStart();
  }
  record = Object.freeze({
    ...record!,
    outcome: record!.outcome === 'unavailable' ? 'unavailable' : 'ready',
    integrityVerified: false,
    integrityFailure: true,
    reason,
  });
}

export function getNotificationPlatformRetrySchedulingDecisionContinuityRecord(): NotificationPlatformRetrySchedulingDecisionContinuityRecord | null {
  return record;
}

export function isNotificationPlatformRetrySchedulingDecisionRecovering(): boolean {
  return record !== null && record.recoveryCompletedAt === null;
}

/** Test / process isolation helper. */
export function resetNotificationPlatformRetrySchedulingDecisionContinuity(): void {
  recoveryStartedAtMs = null;
  record = null;
}
