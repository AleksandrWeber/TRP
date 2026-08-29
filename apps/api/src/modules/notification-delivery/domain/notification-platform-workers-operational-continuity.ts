/**
 * W5-N09-d — Notification Platform Workers operational continuity (pure).
 *
 * Operational state is derived from W5-N09-c recovered anchors + owner health.
 * Supported states only: Recovering | Ready | Degraded | Unavailable.
 * Never hardcodes Ready. Never fabricates readiness or workers labels.
 */

import {
  assertOperationalState,
  type OperationalState,
  type NotificationPlatformWorkersContinuityView,
} from '../../operational-continuity/operational-readiness';
import type {
  NotificationPlatformWorkersContinuityRecord,
  NotificationPlatformWorkersOwnerReadiness,
} from './notification-platform-workers-continuity-status';
import type { NotificationPlatformWorkersRecoveryDiagnostics } from './notification-platform-workers-restart-recovery';

export type NotificationPlatformWorkersOperationalState = OperationalState;
export type NotificationPlatformWorkersContinuityProjection =
  NotificationPlatformWorkersContinuityView;

export type EvaluateNotificationPlatformWorkersContinuityInput = Readonly<{
  recovering: boolean;
  ownerReadiness: NotificationPlatformWorkersOwnerReadiness;
  continuity: NotificationPlatformWorkersContinuityRecord | null;
}>;

/**
 * Derive Notification Platform Workers operational state from recovered anchors + owner health.
 * Ready only after successful integrity verification and owner Ready.
 * Integrity failure → Degraded. Recovery failure → Unavailable.
 */
export function evaluateNotificationPlatformWorkersOperationalState(
  input: EvaluateNotificationPlatformWorkersContinuityInput,
): NotificationPlatformWorkersOperationalState {
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

export function buildNotificationPlatformWorkersContinuityProjection(
  input: EvaluateNotificationPlatformWorkersContinuityInput,
): NotificationPlatformWorkersContinuityView {
  const operationalState = evaluateNotificationPlatformWorkersOperationalState(input);
  assertOperationalState(operationalState);

  const diagnostics: NotificationPlatformWorkersRecoveryDiagnostics | null =
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

/** Alias for service wiring — derives workers readiness view from W5-N09-c recovery state. */
export function buildNotificationPlatformWorkersView(
  input: EvaluateNotificationPlatformWorkersContinuityInput,
): NotificationPlatformWorkersContinuityView {
  return buildNotificationPlatformWorkersContinuityProjection(input);
}

/**
 * Graceful degradation: Notification Platform Workers continuity stays Ready/Degraded
 * while other owners are Degraded/Unavailable — unless its own recovery is Unavailable.
 */
export function notificationPlatformWorkersContinuesWhileOthersDegraded(input: {
  notificationPlatformWorkersState: NotificationPlatformWorkersOperationalState;
  otherOwnerStates: readonly OperationalState[];
}): boolean {
  if (input.notificationPlatformWorkersState === 'Unavailable') {
    return false;
  }
  if (
    input.notificationPlatformWorkersState !== 'Ready' &&
    input.notificationPlatformWorkersState !== 'Degraded'
  ) {
    return false;
  }
  return input.otherOwnerStates.some((state) => state === 'Degraded' || state === 'Unavailable');
}
