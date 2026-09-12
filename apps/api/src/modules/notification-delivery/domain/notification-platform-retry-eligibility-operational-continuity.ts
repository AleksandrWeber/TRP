/**
 * W5-N23-d — Notification Platform Retry Eligibility operational continuity (pure).
 *
 * Operational state is derived from W5-N23-c recovered eligibility anchors + owner health.
 * Supported states only: Recovering | Ready | Degraded | Unavailable.
 * Never hardcodes Ready. Never fabricates readiness or eligibility-evaluation-runtime labels.
 */

import {
  assertOperationalState,
  type OperationalState,
  type NotificationPlatformRetryEligibilityContinuityView,
} from '../../operational-continuity/operational-readiness';
import type {
  NotificationPlatformRetryEligibilityContinuityRecord,
  NotificationPlatformRetryEligibilityOwnerReadiness,
} from './notification-platform-retry-eligibility-continuity-status';
import type { NotificationPlatformRetryEligibilityRecoveryDiagnostics } from './notification-platform-retry-eligibility-restart-recovery';

export type NotificationPlatformRetryEligibilityOperationalState = OperationalState;
export type NotificationPlatformRetryEligibilityContinuityProjection =
  NotificationPlatformRetryEligibilityContinuityView;

export type EvaluateNotificationPlatformRetryEligibilityContinuityInput = Readonly<{
  recovering: boolean;
  ownerReadiness: NotificationPlatformRetryEligibilityOwnerReadiness;
  continuity: NotificationPlatformRetryEligibilityContinuityRecord | null;
}>;

/**
 * Derive Notification Platform Retry Eligibility operational state from recovered
 * anchors + owner health. Ready only after successful integrity verification and owner Ready.
 * Integrity failure → Degraded. Recovery failure → Unavailable.
 */
export function evaluateNotificationPlatformRetryEligibilityOperationalState(
  input: EvaluateNotificationPlatformRetryEligibilityContinuityInput,
): NotificationPlatformRetryEligibilityOperationalState {
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

export function buildNotificationPlatformRetryEligibilityContinuityProjection(
  input: EvaluateNotificationPlatformRetryEligibilityContinuityInput,
): NotificationPlatformRetryEligibilityContinuityView {
  const operationalState = evaluateNotificationPlatformRetryEligibilityOperationalState(input);
  assertOperationalState(operationalState);

  const diagnostics: NotificationPlatformRetryEligibilityRecoveryDiagnostics | null =
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

/** Alias for service wiring — derives eligibility readiness view from W5-N23-c recovery state. */
export function buildNotificationPlatformRetryEligibilityView(
  input: EvaluateNotificationPlatformRetryEligibilityContinuityInput,
): NotificationPlatformRetryEligibilityContinuityView {
  return buildNotificationPlatformRetryEligibilityContinuityProjection(input);
}

/**
 * Graceful degradation: eligibility continuity stays Ready/Degraded while other owners are
 * Degraded/Unavailable — unless its own recovery is Unavailable.
 */
export function notificationPlatformRetryEligibilityContinuesWhileOthersDegraded(input: {
  notificationPlatformRetryEligibilityState: NotificationPlatformRetryEligibilityOperationalState;
  otherOwnerStates: readonly OperationalState[];
}): boolean {
  if (input.notificationPlatformRetryEligibilityState === 'Unavailable') {
    return false;
  }
  return input.otherOwnerStates.some((state) => state === 'Degraded' || state === 'Unavailable');
}
