/**
 * W5-N18-d — Notification Platform Retry Execution operational continuity (pure).
 *
 * Operational state is derived from W5-N18-c recovered anchors + owner health.
 * Supported states only: Recovering | Ready | Degraded | Unavailable.
 * Never hardcodes Ready. Never fabricates readiness or retry execution labels.
 */

import {
  assertOperationalState,
  type OperationalState,
  type NotificationPlatformRetryExecutionContinuityView,
} from '../../operational-continuity/operational-readiness';
import type {
  NotificationPlatformRetryExecutionContinuityRecord,
  NotificationPlatformRetryExecutionOwnerReadiness,
} from './notification-platform-retry-execution-continuity-status';
import type { NotificationPlatformRetryExecutionRecoveryDiagnostics } from './notification-platform-retry-execution-restart-recovery';

export type NotificationPlatformRetryExecutionOperationalState = OperationalState;
export type NotificationPlatformRetryExecutionContinuityProjection =
  NotificationPlatformRetryExecutionContinuityView;

export type EvaluateNotificationPlatformRetryExecutionContinuityInput = Readonly<{
  recovering: boolean;
  ownerReadiness: NotificationPlatformRetryExecutionOwnerReadiness;
  continuity: NotificationPlatformRetryExecutionContinuityRecord | null;
}>;

/**
 * Derive Notification Platform Retry Execution operational state from recovered anchors + owner health.
 * Ready only after successful integrity verification and owner Ready.
 * Integrity failure → Degraded. Recovery failure → Unavailable.
 */
export function evaluateNotificationPlatformRetryExecutionOperationalState(
  input: EvaluateNotificationPlatformRetryExecutionContinuityInput,
): NotificationPlatformRetryExecutionOperationalState {
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

export function buildNotificationPlatformRetryExecutionContinuityProjection(
  input: EvaluateNotificationPlatformRetryExecutionContinuityInput,
): NotificationPlatformRetryExecutionContinuityView {
  const operationalState = evaluateNotificationPlatformRetryExecutionOperationalState(input);
  assertOperationalState(operationalState);

  const diagnostics: NotificationPlatformRetryExecutionRecoveryDiagnostics | null =
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

/** Alias for service wiring — derives retry execution readiness view from W5-N18-c recovery state. */
export function buildNotificationPlatformRetryExecutionView(
  input: EvaluateNotificationPlatformRetryExecutionContinuityInput,
): NotificationPlatformRetryExecutionContinuityView {
  return buildNotificationPlatformRetryExecutionContinuityProjection(input);
}

/**
 * Graceful degradation: Notification Platform Retry Execution continuity stays Ready/Degraded
 * while other owners are Degraded/Unavailable — unless its own recovery is Unavailable.
 */
export function notificationPlatformRetryExecutionContinuesWhileOthersDegraded(input: {
  notificationPlatformRetryExecutionState: NotificationPlatformRetryExecutionOperationalState;
  otherOwnerStates: readonly OperationalState[];
}): boolean {
  if (input.notificationPlatformRetryExecutionState === 'Unavailable') {
    return false;
  }
  return input.otherOwnerStates.some((state) => state === 'Degraded' || state === 'Unavailable');
}
