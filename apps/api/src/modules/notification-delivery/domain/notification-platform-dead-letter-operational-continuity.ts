/**
 * W5-N14-d — Notification Platform Dead Letter operational continuity (pure).
 *
 * Operational state is derived from W5-N14-c recovered anchors + owner health.
 * Supported states only: Recovering | Ready | Degraded | Unavailable.
 * Never hardcodes Ready. Never fabricates readiness or dead-letter labels.
 */

import {
  assertOperationalState,
  type OperationalState,
  type NotificationPlatformDeadLetterContinuityView,
} from '../../operational-continuity/operational-readiness';
import type {
  NotificationPlatformDeadLetterContinuityRecord,
  NotificationPlatformDeadLetterOwnerReadiness,
} from './notification-platform-dead-letter-continuity-status';
import type { NotificationPlatformDeadLetterRecoveryDiagnostics } from './notification-platform-dead-letter-restart-recovery';

export type NotificationPlatformDeadLetterOperationalState = OperationalState;
export type NotificationPlatformDeadLetterContinuityProjection =
  NotificationPlatformDeadLetterContinuityView;

export type EvaluateNotificationPlatformDeadLetterContinuityInput = Readonly<{
  recovering: boolean;
  ownerReadiness: NotificationPlatformDeadLetterOwnerReadiness;
  continuity: NotificationPlatformDeadLetterContinuityRecord | null;
}>;

/**
 * Derive Notification Platform Dead Letter operational state from recovered anchors + owner health.
 * Ready only after successful integrity verification and owner Ready.
 * Integrity failure → Degraded. Recovery failure → Unavailable.
 */
export function evaluateNotificationPlatformDeadLetterOperationalState(
  input: EvaluateNotificationPlatformDeadLetterContinuityInput,
): NotificationPlatformDeadLetterOperationalState {
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

export function buildNotificationPlatformDeadLetterContinuityProjection(
  input: EvaluateNotificationPlatformDeadLetterContinuityInput,
): NotificationPlatformDeadLetterContinuityView {
  const operationalState = evaluateNotificationPlatformDeadLetterOperationalState(input);
  assertOperationalState(operationalState);

  const diagnostics: NotificationPlatformDeadLetterRecoveryDiagnostics | null =
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

/** Alias for service wiring — derives dead-letter readiness view from W5-N14-c recovery state. */
export function buildNotificationPlatformDeadLetterView(
  input: EvaluateNotificationPlatformDeadLetterContinuityInput,
): NotificationPlatformDeadLetterContinuityView {
  return buildNotificationPlatformDeadLetterContinuityProjection(input);
}

/**
 * Graceful degradation: Notification Platform Dead Letter continuity stays Ready/Degraded
 * while other owners are Degraded/Unavailable — unless its own recovery is Unavailable.
 */
export function notificationPlatformDeadLetterContinuesWhileOthersDegraded(input: {
  notificationPlatformDeadLetterState: NotificationPlatformDeadLetterOperationalState;
  otherOwnerStates: readonly OperationalState[];
}): boolean {
  if (input.notificationPlatformDeadLetterState === 'Unavailable') {
    return false;
  }
  return input.otherOwnerStates.some((state) => state === 'Degraded' || state === 'Unavailable');
}
