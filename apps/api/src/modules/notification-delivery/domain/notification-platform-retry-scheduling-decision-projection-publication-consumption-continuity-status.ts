/**
 * W5-N29-c — Process-local Notification Platform Retry Scheduling Decision Projection Publication continuity outcomes.
 *
 * Records hydrate integrity so Operational Continuity (W5-N29-d) can project readiness
 * without a second persistence owner or recovery engine.
 * Not Platform Readiness product. Not runtime consumption. Not runtime publication. Not runtime decision projection. Not scheduling/execution.
 */

import type { NotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionRecoveryDiagnostics } from './notification-platform-retry-scheduling-decision-projection-publication-consumption-restart-recovery';
import { W5_N29_C_NOTIFICATION_PLATFORM_RETRY_SCHEDULING_DECISION_PROJECTION_PUBLICATION_CONSUMPTION_RECOVERY_OWNER } from './notification-platform-retry-scheduling-decision-projection-publication-consumption-restart-recovery';

export type NotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionRecoveryOutcome =
  'ready' | 'unavailable';

export type NotificationPlatformRetrySchedulingDecisionProjectionPublicationOwnerReadiness =
  'ready' | 'unavailable' | 'degraded';

export type NotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionContinuityRecord =
  Readonly<{
    owner: typeof W5_N29_C_NOTIFICATION_PLATFORM_RETRY_SCHEDULING_DECISION_PROJECTION_PUBLICATION_CONSUMPTION_RECOVERY_OWNER;
    outcome: NotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionRecoveryOutcome;
    ownerReadiness: NotificationPlatformRetrySchedulingDecisionProjectionPublicationOwnerReadiness;
    integrityVerified: boolean;
    integrityFailure: boolean;
    reason?: string;
    diagnostics: NotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionRecoveryDiagnostics | null;
    recoveryStartedAt: string | null;
    recoveryCompletedAt: string | null;
    recoveryDurationMs: number | null;
  }>;

let recoveryStartedAtMs: number | null = null;
let record: NotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionContinuityRecord | null =
  null;

export function recordNotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionRecoveryStart(
  atMs: number = Date.now(),
): void {
  recoveryStartedAtMs = atMs;
  record = Object.freeze({
    owner:
      W5_N29_C_NOTIFICATION_PLATFORM_RETRY_SCHEDULING_DECISION_PROJECTION_PUBLICATION_CONSUMPTION_RECOVERY_OWNER,
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

export function recordNotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionRecoverySuccess(input: {
  diagnostics: NotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionRecoveryDiagnostics;
  reason?: string;
  ownerReadiness?: NotificationPlatformRetrySchedulingDecisionProjectionPublicationOwnerReadiness;
  completedAtMs?: number;
}): void {
  const completedAtMs = input.completedAtMs ?? Date.now();
  const startedAtMs = recoveryStartedAtMs ?? completedAtMs;
  record = Object.freeze({
    owner:
      W5_N29_C_NOTIFICATION_PLATFORM_RETRY_SCHEDULING_DECISION_PROJECTION_PUBLICATION_CONSUMPTION_RECOVERY_OWNER,
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

export function recordNotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionRecoveryFailure(input: {
  reason: string;
  ownerReadiness?: NotificationPlatformRetrySchedulingDecisionProjectionPublicationOwnerReadiness;
  completedAtMs?: number;
}): void {
  const completedAtMs = input.completedAtMs ?? Date.now();
  const startedAtMs = recoveryStartedAtMs ?? completedAtMs;
  record = Object.freeze({
    owner:
      W5_N29_C_NOTIFICATION_PLATFORM_RETRY_SCHEDULING_DECISION_PROJECTION_PUBLICATION_CONSUMPTION_RECOVERY_OWNER,
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
export function recordNotificationPlatformRetrySchedulingDecisionProjectionPublicationIntegrityFailure(
  reason: string,
): void {
  if (!record) {
    recordNotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionRecoveryStart();
  }
  record = Object.freeze({
    ...record!,
    outcome: record!.outcome === 'unavailable' ? 'unavailable' : 'ready',
    integrityVerified: false,
    integrityFailure: true,
    reason,
  });
}

export function getNotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionContinuityRecord(): NotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionContinuityRecord | null {
  return record;
}

export function isNotificationPlatformRetrySchedulingDecisionProjectionPublicationRecovering(): boolean {
  return record !== null && record.recoveryCompletedAt === null;
}

/** Test / process isolation helper. */
export function resetNotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionContinuity(): void {
  recoveryStartedAtMs = null;
  record = null;
}
