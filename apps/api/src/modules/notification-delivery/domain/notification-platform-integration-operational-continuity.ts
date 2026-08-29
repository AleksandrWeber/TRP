/**
 * W5-N05-d — Notification Platform Integration operational continuity (pure).
 *
 * Operational state is derived from W5-N05-c recovered anchors + owner health.
 * Supported states only: Recovering | Ready | Degraded | Unavailable.
 * Never hardcodes Ready. Never fabricates readiness or integration labels.
 */

import {
  assertOperationalState,
  type OperationalState,
  type NotificationPlatformIntegrationContinuityView,
} from '../../operational-continuity/operational-readiness';
import type {
  NotificationPlatformIntegrationContinuityRecord,
  NotificationPlatformIntegrationOwnerReadiness,
} from './notification-platform-integration-continuity-status';
import type { NotificationPlatformIntegrationRecoveryDiagnostics } from './notification-platform-integration-restart-recovery';

export type NotificationPlatformIntegrationOperationalState = OperationalState;
export type NotificationPlatformIntegrationContinuityProjection =
  NotificationPlatformIntegrationContinuityView;

export type EvaluateNotificationPlatformIntegrationContinuityInput = Readonly<{
  recovering: boolean;
  ownerReadiness: NotificationPlatformIntegrationOwnerReadiness;
  continuity: NotificationPlatformIntegrationContinuityRecord | null;
}>;

/**
 * Derive Notification Platform Integration operational state from recovered anchors + owner health.
 * Ready only after successful integrity verification and owner Ready.
 * Integrity failure → Degraded. Recovery failure → Unavailable.
 */
export function evaluateNotificationPlatformIntegrationOperationalState(
  input: EvaluateNotificationPlatformIntegrationContinuityInput,
): NotificationPlatformIntegrationOperationalState {
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

export function buildNotificationPlatformIntegrationContinuityProjection(
  input: EvaluateNotificationPlatformIntegrationContinuityInput,
): NotificationPlatformIntegrationContinuityView {
  const operationalState = evaluateNotificationPlatformIntegrationOperationalState(input);
  assertOperationalState(operationalState);

  const diagnostics: NotificationPlatformIntegrationRecoveryDiagnostics | null =
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
 * Graceful degradation: Notification Platform Integration continuity stays Ready/Degraded
 * while other owners are Degraded/Unavailable — unless its own recovery is Unavailable.
 */
export function notificationPlatformIntegrationContinuesWhileOthersDegraded(input: {
  notificationPlatformIntegrationState: NotificationPlatformIntegrationOperationalState;
  otherOwnerStates: readonly OperationalState[];
}): boolean {
  if (input.notificationPlatformIntegrationState === 'Unavailable') {
    return false;
  }
  if (
    input.notificationPlatformIntegrationState !== 'Ready' &&
    input.notificationPlatformIntegrationState !== 'Degraded'
  ) {
    return false;
  }
  return input.otherOwnerStates.some((state) => state === 'Degraded' || state === 'Unavailable');
}
