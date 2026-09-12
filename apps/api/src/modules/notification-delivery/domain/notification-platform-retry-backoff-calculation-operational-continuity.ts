/**
 * W5-N22-d — Notification Platform Retry Backoff Calculation operational continuity (pure).
 *
 * Operational state is derived from W5-N22-c recovered calculation anchors + owner health.
 * Supported states only: Recovering | Ready | Degraded | Unavailable.
 * Never hardcodes Ready. Never fabricates readiness or calculation-runtime labels.
 */

import {
  assertOperationalState,
  type OperationalState,
  type NotificationPlatformRetryBackoffCalculationContinuityView,
} from '../../operational-continuity/operational-readiness';
import type {
  NotificationPlatformRetryBackoffCalculationContinuityRecord,
  NotificationPlatformRetryBackoffCalculationOwnerReadiness,
} from './notification-platform-retry-backoff-calculation-continuity-status';
import type { NotificationPlatformRetryBackoffCalculationRecoveryDiagnostics } from './notification-platform-retry-backoff-calculation-restart-recovery';

export type NotificationPlatformRetryBackoffCalculationOperationalState = OperationalState;
export type NotificationPlatformRetryBackoffCalculationContinuityProjection =
  NotificationPlatformRetryBackoffCalculationContinuityView;

export type EvaluateNotificationPlatformRetryBackoffCalculationContinuityInput = Readonly<{
  recovering: boolean;
  ownerReadiness: NotificationPlatformRetryBackoffCalculationOwnerReadiness;
  continuity: NotificationPlatformRetryBackoffCalculationContinuityRecord | null;
}>;

/**
 * Derive Notification Platform Retry Backoff Calculation operational state from recovered
 * anchors + owner health. Ready only after successful integrity verification and owner Ready.
 * Integrity failure → Degraded. Recovery failure → Unavailable.
 */
export function evaluateNotificationPlatformRetryBackoffCalculationOperationalState(
  input: EvaluateNotificationPlatformRetryBackoffCalculationContinuityInput,
): NotificationPlatformRetryBackoffCalculationOperationalState {
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

export function buildNotificationPlatformRetryBackoffCalculationContinuityProjection(
  input: EvaluateNotificationPlatformRetryBackoffCalculationContinuityInput,
): NotificationPlatformRetryBackoffCalculationContinuityView {
  const operationalState =
    evaluateNotificationPlatformRetryBackoffCalculationOperationalState(input);
  assertOperationalState(operationalState);

  const diagnostics: NotificationPlatformRetryBackoffCalculationRecoveryDiagnostics | null =
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

/** Alias for service wiring — derives calculation readiness view from W5-N22-c recovery state. */
export function buildNotificationPlatformRetryBackoffCalculationView(
  input: EvaluateNotificationPlatformRetryBackoffCalculationContinuityInput,
): NotificationPlatformRetryBackoffCalculationContinuityView {
  return buildNotificationPlatformRetryBackoffCalculationContinuityProjection(input);
}

/**
 * Graceful degradation: calculation continuity stays Ready/Degraded while other owners are
 * Degraded/Unavailable — unless its own recovery is Unavailable.
 */
export function notificationPlatformRetryBackoffCalculationContinuesWhileOthersDegraded(input: {
  notificationPlatformRetryBackoffCalculationState: NotificationPlatformRetryBackoffCalculationOperationalState;
  otherOwnerStates: readonly OperationalState[];
}): boolean {
  if (input.notificationPlatformRetryBackoffCalculationState === 'Unavailable') {
    return false;
  }
  return input.otherOwnerStates.some((state) => state === 'Degraded' || state === 'Unavailable');
}
