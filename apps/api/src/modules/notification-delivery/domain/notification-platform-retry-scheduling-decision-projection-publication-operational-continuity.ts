/**
 * W5-N28-d — Notification Platform Retry Scheduling Decision Projection Publication operational continuity (pure).
 *
 * Operational state is derived from W5-N28-c recovered publication anchors + owner health.
 * Supported states only: Recovering | Ready | Degraded | Unavailable.
 * Never hardcodes Ready. Never fabricates readiness or runtime-publication labels.
 */

import {
  assertOperationalState,
  type OperationalState,
  type NotificationPlatformRetrySchedulingDecisionProjectionPublicationContinuityView,
} from '../../operational-continuity/operational-readiness';
import type {
  NotificationPlatformRetrySchedulingDecisionProjectionPublicationContinuityRecord,
  NotificationPlatformRetrySchedulingDecisionProjectionPublicationOwnerReadiness,
} from './notification-platform-retry-scheduling-decision-projection-publication-continuity-status';
import type { NotificationPlatformRetrySchedulingDecisionProjectionPublicationRecoveryDiagnostics } from './notification-platform-retry-scheduling-decision-projection-publication-restart-recovery';

export type NotificationPlatformRetrySchedulingDecisionProjectionPublicationOperationalState =
  OperationalState;
export type NotificationPlatformRetrySchedulingDecisionProjectionPublicationContinuityProjection =
  NotificationPlatformRetrySchedulingDecisionProjectionPublicationContinuityView;

export type EvaluateNotificationPlatformRetrySchedulingDecisionProjectionPublicationContinuityInput =
  Readonly<{
    recovering: boolean;
    ownerReadiness: NotificationPlatformRetrySchedulingDecisionProjectionPublicationOwnerReadiness;
    continuity: NotificationPlatformRetrySchedulingDecisionProjectionPublicationContinuityRecord | null;
  }>;

/**
 * Derive Notification Platform Retry Scheduling Decision Projection Publication operational state from recovered
 * anchors + owner health. Ready only after successful integrity verification and owner Ready.
 * Integrity failure → Degraded. Recovery failure → Unavailable.
 */
export function evaluateNotificationPlatformRetrySchedulingDecisionProjectionPublicationOperationalState(
  input: EvaluateNotificationPlatformRetrySchedulingDecisionProjectionPublicationContinuityInput,
): NotificationPlatformRetrySchedulingDecisionProjectionPublicationOperationalState {
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

export function buildNotificationPlatformRetrySchedulingDecisionProjectionPublicationContinuityProjection(
  input: EvaluateNotificationPlatformRetrySchedulingDecisionProjectionPublicationContinuityInput,
): NotificationPlatformRetrySchedulingDecisionProjectionPublicationContinuityView {
  const operationalState =
    evaluateNotificationPlatformRetrySchedulingDecisionProjectionPublicationOperationalState(input);
  assertOperationalState(operationalState);

  const diagnostics: NotificationPlatformRetrySchedulingDecisionProjectionPublicationRecoveryDiagnostics | null =
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

/** Alias for service wiring — derives publication readiness view from W5-N28-c recovery state. */
export function buildNotificationPlatformRetrySchedulingDecisionProjectionPublicationView(
  input: EvaluateNotificationPlatformRetrySchedulingDecisionProjectionPublicationContinuityInput,
): NotificationPlatformRetrySchedulingDecisionProjectionPublicationContinuityView {
  return buildNotificationPlatformRetrySchedulingDecisionProjectionPublicationContinuityProjection(
    input,
  );
}

/**
 * Graceful degradation: publication continuity stays Ready/Degraded while other owners are
 * Degraded/Unavailable — unless its own recovery is Unavailable.
 */
export function notificationPlatformRetrySchedulingDecisionProjectionPublicationContinuesWhileOthersDegraded(input: {
  notificationPlatformRetrySchedulingDecisionProjectionPublicationState: NotificationPlatformRetrySchedulingDecisionProjectionPublicationOperationalState;
  otherOwnerStates: readonly OperationalState[];
}): boolean {
  if (
    input.notificationPlatformRetrySchedulingDecisionProjectionPublicationState === 'Unavailable'
  ) {
    return false;
  }
  return input.otherOwnerStates.some((state) => state === 'Degraded' || state === 'Unavailable');
}
