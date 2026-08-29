/**
 * W5-N10-d — Notification Platform Worker Execution operational continuity (pure).
 *
 * Operational state is derived from W5-N10-c recovered anchors + owner health.
 * Supported states only: Recovering | Ready | Degraded | Unavailable.
 * Never hardcodes Ready. Never fabricates readiness or worker execution labels.
 */

import {
  assertOperationalState,
  type OperationalState,
  type NotificationPlatformWorkerExecutionContinuityView,
} from '../../operational-continuity/operational-readiness';
import type {
  NotificationPlatformWorkerExecutionContinuityRecord,
  NotificationPlatformWorkerExecutionOwnerReadiness,
} from './notification-platform-worker-execution-continuity-status';
import type { NotificationPlatformWorkerExecutionRecoveryDiagnostics } from './notification-platform-worker-execution-restart-recovery';

export type NotificationPlatformWorkerExecutionOperationalState = OperationalState;
export type NotificationPlatformWorkerExecutionContinuityProjection =
  NotificationPlatformWorkerExecutionContinuityView;

export type EvaluateNotificationPlatformWorkerExecutionContinuityInput = Readonly<{
  recovering: boolean;
  ownerReadiness: NotificationPlatformWorkerExecutionOwnerReadiness;
  continuity: NotificationPlatformWorkerExecutionContinuityRecord | null;
}>;

/**
 * Derive Notification Platform Worker Execution operational state from recovered anchors + owner health.
 * Ready only after successful integrity verification and owner Ready.
 * Integrity failure → Degraded. Recovery failure → Unavailable.
 */
export function evaluateNotificationPlatformWorkerExecutionOperationalState(
  input: EvaluateNotificationPlatformWorkerExecutionContinuityInput,
): NotificationPlatformWorkerExecutionOperationalState {
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

export function buildNotificationPlatformWorkerExecutionContinuityProjection(
  input: EvaluateNotificationPlatformWorkerExecutionContinuityInput,
): NotificationPlatformWorkerExecutionContinuityView {
  const operationalState = evaluateNotificationPlatformWorkerExecutionOperationalState(input);
  assertOperationalState(operationalState);

  const diagnostics: NotificationPlatformWorkerExecutionRecoveryDiagnostics | null =
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

/** Alias for service wiring — derives worker execution readiness view from W5-N10-c recovery state. */
export function buildNotificationPlatformWorkerExecutionView(
  input: EvaluateNotificationPlatformWorkerExecutionContinuityInput,
): NotificationPlatformWorkerExecutionContinuityView {
  return buildNotificationPlatformWorkerExecutionContinuityProjection(input);
}

/**
 * Graceful degradation: Notification Platform Worker Execution continuity stays Ready/Degraded
 * while other owners are Degraded/Unavailable — unless its own recovery is Unavailable.
 */
export function notificationPlatformWorkerExecutionContinuesWhileOthersDegraded(input: {
  notificationPlatformWorkerExecutionState: NotificationPlatformWorkerExecutionOperationalState;
  otherOwnerStates: readonly OperationalState[];
}): boolean {
  if (input.notificationPlatformWorkerExecutionState === 'Unavailable') {
    return false;
  }
  if (
    input.notificationPlatformWorkerExecutionState !== 'Ready' &&
    input.notificationPlatformWorkerExecutionState !== 'Degraded'
  ) {
    return false;
  }
  return input.otherOwnerStates.some((state) => state === 'Degraded' || state === 'Unavailable');
}
