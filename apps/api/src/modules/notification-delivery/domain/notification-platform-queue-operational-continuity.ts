/**
 * W5-N08-d — Notification Platform Queue operational continuity (pure).
 *
 * Operational state is derived from W5-N08-c recovered anchors + owner health.
 * Supported states only: Recovering | Ready | Degraded | Unavailable.
 * Never hardcodes Ready. Never fabricates readiness or queue labels.
 */

import {
  assertOperationalState,
  type OperationalState,
  type NotificationPlatformQueueContinuityView,
} from '../../operational-continuity/operational-readiness';
import type {
  NotificationPlatformQueueContinuityRecord,
  NotificationPlatformQueueOwnerReadiness,
} from './notification-platform-queue-continuity-status';
import type { NotificationPlatformQueueRecoveryDiagnostics } from './notification-platform-queue-restart-recovery';

export type NotificationPlatformQueueOperationalState = OperationalState;
export type NotificationPlatformQueueContinuityProjection = NotificationPlatformQueueContinuityView;

export type EvaluateNotificationPlatformQueueContinuityInput = Readonly<{
  recovering: boolean;
  ownerReadiness: NotificationPlatformQueueOwnerReadiness;
  continuity: NotificationPlatformQueueContinuityRecord | null;
}>;

/**
 * Derive Notification Platform Queue operational state from recovered anchors + owner health.
 * Ready only after successful integrity verification and owner Ready.
 * Integrity failure → Degraded. Recovery failure → Unavailable.
 */
export function evaluateNotificationPlatformQueueOperationalState(
  input: EvaluateNotificationPlatformQueueContinuityInput,
): NotificationPlatformQueueOperationalState {
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

export function buildNotificationPlatformQueueContinuityProjection(
  input: EvaluateNotificationPlatformQueueContinuityInput,
): NotificationPlatformQueueContinuityView {
  const operationalState = evaluateNotificationPlatformQueueOperationalState(input);
  assertOperationalState(operationalState);

  const diagnostics: NotificationPlatformQueueRecoveryDiagnostics | null =
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
 * Graceful degradation: Notification Platform Queue continuity stays Ready/Degraded
 * while other owners are Degraded/Unavailable — unless its own recovery is Unavailable.
 */
export function notificationPlatformQueueContinuesWhileOthersDegraded(input: {
  notificationPlatformQueueState: NotificationPlatformQueueOperationalState;
  otherOwnerStates: readonly OperationalState[];
}): boolean {
  if (input.notificationPlatformQueueState === 'Unavailable') {
    return false;
  }
  if (
    input.notificationPlatformQueueState !== 'Ready' &&
    input.notificationPlatformQueueState !== 'Degraded'
  ) {
    return false;
  }
  return input.otherOwnerStates.some((state) => state === 'Degraded' || state === 'Unavailable');
}
