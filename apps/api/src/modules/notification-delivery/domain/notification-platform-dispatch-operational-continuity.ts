/**
 * W5-N07-d — Notification Platform Dispatch operational continuity (pure).
 *
 * Operational state is derived from W5-N07-c recovered anchors + owner health.
 * Supported states only: Recovering | Ready | Degraded | Unavailable.
 * Never hardcodes Ready. Never fabricates readiness or dispatch labels.
 */

import {
  assertOperationalState,
  type OperationalState,
  type NotificationPlatformDispatchContinuityView,
} from '../../operational-continuity/operational-readiness';
import type {
  NotificationPlatformDispatchContinuityRecord,
  NotificationPlatformDispatchOwnerReadiness,
} from './notification-platform-dispatch-continuity-status';
import type { NotificationPlatformDispatchRecoveryDiagnostics } from './notification-platform-dispatch-restart-recovery';

export type NotificationPlatformDispatchOperationalState = OperationalState;
export type NotificationPlatformDispatchContinuityProjection =
  NotificationPlatformDispatchContinuityView;

export type EvaluateNotificationPlatformDispatchContinuityInput = Readonly<{
  recovering: boolean;
  ownerReadiness: NotificationPlatformDispatchOwnerReadiness;
  continuity: NotificationPlatformDispatchContinuityRecord | null;
}>;

/**
 * Derive Notification Platform Dispatch operational state from recovered anchors + owner health.
 * Ready only after successful integrity verification and owner Ready.
 * Integrity failure → Degraded. Recovery failure → Unavailable.
 */
export function evaluateNotificationPlatformDispatchOperationalState(
  input: EvaluateNotificationPlatformDispatchContinuityInput,
): NotificationPlatformDispatchOperationalState {
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

export function buildNotificationPlatformDispatchContinuityProjection(
  input: EvaluateNotificationPlatformDispatchContinuityInput,
): NotificationPlatformDispatchContinuityView {
  const operationalState = evaluateNotificationPlatformDispatchOperationalState(input);
  assertOperationalState(operationalState);

  const diagnostics: NotificationPlatformDispatchRecoveryDiagnostics | null =
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

/**
 * Graceful degradation: Notification Platform Dispatch continuity stays Ready/Degraded
 * while other owners are Degraded/Unavailable — unless its own recovery is Unavailable.
 */
export function notificationPlatformDispatchContinuesWhileOthersDegraded(input: {
  notificationPlatformDispatchState: NotificationPlatformDispatchOperationalState;
  otherOwnerStates: readonly OperationalState[];
}): boolean {
  if (input.notificationPlatformDispatchState === 'Unavailable') {
    return false;
  }
  if (
    input.notificationPlatformDispatchState !== 'Ready' &&
    input.notificationPlatformDispatchState !== 'Degraded'
  ) {
    return false;
  }
  return input.otherOwnerStates.some((state) => state === 'Degraded' || state === 'Unavailable');
}
