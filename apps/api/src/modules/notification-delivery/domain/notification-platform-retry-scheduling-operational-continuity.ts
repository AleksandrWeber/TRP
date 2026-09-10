/**
 * W5-N19-d — Notification Platform Retry Scheduling operational continuity (pure).
 *
 * Operational state is derived from W5-N19-c recovered anchors + owner health.
 * Supported states only: Recovering | Ready | Degraded | Unavailable.
 * Never hardcodes Ready. Never fabricates readiness or retry scheduling labels.
 */

import {
  assertOperationalState,
  type OperationalState,
  type NotificationPlatformRetrySchedulingContinuityView,
} from '../../operational-continuity/operational-readiness';
import type {
  NotificationPlatformRetrySchedulingContinuityRecord,
  NotificationPlatformRetrySchedulingOwnerReadiness,
} from './notification-platform-retry-scheduling-continuity-status';
import type { NotificationPlatformRetrySchedulingRecoveryDiagnostics } from './notification-platform-retry-scheduling-restart-recovery';

export type NotificationPlatformRetrySchedulingOperationalState = OperationalState;
export type NotificationPlatformRetrySchedulingContinuityProjection =
  NotificationPlatformRetrySchedulingContinuityView;

export type EvaluateNotificationPlatformRetrySchedulingContinuityInput = Readonly<{
  recovering: boolean;
  ownerReadiness: NotificationPlatformRetrySchedulingOwnerReadiness;
  continuity: NotificationPlatformRetrySchedulingContinuityRecord | null;
}>;

/**
 * Derive Notification Platform Retry Scheduling operational state from recovered anchors + owner health.
 * Ready only after successful integrity verification and owner Ready.
 * Integrity failure → Degraded. Recovery failure → Unavailable.
 */
export function evaluateNotificationPlatformRetrySchedulingOperationalState(
  input: EvaluateNotificationPlatformRetrySchedulingContinuityInput,
): NotificationPlatformRetrySchedulingOperationalState {
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

export function buildNotificationPlatformRetrySchedulingContinuityProjection(
  input: EvaluateNotificationPlatformRetrySchedulingContinuityInput,
): NotificationPlatformRetrySchedulingContinuityView {
  const operationalState = evaluateNotificationPlatformRetrySchedulingOperationalState(input);
  assertOperationalState(operationalState);

  const diagnostics: NotificationPlatformRetrySchedulingRecoveryDiagnostics | null =
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

/** Alias for service wiring — derives retry scheduling readiness view from W5-N19-c recovery state. */
export function buildNotificationPlatformRetrySchedulingView(
  input: EvaluateNotificationPlatformRetrySchedulingContinuityInput,
): NotificationPlatformRetrySchedulingContinuityView {
  return buildNotificationPlatformRetrySchedulingContinuityProjection(input);
}

/**
 * Graceful degradation: Notification Platform Retry Scheduling continuity stays Ready/Degraded
 * while other owners are Degraded/Unavailable — unless its own recovery is Unavailable.
 */
export function notificationPlatformRetrySchedulingContinuesWhileOthersDegraded(input: {
  notificationPlatformRetrySchedulingState: NotificationPlatformRetrySchedulingOperationalState;
  otherOwnerStates: readonly OperationalState[];
}): boolean {
  if (input.notificationPlatformRetrySchedulingState === 'Unavailable') {
    return false;
  }
  return input.otherOwnerStates.some((state) => state === 'Degraded' || state === 'Unavailable');
}
