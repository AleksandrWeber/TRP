/**
 * W5-N25-d — Notification Platform Retry Scheduling Decision operational continuity (pure).
 *
 * Operational state is derived from W5-N25-c recovered decision anchors + owner health.
 * Supported states only: Recovering | Ready | Degraded | Unavailable.
 * Never hardcodes Ready. Never fabricates readiness or runtime-decision-logic labels.
 */

import {
  assertOperationalState,
  type OperationalState,
  type NotificationPlatformRetrySchedulingDecisionContinuityView,
} from '../../operational-continuity/operational-readiness';
import type {
  NotificationPlatformRetrySchedulingDecisionContinuityRecord,
  NotificationPlatformRetrySchedulingDecisionOwnerReadiness,
} from './notification-platform-retry-scheduling-decision-continuity-status';
import type { NotificationPlatformRetrySchedulingDecisionRecoveryDiagnostics } from './notification-platform-retry-scheduling-decision-restart-recovery';

export type NotificationPlatformRetrySchedulingDecisionOperationalState = OperationalState;
export type NotificationPlatformRetrySchedulingDecisionContinuityProjection =
  NotificationPlatformRetrySchedulingDecisionContinuityView;

export type EvaluateNotificationPlatformRetrySchedulingDecisionContinuityInput = Readonly<{
  recovering: boolean;
  ownerReadiness: NotificationPlatformRetrySchedulingDecisionOwnerReadiness;
  continuity: NotificationPlatformRetrySchedulingDecisionContinuityRecord | null;
}>;

/**
 * Derive Notification Platform Retry Scheduling Decision operational state from recovered
 * anchors + owner health. Ready only after successful integrity verification and owner Ready.
 * Integrity failure → Degraded. Recovery failure → Unavailable.
 */
export function evaluateNotificationPlatformRetrySchedulingDecisionOperationalState(
  input: EvaluateNotificationPlatformRetrySchedulingDecisionContinuityInput,
): NotificationPlatformRetrySchedulingDecisionOperationalState {
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

export function buildNotificationPlatformRetrySchedulingDecisionContinuityProjection(
  input: EvaluateNotificationPlatformRetrySchedulingDecisionContinuityInput,
): NotificationPlatformRetrySchedulingDecisionContinuityView {
  const operationalState =
    evaluateNotificationPlatformRetrySchedulingDecisionOperationalState(input);
  assertOperationalState(operationalState);

  const diagnostics: NotificationPlatformRetrySchedulingDecisionRecoveryDiagnostics | null =
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

/** Alias for service wiring — derives decision readiness view from W5-N25-c recovery state. */
export function buildNotificationPlatformRetrySchedulingDecisionView(
  input: EvaluateNotificationPlatformRetrySchedulingDecisionContinuityInput,
): NotificationPlatformRetrySchedulingDecisionContinuityView {
  return buildNotificationPlatformRetrySchedulingDecisionContinuityProjection(input);
}

/**
 * Graceful degradation: decision continuity stays Ready/Degraded while other owners are
 * Degraded/Unavailable — unless its own recovery is Unavailable.
 */
export function notificationPlatformRetrySchedulingDecisionContinuesWhileOthersDegraded(input: {
  notificationPlatformRetrySchedulingDecisionState: NotificationPlatformRetrySchedulingDecisionOperationalState;
  otherOwnerStates: readonly OperationalState[];
}): boolean {
  if (input.notificationPlatformRetrySchedulingDecisionState === 'Unavailable') {
    return false;
  }
  return input.otherOwnerStates.some((state) => state === 'Degraded' || state === 'Unavailable');
}
