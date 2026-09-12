/**
 * W5-N21-d — Notification Platform Retry Backoff operational continuity (pure).
 *
 * Operational state is derived from W5-N21-c recovered anchors + owner health.
 * Supported states only: Recovering | Ready | Degraded | Unavailable.
 * Never hardcodes Ready. Never fabricates readiness or retry backoff labels.
 */

import {
  assertOperationalState,
  type OperationalState,
  type NotificationPlatformRetryBackoffContinuityView,
} from '../../operational-continuity/operational-readiness';
import type {
  NotificationPlatformRetryBackoffContinuityRecord,
  NotificationPlatformRetryBackoffOwnerReadiness,
} from './notification-platform-retry-backoff-continuity-status';
import type { NotificationPlatformRetryBackoffRecoveryDiagnostics } from './notification-platform-retry-backoff-restart-recovery';

export type NotificationPlatformRetryBackoffOperationalState = OperationalState;
export type NotificationPlatformRetryBackoffContinuityProjection =
  NotificationPlatformRetryBackoffContinuityView;

export type EvaluateNotificationPlatformRetryBackoffContinuityInput = Readonly<{
  recovering: boolean;
  ownerReadiness: NotificationPlatformRetryBackoffOwnerReadiness;
  continuity: NotificationPlatformRetryBackoffContinuityRecord | null;
}>;

/**
 * Derive Notification Platform Retry Backoff operational state from recovered anchors + owner health.
 * Ready only after successful integrity verification and owner Ready.
 * Integrity failure → Degraded. Recovery failure → Unavailable.
 */
export function evaluateNotificationPlatformRetryBackoffOperationalState(
  input: EvaluateNotificationPlatformRetryBackoffContinuityInput,
): NotificationPlatformRetryBackoffOperationalState {
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

export function buildNotificationPlatformRetryBackoffContinuityProjection(
  input: EvaluateNotificationPlatformRetryBackoffContinuityInput,
): NotificationPlatformRetryBackoffContinuityView {
  const operationalState = evaluateNotificationPlatformRetryBackoffOperationalState(input);
  assertOperationalState(operationalState);

  const diagnostics: NotificationPlatformRetryBackoffRecoveryDiagnostics | null =
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

/** Alias for service wiring — derives retry backoff readiness view from W5-N21-c recovery state. */
export function buildNotificationPlatformRetryBackoffView(
  input: EvaluateNotificationPlatformRetryBackoffContinuityInput,
): NotificationPlatformRetryBackoffContinuityView {
  return buildNotificationPlatformRetryBackoffContinuityProjection(input);
}

/**
 * Graceful degradation: Notification Platform Retry Backoff continuity stays Ready/Degraded
 * while other owners are Degraded/Unavailable — unless its own recovery is Unavailable.
 */
export function notificationPlatformRetryBackoffContinuesWhileOthersDegraded(input: {
  notificationPlatformRetryBackoffState: NotificationPlatformRetryBackoffOperationalState;
  otherOwnerStates: readonly OperationalState[];
}): boolean {
  if (input.notificationPlatformRetryBackoffState === 'Unavailable') {
    return false;
  }
  return input.otherOwnerStates.some((state) => state === 'Degraded' || state === 'Unavailable');
}
