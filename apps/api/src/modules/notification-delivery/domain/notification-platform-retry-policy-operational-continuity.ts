/**
 * W5-N20-d — Notification Platform Retry Policy operational continuity (pure).
 *
 * Operational state is derived from W5-N20-c recovered anchors + owner health.
 * Supported states only: Recovering | Ready | Degraded | Unavailable.
 * Never hardcodes Ready. Never fabricates readiness or retry policy labels.
 */

import {
  assertOperationalState,
  type OperationalState,
  type NotificationPlatformRetryPolicyContinuityView,
} from '../../operational-continuity/operational-readiness';
import type {
  NotificationPlatformRetryPolicyContinuityRecord,
  NotificationPlatformRetryPolicyOwnerReadiness,
} from './notification-platform-retry-policy-continuity-status';
import type { NotificationPlatformRetryPolicyRecoveryDiagnostics } from './notification-platform-retry-policy-restart-recovery';

export type NotificationPlatformRetryPolicyOperationalState = OperationalState;
export type NotificationPlatformRetryPolicyContinuityProjection =
  NotificationPlatformRetryPolicyContinuityView;

export type EvaluateNotificationPlatformRetryPolicyContinuityInput = Readonly<{
  recovering: boolean;
  ownerReadiness: NotificationPlatformRetryPolicyOwnerReadiness;
  continuity: NotificationPlatformRetryPolicyContinuityRecord | null;
}>;

/**
 * Derive Notification Platform Retry Policy operational state from recovered anchors + owner health.
 * Ready only after successful integrity verification and owner Ready.
 * Integrity failure → Degraded. Recovery failure → Unavailable.
 */
export function evaluateNotificationPlatformRetryPolicyOperationalState(
  input: EvaluateNotificationPlatformRetryPolicyContinuityInput,
): NotificationPlatformRetryPolicyOperationalState {
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

export function buildNotificationPlatformRetryPolicyContinuityProjection(
  input: EvaluateNotificationPlatformRetryPolicyContinuityInput,
): NotificationPlatformRetryPolicyContinuityView {
  const operationalState = evaluateNotificationPlatformRetryPolicyOperationalState(input);
  assertOperationalState(operationalState);

  const diagnostics: NotificationPlatformRetryPolicyRecoveryDiagnostics | null =
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

/** Alias for service wiring — derives retry policy readiness view from W5-N20-c recovery state. */
export function buildNotificationPlatformRetryPolicyView(
  input: EvaluateNotificationPlatformRetryPolicyContinuityInput,
): NotificationPlatformRetryPolicyContinuityView {
  return buildNotificationPlatformRetryPolicyContinuityProjection(input);
}

/**
 * Graceful degradation: Notification Platform Retry Policy continuity stays Ready/Degraded
 * while other owners are Degraded/Unavailable — unless its own recovery is Unavailable.
 */
export function notificationPlatformRetryPolicyContinuesWhileOthersDegraded(input: {
  notificationPlatformRetryPolicyState: NotificationPlatformRetryPolicyOperationalState;
  otherOwnerStates: readonly OperationalState[];
}): boolean {
  if (input.notificationPlatformRetryPolicyState === 'Unavailable') {
    return false;
  }
  return input.otherOwnerStates.some((state) => state === 'Degraded' || state === 'Unavailable');
}
