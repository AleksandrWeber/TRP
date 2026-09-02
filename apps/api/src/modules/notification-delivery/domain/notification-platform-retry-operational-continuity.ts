/**
 * W5-N13-d — Notification Platform Retry operational continuity (pure).
 *
 * Operational state is derived from W5-N13-c recovered anchors + owner health.
 * Supported states only: Recovering | Ready | Degraded | Unavailable.
 * Never hardcodes Ready. Never fabricates readiness or retry labels.
 */

import {
  assertOperationalState,
  type OperationalState,
  type NotificationPlatformRetryContinuityView,
} from '../../operational-continuity/operational-readiness';
import type {
  NotificationPlatformRetryContinuityRecord,
  NotificationPlatformRetryOwnerReadiness,
} from './notification-platform-retry-continuity-status';
import type { NotificationPlatformRetryRecoveryDiagnostics } from './notification-platform-retry-restart-recovery';

export type NotificationPlatformRetryOperationalState = OperationalState;
export type NotificationPlatformRetryContinuityProjection = NotificationPlatformRetryContinuityView;

export type EvaluateNotificationPlatformRetryContinuityInput = Readonly<{
  recovering: boolean;
  ownerReadiness: NotificationPlatformRetryOwnerReadiness;
  continuity: NotificationPlatformRetryContinuityRecord | null;
}>;

/**
 * Derive Notification Platform Retry operational state from recovered anchors + owner health.
 * Ready only after successful integrity verification and owner Ready.
 * Integrity failure → Degraded. Recovery failure → Unavailable.
 */
export function evaluateNotificationPlatformRetryOperationalState(
  input: EvaluateNotificationPlatformRetryContinuityInput,
): NotificationPlatformRetryOperationalState {
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

export function buildNotificationPlatformRetryContinuityProjection(
  input: EvaluateNotificationPlatformRetryContinuityInput,
): NotificationPlatformRetryContinuityView {
  const operationalState = evaluateNotificationPlatformRetryOperationalState(input);
  assertOperationalState(operationalState);

  const diagnostics: NotificationPlatformRetryRecoveryDiagnostics | null =
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

/** Alias for service wiring — derives retry readiness view from W5-N13-c recovery state. */
export function buildNotificationPlatformRetryView(
  input: EvaluateNotificationPlatformRetryContinuityInput,
): NotificationPlatformRetryContinuityView {
  return buildNotificationPlatformRetryContinuityProjection(input);
}

/**
 * Graceful degradation: Notification Platform Retry continuity stays Ready/Degraded
 * while other owners are Degraded/Unavailable — unless its own recovery is Unavailable.
 */
export function notificationPlatformRetryContinuesWhileOthersDegraded(input: {
  notificationPlatformRetryState: NotificationPlatformRetryOperationalState;
  otherOwnerStates: readonly OperationalState[];
}): boolean {
  if (input.notificationPlatformRetryState === 'Unavailable') {
    return false;
  }
  if (
    input.notificationPlatformRetryState !== 'Ready' &&
    input.notificationPlatformRetryState !== 'Degraded'
  ) {
    return false;
  }
  return input.otherOwnerStates.some((state) => state === 'Degraded' || state === 'Unavailable');
}
