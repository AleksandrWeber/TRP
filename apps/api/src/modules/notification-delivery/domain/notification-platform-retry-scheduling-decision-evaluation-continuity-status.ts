/**
 * W5-N26-c — Process-local Notification Platform Retry Scheduling Decision Evaluation continuity outcomes.
 *
 * Records hydrate integrity so Operational Continuity (W5-N26-d) can project readiness
 * without a second persistence owner or recovery engine.
 * Not Platform Readiness product. Not runtime decision evaluation. Not scheduling/execution.
 */

import type { NotificationPlatformRetrySchedulingDecisionEvaluationRecoveryDiagnostics } from './notification-platform-retry-scheduling-decision-evaluation-restart-recovery';
import { W5_N26_C_NOTIFICATION_PLATFORM_RETRY_SCHEDULING_DECISION_RECOVERY_OWNER } from './notification-platform-retry-scheduling-decision-evaluation-restart-recovery';

export type NotificationPlatformRetrySchedulingDecisionEvaluationRecoveryOutcome =
  'ready' | 'unavailable';

export type NotificationPlatformRetrySchedulingDecisionOwnerReadiness =
  'ready' | 'unavailable' | 'degraded';

export type NotificationPlatformRetrySchedulingDecisionEvaluationContinuityRecord = Readonly<{
  owner: typeof W5_N26_C_NOTIFICATION_PLATFORM_RETRY_SCHEDULING_DECISION_RECOVERY_OWNER;
  outcome: NotificationPlatformRetrySchedulingDecisionEvaluationRecoveryOutcome;
  ownerReadiness: NotificationPlatformRetrySchedulingDecisionOwnerReadiness;
  integrityVerified: boolean;
  integrityFailure: boolean;
  reason?: string;
  diagnostics: NotificationPlatformRetrySchedulingDecisionEvaluationRecoveryDiagnostics | null;
  recoveryStartedAt: string | null;
  recoveryCompletedAt: string | null;
  recoveryDurationMs: number | null;
}>;

let recoveryStartedAtMs: number | null = null;
let record: NotificationPlatformRetrySchedulingDecisionEvaluationContinuityRecord | null = null;

export function recordNotificationPlatformRetrySchedulingDecisionEvaluationRecoveryStart(
  atMs: number = Date.now(),
): void {
  recoveryStartedAtMs = atMs;
  record = Object.freeze({
    owner: W5_N26_C_NOTIFICATION_PLATFORM_RETRY_SCHEDULING_DECISION_RECOVERY_OWNER,
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

export function recordNotificationPlatformRetrySchedulingDecisionEvaluationRecoverySuccess(input: {
  diagnostics: NotificationPlatformRetrySchedulingDecisionEvaluationRecoveryDiagnostics;
  reason?: string;
  ownerReadiness?: NotificationPlatformRetrySchedulingDecisionOwnerReadiness;
  completedAtMs?: number;
}): void {
  const completedAtMs = input.completedAtMs ?? Date.now();
  const startedAtMs = recoveryStartedAtMs ?? completedAtMs;
  record = Object.freeze({
    owner: W5_N26_C_NOTIFICATION_PLATFORM_RETRY_SCHEDULING_DECISION_RECOVERY_OWNER,
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

export function recordNotificationPlatformRetrySchedulingDecisionEvaluationRecoveryFailure(input: {
  reason: string;
  ownerReadiness?: NotificationPlatformRetrySchedulingDecisionOwnerReadiness;
  completedAtMs?: number;
}): void {
  const completedAtMs = input.completedAtMs ?? Date.now();
  const startedAtMs = recoveryStartedAtMs ?? completedAtMs;
  record = Object.freeze({
    owner: W5_N26_C_NOTIFICATION_PLATFORM_RETRY_SCHEDULING_DECISION_RECOVERY_OWNER,
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
    recordNotificationPlatformRetrySchedulingDecisionEvaluationRecoveryStart();
  }
  record = Object.freeze({
    ...record!,
    outcome: record!.outcome === 'unavailable' ? 'unavailable' : 'ready',
    integrityVerified: false,
    integrityFailure: true,
    reason,
  });
}

export function getNotificationPlatformRetrySchedulingDecisionEvaluationContinuityRecord(): NotificationPlatformRetrySchedulingDecisionEvaluationContinuityRecord | null {
  return record;
}

export function isNotificationPlatformRetrySchedulingDecisionRecovering(): boolean {
  return record !== null && record.recoveryCompletedAt === null;
}

/** Test / process isolation helper. */
export function resetNotificationPlatformRetrySchedulingDecisionEvaluationContinuity(): void {
  recoveryStartedAtMs = null;
  record = null;
}
