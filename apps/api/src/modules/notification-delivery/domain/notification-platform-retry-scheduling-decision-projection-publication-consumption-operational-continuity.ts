/**
 * W5-N29-d — Notification Platform Retry Scheduling Decision Projection Publication Consumption operational continuity (pure).
 *
 * Operational state is derived from W5-N29-c recovered consumption anchors + owner health.
 * Supported states only: Recovering | Ready | Degraded | Unavailable.
 * Never hardcodes Ready. Never fabricates readiness or runtime-consumption labels.
 */

import {
  assertOperationalState,
  type OperationalState,
  type NotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionContinuityView,
} from '../../operational-continuity/operational-readiness';
import type {
  NotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionContinuityRecord,
  NotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionOwnerReadiness,
} from './notification-platform-retry-scheduling-decision-projection-publication-consumption-continuity-status';
import type { NotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionRecoveryDiagnostics } from './notification-platform-retry-scheduling-decision-projection-publication-consumption-restart-recovery';

export type NotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionOperationalState =
  OperationalState;
export type NotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionContinuityProjection =
  NotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionContinuityView;

export type EvaluateNotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionContinuityInput =
  Readonly<{
    recovering: boolean;
    ownerReadiness: NotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionOwnerReadiness;
    continuity: NotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionContinuityRecord | null;
  }>;

/**
 * Derive Notification Platform Retry Scheduling Decision Projection Publication Consumption operational state from recovered
 * anchors + owner health. Ready only after successful integrity verification and owner Ready.
 * Integrity failure → Degraded. Recovery failure → Unavailable.
 */
export function evaluateNotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionOperationalState(
  input: EvaluateNotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionContinuityInput,
): NotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionOperationalState {
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

export function buildNotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionContinuityProjection(
  input: EvaluateNotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionContinuityInput,
): NotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionContinuityView {
  const operationalState =
    evaluateNotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionOperationalState(
      input,
    );
  assertOperationalState(operationalState);

  const diagnostics: NotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionRecoveryDiagnostics | null =
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

/** Alias for service wiring — derives consumption readiness view from W5-N29-c recovery state. */
export function buildNotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionView(
  input: EvaluateNotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionContinuityInput,
): NotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionContinuityView {
  return buildNotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionContinuityProjection(
    input,
  );
}

/**
 * Graceful degradation: publication consumption continuity stays Ready/Degraded while other owners are
 * Degraded/Unavailable — unless its own recovery is Unavailable.
 */
export function notificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionContinuesWhileOthersDegraded(input: {
  notificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionState: NotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionOperationalState;
  otherOwnerStates: readonly OperationalState[];
}): boolean {
  if (
    input.notificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionState ===
    'Unavailable'
  ) {
    return false;
  }
  return input.otherOwnerStates.some((state) => state === 'Degraded' || state === 'Unavailable');
}
