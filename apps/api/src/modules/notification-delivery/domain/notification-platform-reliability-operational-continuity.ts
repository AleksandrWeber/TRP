/**
 * W5-N17-d — Notification Platform Delivery Reliability operational continuity (pure).
 *
 * Operational state is derived from W5-N17-c recovered anchors + owner health.
 * Supported states only: Recovering | Ready | Degraded | Unavailable.
 * Never hardcodes Ready. Never fabricates readiness or delivery reliability labels.
 */

import {
  assertOperationalState,
  type OperationalState,
  type NotificationPlatformReliabilityContinuityView,
} from '../../operational-continuity/operational-readiness';
import type {
  NotificationPlatformReliabilityContinuityRecord,
  NotificationPlatformReliabilityOwnerReadiness,
} from './notification-platform-reliability-continuity-status';
import type { NotificationPlatformReliabilityRecoveryDiagnostics } from './notification-platform-reliability-restart-recovery';

export type NotificationPlatformReliabilityOperationalState = OperationalState;
export type NotificationPlatformReliabilityContinuityProjection =
  NotificationPlatformReliabilityContinuityView;

export type EvaluateNotificationPlatformReliabilityContinuityInput = Readonly<{
  recovering: boolean;
  ownerReadiness: NotificationPlatformReliabilityOwnerReadiness;
  continuity: NotificationPlatformReliabilityContinuityRecord | null;
}>;

/**
 * Derive Notification Platform Delivery Reliability operational state from recovered anchors + owner health.
 * Ready only after successful integrity verification and owner Ready.
 * Integrity failure → Degraded. Recovery failure → Unavailable.
 */
export function evaluateNotificationPlatformReliabilityOperationalState(
  input: EvaluateNotificationPlatformReliabilityContinuityInput,
): NotificationPlatformReliabilityOperationalState {
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

export function buildNotificationPlatformReliabilityContinuityProjection(
  input: EvaluateNotificationPlatformReliabilityContinuityInput,
): NotificationPlatformReliabilityContinuityView {
  const operationalState = evaluateNotificationPlatformReliabilityOperationalState(input);
  assertOperationalState(operationalState);

  const diagnostics: NotificationPlatformReliabilityRecoveryDiagnostics | null =
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

/** Alias for service wiring — derives reliability readiness view from W5-N17-c recovery state. */
export function buildNotificationPlatformReliabilityView(
  input: EvaluateNotificationPlatformReliabilityContinuityInput,
): NotificationPlatformReliabilityContinuityView {
  return buildNotificationPlatformReliabilityContinuityProjection(input);
}

/**
 * Graceful degradation: Notification Platform Delivery Reliability continuity stays Ready/Degraded
 * while other owners are Degraded/Unavailable — unless its own recovery is Unavailable.
 */
export function notificationPlatformReliabilityContinuesWhileOthersDegraded(input: {
  notificationPlatformReliabilityState: NotificationPlatformReliabilityOperationalState;
  otherOwnerStates: readonly OperationalState[];
}): boolean {
  if (input.notificationPlatformReliabilityState === 'Unavailable') {
    return false;
  }
  return input.otherOwnerStates.some((state) => state === 'Degraded' || state === 'Unavailable');
}
