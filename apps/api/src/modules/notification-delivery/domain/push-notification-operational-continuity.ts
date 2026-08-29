/**
 * W5-N04-d — Push Notification operational continuity (pure).
 *
 * Operational state is derived from W5-N04-c recovered anchors + owner health.
 * Supported states only: Recovering | Ready | Degraded | Unavailable.
 * Never hardcodes Ready. Never fabricates readiness or delivery labels.
 */

import {
  assertOperationalState,
  type OperationalState,
  type PushNotificationContinuityView,
} from '../../operational-continuity/operational-readiness';
import type {
  PushNotificationContinuityRecord,
  PushNotificationOwnerReadiness,
} from './push-notification-continuity-status';
import type { PushNotificationRecoveryDiagnostics } from './push-notification-restart-recovery';

export type PushNotificationOperationalState = OperationalState;
export type PushNotificationContinuityProjection = PushNotificationContinuityView;

export type EvaluatePushNotificationContinuityInput = Readonly<{
  recovering: boolean;
  ownerReadiness: PushNotificationOwnerReadiness;
  continuity: PushNotificationContinuityRecord | null;
}>;

/**
 * Derive Push Notification operational state from recovered anchors + owner health.
 * Ready only after successful integrity verification and owner Ready.
 * Integrity failure → Degraded. Recovery failure → Unavailable.
 */
export function evaluatePushNotificationOperationalState(
  input: EvaluatePushNotificationContinuityInput,
): PushNotificationOperationalState {
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

export function buildPushNotificationContinuityProjection(
  input: EvaluatePushNotificationContinuityInput,
): PushNotificationContinuityView {
  const operationalState = evaluatePushNotificationOperationalState(input);
  assertOperationalState(operationalState);

  const diagnostics: PushNotificationRecoveryDiagnostics | null =
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
 * Graceful degradation: Push Notification continuity stays Ready/Degraded
 * while other owners are Degraded/Unavailable — unless its own recovery is Unavailable.
 */
export function pushNotificationContinuesWhileOthersDegraded(input: {
  pushNotificationState: PushNotificationOperationalState;
  otherOwnerStates: readonly OperationalState[];
}): boolean {
  if (input.pushNotificationState === 'Unavailable') {
    return false;
  }
  if (input.pushNotificationState !== 'Ready' && input.pushNotificationState !== 'Degraded') {
    return false;
  }
  return input.otherOwnerStates.some((state) => state === 'Degraded' || state === 'Unavailable');
}
