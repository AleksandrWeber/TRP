/**
 * W5-N15-d — Notification Platform Telemetry operational continuity (pure).
 *
 * Operational state is derived from W5-N15-c recovered anchors + owner health.
 * Supported states only: Recovering | Ready | Degraded | Unavailable.
 * Never hardcodes Ready. Never fabricates readiness or telemetry labels.
 */

import {
  assertOperationalState,
  type OperationalState,
  type NotificationPlatformTelemetryContinuityView,
} from '../../operational-continuity/operational-readiness';
import type {
  NotificationPlatformTelemetryContinuityRecord,
  NotificationPlatformTelemetryOwnerReadiness,
} from './notification-platform-telemetry-continuity-status';
import type { NotificationPlatformTelemetryRecoveryDiagnostics } from './notification-platform-telemetry-restart-recovery';

export type NotificationPlatformTelemetryOperationalState = OperationalState;
export type NotificationPlatformTelemetryContinuityProjection =
  NotificationPlatformTelemetryContinuityView;

export type EvaluateNotificationPlatformTelemetryContinuityInput = Readonly<{
  recovering: boolean;
  ownerReadiness: NotificationPlatformTelemetryOwnerReadiness;
  continuity: NotificationPlatformTelemetryContinuityRecord | null;
}>;

/**
 * Derive Notification Platform Telemetry operational state from recovered anchors + owner health.
 * Ready only after successful integrity verification and owner Ready.
 * Integrity failure → Degraded. Recovery failure → Unavailable.
 */
export function evaluateNotificationPlatformTelemetryOperationalState(
  input: EvaluateNotificationPlatformTelemetryContinuityInput,
): NotificationPlatformTelemetryOperationalState {
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

export function buildNotificationPlatformTelemetryContinuityProjection(
  input: EvaluateNotificationPlatformTelemetryContinuityInput,
): NotificationPlatformTelemetryContinuityView {
  const operationalState = evaluateNotificationPlatformTelemetryOperationalState(input);
  assertOperationalState(operationalState);

  const diagnostics: NotificationPlatformTelemetryRecoveryDiagnostics | null =
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

/** Alias for service wiring — derives telemetry readiness view from W5-N15-c recovery state. */
export function buildNotificationPlatformTelemetryView(
  input: EvaluateNotificationPlatformTelemetryContinuityInput,
): NotificationPlatformTelemetryContinuityView {
  return buildNotificationPlatformTelemetryContinuityProjection(input);
}

/**
 * Graceful degradation: Notification Platform Telemetry continuity stays Ready/Degraded
 * while other owners are Degraded/Unavailable — unless its own recovery is Unavailable.
 */
export function notificationPlatformTelemetryContinuesWhileOthersDegraded(input: {
  notificationPlatformTelemetryState: NotificationPlatformTelemetryOperationalState;
  otherOwnerStates: readonly OperationalState[];
}): boolean {
  if (input.notificationPlatformTelemetryState === 'Unavailable') {
    return false;
  }
  return input.otherOwnerStates.some((state) => state === 'Degraded' || state === 'Unavailable');
}
