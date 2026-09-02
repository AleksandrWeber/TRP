/**
 * W5-N12-d — Notification Platform Scheduler operational continuity (pure).
 *
 * Operational state is derived from W5-N12-c recovered anchors + owner health.
 * Supported states only: Recovering | Ready | Degraded | Unavailable.
 * Never hardcodes Ready. Never fabricates readiness or scheduler labels.
 */

import {
  assertOperationalState,
  type OperationalState,
  type NotificationPlatformSchedulerContinuityView,
} from '../../operational-continuity/operational-readiness';
import type {
  NotificationPlatformSchedulerContinuityRecord,
  NotificationPlatformSchedulerOwnerReadiness,
} from './notification-platform-scheduler-continuity-status';
import type { NotificationPlatformSchedulerRecoveryDiagnostics } from './notification-platform-scheduler-restart-recovery';

export type NotificationPlatformSchedulerOperationalState = OperationalState;
export type NotificationPlatformSchedulerContinuityProjection =
  NotificationPlatformSchedulerContinuityView;

export type EvaluateNotificationPlatformSchedulerContinuityInput = Readonly<{
  recovering: boolean;
  ownerReadiness: NotificationPlatformSchedulerOwnerReadiness;
  continuity: NotificationPlatformSchedulerContinuityRecord | null;
}>;

/**
 * Derive Notification Platform Scheduler operational state from recovered anchors + owner health.
 * Ready only after successful integrity verification and owner Ready.
 * Integrity failure → Degraded. Recovery failure → Unavailable.
 */
export function evaluateNotificationPlatformSchedulerOperationalState(
  input: EvaluateNotificationPlatformSchedulerContinuityInput,
): NotificationPlatformSchedulerOperationalState {
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

export function buildNotificationPlatformSchedulerContinuityProjection(
  input: EvaluateNotificationPlatformSchedulerContinuityInput,
): NotificationPlatformSchedulerContinuityView {
  const operationalState = evaluateNotificationPlatformSchedulerOperationalState(input);
  assertOperationalState(operationalState);

  const diagnostics: NotificationPlatformSchedulerRecoveryDiagnostics | null =
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

/** Alias for service wiring — derives scheduler readiness view from W5-N12-c recovery state. */
export function buildNotificationPlatformSchedulerView(
  input: EvaluateNotificationPlatformSchedulerContinuityInput,
): NotificationPlatformSchedulerContinuityView {
  return buildNotificationPlatformSchedulerContinuityProjection(input);
}

/**
 * Graceful degradation: Notification Platform Scheduler continuity stays Ready/Degraded
 * while other owners are Degraded/Unavailable — unless its own recovery is Unavailable.
 */
export function notificationPlatformSchedulerContinuesWhileOthersDegraded(input: {
  notificationPlatformSchedulerState: NotificationPlatformSchedulerOperationalState;
  otherOwnerStates: readonly OperationalState[];
}): boolean {
  if (input.notificationPlatformSchedulerState === 'Unavailable') {
    return false;
  }
  if (
    input.notificationPlatformSchedulerState !== 'Ready' &&
    input.notificationPlatformSchedulerState !== 'Degraded'
  ) {
    return false;
  }
  return input.otherOwnerStates.some((state) => state === 'Degraded' || state === 'Unavailable');
}
