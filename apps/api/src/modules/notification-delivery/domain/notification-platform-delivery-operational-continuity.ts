/**
 * W5-N06-d — Notification Platform Delivery operational continuity (pure).
 *
 * Operational state is derived from W5-N06-c recovered anchors + owner health.
 * Supported states only: Recovering | Ready | Degraded | Unavailable.
 * Never hardcodes Ready. Never fabricates readiness or delivery labels.
 */

import {
  assertOperationalState,
  type OperationalState,
  type NotificationPlatformDeliveryContinuityView,
} from '../../operational-continuity/operational-readiness';
import type {
  NotificationPlatformDeliveryContinuityRecord,
  NotificationPlatformDeliveryOwnerReadiness,
} from './notification-platform-delivery-continuity-status';
import type { NotificationPlatformDeliveryRecoveryDiagnostics } from './notification-platform-delivery-restart-recovery';

export type NotificationPlatformDeliveryOperationalState = OperationalState;
export type NotificationPlatformDeliveryContinuityProjection =
  NotificationPlatformDeliveryContinuityView;

export type EvaluateNotificationPlatformDeliveryContinuityInput = Readonly<{
  recovering: boolean;
  ownerReadiness: NotificationPlatformDeliveryOwnerReadiness;
  continuity: NotificationPlatformDeliveryContinuityRecord | null;
}>;

/**
 * Derive Notification Platform Delivery operational state from recovered anchors + owner health.
 * Ready only after successful integrity verification and owner Ready.
 * Integrity failure → Degraded. Recovery failure → Unavailable.
 */
export function evaluateNotificationPlatformDeliveryOperationalState(
  input: EvaluateNotificationPlatformDeliveryContinuityInput,
): NotificationPlatformDeliveryOperationalState {
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

export function buildNotificationPlatformDeliveryContinuityProjection(
  input: EvaluateNotificationPlatformDeliveryContinuityInput,
): NotificationPlatformDeliveryContinuityView {
  const operationalState = evaluateNotificationPlatformDeliveryOperationalState(input);
  assertOperationalState(operationalState);

  const diagnostics: NotificationPlatformDeliveryRecoveryDiagnostics | null =
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
 * Graceful degradation: Notification Platform Delivery continuity stays Ready/Degraded
 * while other owners are Degraded/Unavailable — unless its own recovery is Unavailable.
 */
export function notificationPlatformDeliveryContinuesWhileOthersDegraded(input: {
  notificationPlatformDeliveryState: NotificationPlatformDeliveryOperationalState;
  otherOwnerStates: readonly OperationalState[];
}): boolean {
  if (input.notificationPlatformDeliveryState === 'Unavailable') {
    return false;
  }
  if (
    input.notificationPlatformDeliveryState !== 'Ready' &&
    input.notificationPlatformDeliveryState !== 'Degraded'
  ) {
    return false;
  }
  return input.otherOwnerStates.some((state) => state === 'Degraded' || state === 'Unavailable');
}
