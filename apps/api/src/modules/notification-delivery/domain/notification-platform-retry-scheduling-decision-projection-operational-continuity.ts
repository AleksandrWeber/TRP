/**
 * W5-N27-d — Notification Platform Retry Scheduling Decision Projection operational continuity (pure).
 *
 * Operational state is derived from W5-N27-c recovered decision anchors + owner health.
 * Supported states only: Recovering | Ready | Degraded | Unavailable.
 * Never hardcodes Ready. Never fabricates readiness or runtime-decision-projection labels.
 */

import {
  assertOperationalState,
  type OperationalState,
  type NotificationPlatformRetrySchedulingDecisionProjectionContinuityView,
} from '../../operational-continuity/operational-readiness';
import type {
  NotificationPlatformRetrySchedulingDecisionProjectionContinuityRecord,
  NotificationPlatformRetrySchedulingDecisionOwnerReadiness,
} from './notification-platform-retry-scheduling-decision-projection-continuity-status';
import type { NotificationPlatformRetrySchedulingDecisionProjectionRecoveryDiagnostics } from './notification-platform-retry-scheduling-decision-projection-restart-recovery';

export type NotificationPlatformRetrySchedulingDecisionProjectionOperationalState =
  OperationalState;
export type NotificationPlatformRetrySchedulingDecisionProjectionContinuityProjection =
  NotificationPlatformRetrySchedulingDecisionProjectionContinuityView;

export type EvaluateNotificationPlatformRetrySchedulingDecisionProjectionContinuityInput =
  Readonly<{
    recovering: boolean;
    ownerReadiness: NotificationPlatformRetrySchedulingDecisionOwnerReadiness;
    continuity: NotificationPlatformRetrySchedulingDecisionProjectionContinuityRecord | null;
  }>;

/**
 * Derive Notification Platform Retry Scheduling Decision Projection operational state from recovered
 * anchors + owner health. Ready only after successful integrity verification and owner Ready.
 * Integrity failure → Degraded. Recovery failure → Unavailable.
 */
export function evaluateNotificationPlatformRetrySchedulingDecisionProjectionOperationalState(
  input: EvaluateNotificationPlatformRetrySchedulingDecisionProjectionContinuityInput,
): NotificationPlatformRetrySchedulingDecisionProjectionOperationalState {
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

export function buildNotificationPlatformRetrySchedulingDecisionProjectionContinuityProjection(
  input: EvaluateNotificationPlatformRetrySchedulingDecisionProjectionContinuityInput,
): NotificationPlatformRetrySchedulingDecisionProjectionContinuityView {
  const operationalState =
    evaluateNotificationPlatformRetrySchedulingDecisionProjectionOperationalState(input);
  assertOperationalState(operationalState);

  const diagnostics: NotificationPlatformRetrySchedulingDecisionProjectionRecoveryDiagnostics | null =
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

/** Alias for service wiring — derives decision readiness view from W5-N27-c recovery state. */
export function buildNotificationPlatformRetrySchedulingDecisionProjectionView(
  input: EvaluateNotificationPlatformRetrySchedulingDecisionProjectionContinuityInput,
): NotificationPlatformRetrySchedulingDecisionProjectionContinuityView {
  return buildNotificationPlatformRetrySchedulingDecisionProjectionContinuityProjection(input);
}

/**
 * Graceful degradation: decision continuity stays Ready/Degraded while other owners are
 * Degraded/Unavailable — unless its own recovery is Unavailable.
 */
export function notificationPlatformRetrySchedulingDecisionProjectionContinuesWhileOthersDegraded(input: {
  notificationPlatformRetrySchedulingDecisionProjectionState: NotificationPlatformRetrySchedulingDecisionProjectionOperationalState;
  otherOwnerStates: readonly OperationalState[];
}): boolean {
  if (input.notificationPlatformRetrySchedulingDecisionProjectionState === 'Unavailable') {
    return false;
  }
  return input.otherOwnerStates.some((state) => state === 'Degraded' || state === 'Unavailable');
}
