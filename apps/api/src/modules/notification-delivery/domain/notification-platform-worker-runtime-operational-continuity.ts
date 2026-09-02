/**
 * W5-N11-d — Notification Platform Worker Runtime operational continuity (pure).
 *
 * Operational state is derived from W5-N11-c recovered anchors + owner health.
 * Supported states only: Recovering | Ready | Degraded | Unavailable.
 * Never hardcodes Ready. Never fabricates readiness or worker runtime labels.
 */

import {
  assertOperationalState,
  type OperationalState,
  type NotificationPlatformWorkerRuntimeContinuityView,
} from '../../operational-continuity/operational-readiness';
import type {
  NotificationPlatformWorkerRuntimeContinuityRecord,
  NotificationPlatformWorkerRuntimeOwnerReadiness,
} from './notification-platform-worker-runtime-continuity-status';
import type { NotificationPlatformWorkerRuntimeRecoveryDiagnostics } from './notification-platform-worker-runtime-restart-recovery';

export type NotificationPlatformWorkerRuntimeOperationalState = OperationalState;
export type NotificationPlatformWorkerRuntimeContinuityProjection =
  NotificationPlatformWorkerRuntimeContinuityView;

export type EvaluateNotificationPlatformWorkerRuntimeContinuityInput = Readonly<{
  recovering: boolean;
  ownerReadiness: NotificationPlatformWorkerRuntimeOwnerReadiness;
  continuity: NotificationPlatformWorkerRuntimeContinuityRecord | null;
}>;

/**
 * Derive Notification Platform Worker Runtime operational state from recovered anchors + owner health.
 * Ready only after successful integrity verification and owner Ready.
 * Integrity failure → Degraded. Recovery failure → Unavailable.
 */
export function evaluateNotificationPlatformWorkerRuntimeOperationalState(
  input: EvaluateNotificationPlatformWorkerRuntimeContinuityInput,
): NotificationPlatformWorkerRuntimeOperationalState {
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

export function buildNotificationPlatformWorkerRuntimeContinuityProjection(
  input: EvaluateNotificationPlatformWorkerRuntimeContinuityInput,
): NotificationPlatformWorkerRuntimeContinuityView {
  const operationalState = evaluateNotificationPlatformWorkerRuntimeOperationalState(input);
  assertOperationalState(operationalState);

  const diagnostics: NotificationPlatformWorkerRuntimeRecoveryDiagnostics | null =
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

/** Alias for service wiring — derives worker runtime readiness view from W5-N11-c recovery state. */
export function buildNotificationPlatformWorkerRuntimeView(
  input: EvaluateNotificationPlatformWorkerRuntimeContinuityInput,
): NotificationPlatformWorkerRuntimeContinuityView {
  return buildNotificationPlatformWorkerRuntimeContinuityProjection(input);
}

/**
 * Graceful degradation: Notification Platform Worker Runtime continuity stays Ready/Degraded
 * while other owners are Degraded/Unavailable — unless its own recovery is Unavailable.
 */
export function notificationPlatformWorkerRuntimeContinuesWhileOthersDegraded(input: {
  notificationPlatformWorkerRuntimeState: NotificationPlatformWorkerRuntimeOperationalState;
  otherOwnerStates: readonly OperationalState[];
}): boolean {
  if (input.notificationPlatformWorkerRuntimeState === 'Unavailable') {
    return false;
  }
  if (
    input.notificationPlatformWorkerRuntimeState !== 'Ready' &&
    input.notificationPlatformWorkerRuntimeState !== 'Degraded'
  ) {
    return false;
  }
  return input.otherOwnerStates.some((state) => state === 'Degraded' || state === 'Unavailable');
}
