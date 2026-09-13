/**
 * W5-N26-d — Notification Platform Retry Scheduling Decision Evaluation operational continuity (pure).
 *
 * Operational state is derived from W5-N26-c recovered decision anchors + owner health.
 * Supported states only: Recovering | Ready | Degraded | Unavailable.
 * Never hardcodes Ready. Never fabricates readiness or runtime-decision-evaluation labels.
 */

import {
  assertOperationalState,
  type OperationalState,
  type NotificationPlatformRetrySchedulingDecisionEvaluationContinuityView,
} from '../../operational-continuity/operational-readiness';
import type {
  NotificationPlatformRetrySchedulingDecisionEvaluationContinuityRecord,
  NotificationPlatformRetrySchedulingDecisionOwnerReadiness,
} from './notification-platform-retry-scheduling-decision-evaluation-continuity-status';
import type { NotificationPlatformRetrySchedulingDecisionEvaluationRecoveryDiagnostics } from './notification-platform-retry-scheduling-decision-evaluation-restart-recovery';

export type NotificationPlatformRetrySchedulingDecisionEvaluationOperationalState =
  OperationalState;
export type NotificationPlatformRetrySchedulingDecisionEvaluationContinuityProjection =
  NotificationPlatformRetrySchedulingDecisionEvaluationContinuityView;

export type EvaluateNotificationPlatformRetrySchedulingDecisionEvaluationContinuityInput =
  Readonly<{
    recovering: boolean;
    ownerReadiness: NotificationPlatformRetrySchedulingDecisionOwnerReadiness;
    continuity: NotificationPlatformRetrySchedulingDecisionEvaluationContinuityRecord | null;
  }>;

/**
 * Derive Notification Platform Retry Scheduling Decision Evaluation operational state from recovered
 * anchors + owner health. Ready only after successful integrity verification and owner Ready.
 * Integrity failure → Degraded. Recovery failure → Unavailable.
 */
export function evaluateNotificationPlatformRetrySchedulingDecisionEvaluationOperationalState(
  input: EvaluateNotificationPlatformRetrySchedulingDecisionEvaluationContinuityInput,
): NotificationPlatformRetrySchedulingDecisionEvaluationOperationalState {
  if (input.recovering) {
    return 'Recovering';
  }
  if (input.ownerReadiness === 'unavailable') {
    return 'Unavailable';
  }
  if (input.ownerReadiness === 'degraded') {
    return 'Degraded';
  }
  if (!input.continuity) {
    return 'Unavailable';
  }
  if (input.continuity.outcome === 'unavailable') {
    return 'Unavailable';
  }
  if (input.continuity.integrityFailure) {
    return 'Degraded';
  }
  if (!input.continuity.integrityVerified) {
    return 'Unavailable';
  }
  return 'Ready';
}

export function buildNotificationPlatformRetrySchedulingDecisionEvaluationContinuityProjection(
  input: EvaluateNotificationPlatformRetrySchedulingDecisionEvaluationContinuityInput,
): NotificationPlatformRetrySchedulingDecisionEvaluationContinuityView {
  const operationalState =
    evaluateNotificationPlatformRetrySchedulingDecisionEvaluationOperationalState(input);
  assertOperationalState(operationalState);

  const diagnostics: NotificationPlatformRetrySchedulingDecisionEvaluationRecoveryDiagnostics | null =
    input.continuity?.diagnostics ?? null;

  return Object.freeze({
    operationalState,
    ownerReadiness: input.ownerReadiness,
    recoveryTimestamp: input.continuity?.recoveryCompletedAt ?? null,
    recoveryDurationMs: input.continuity?.recoveryDurationMs ?? null,
    reason: input.continuity?.reason,
    restoredCount: diagnostics?.restoredCount ?? 0,
    canonicalAnchorCount: diagnostics?.canonicalAnchorCount ?? 0,
    integrityVerified: input.continuity?.integrityVerified ?? false,
    workspaceIds: diagnostics?.workspaceIds ?? Object.freeze([]),
  });
}

/** Alias for service wiring — derives decision readiness view from W5-N26-c recovery state. */
export function buildNotificationPlatformRetrySchedulingDecisionEvaluationView(
  input: EvaluateNotificationPlatformRetrySchedulingDecisionEvaluationContinuityInput,
): NotificationPlatformRetrySchedulingDecisionEvaluationContinuityView {
  return buildNotificationPlatformRetrySchedulingDecisionEvaluationContinuityProjection(input);
}

/**
 * Graceful degradation: decision continuity stays Ready/Degraded while other owners are
 * Degraded/Unavailable — unless its own recovery is Unavailable.
 */
export function notificationPlatformRetrySchedulingDecisionEvaluationContinuesWhileOthersDegraded(input: {
  notificationPlatformRetrySchedulingDecisionEvaluationState: NotificationPlatformRetrySchedulingDecisionEvaluationOperationalState;
  otherOwnerStates: readonly OperationalState[];
}): boolean {
  if (input.notificationPlatformRetrySchedulingDecisionEvaluationState === 'Unavailable') {
    return false;
  }
  return input.otherOwnerStates.some((state) => state === 'Degraded' || state === 'Unavailable');
}
