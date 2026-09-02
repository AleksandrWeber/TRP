/**
 * W5-N16-d — Notification Platform Metrics operational continuity (pure).
 *
 * Operational state is derived from W5-N16-c recovered anchors + owner health.
 * Supported states only: Recovering | Ready | Degraded | Unavailable.
 * Never hardcodes Ready. Never fabricates readiness or metrics labels.
 */

import {
  assertOperationalState,
  type OperationalState,
  type NotificationPlatformMetricsContinuityView,
} from '../../operational-continuity/operational-readiness';
import type {
  NotificationPlatformMetricsContinuityRecord,
  NotificationPlatformMetricsOwnerReadiness,
} from './notification-platform-metrics-continuity-status';
import type { NotificationPlatformMetricsRecoveryDiagnostics } from './notification-platform-metrics-restart-recovery';

export type NotificationPlatformMetricsOperationalState = OperationalState;
export type NotificationPlatformMetricsContinuityProjection =
  NotificationPlatformMetricsContinuityView;

export type EvaluateNotificationPlatformMetricsContinuityInput = Readonly<{
  recovering: boolean;
  ownerReadiness: NotificationPlatformMetricsOwnerReadiness;
  continuity: NotificationPlatformMetricsContinuityRecord | null;
}>;

/**
 * Derive Notification Platform Metrics operational state from recovered anchors + owner health.
 * Ready only after successful integrity verification and owner Ready.
 * Integrity failure → Degraded. Recovery failure → Unavailable.
 */
export function evaluateNotificationPlatformMetricsOperationalState(
  input: EvaluateNotificationPlatformMetricsContinuityInput,
): NotificationPlatformMetricsOperationalState {
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

export function buildNotificationPlatformMetricsContinuityProjection(
  input: EvaluateNotificationPlatformMetricsContinuityInput,
): NotificationPlatformMetricsContinuityView {
  const operationalState = evaluateNotificationPlatformMetricsOperationalState(input);
  assertOperationalState(operationalState);

  const diagnostics: NotificationPlatformMetricsRecoveryDiagnostics | null =
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

/** Alias for service wiring — derives metrics readiness view from W5-N16-c recovery state. */
export function buildNotificationPlatformMetricsView(
  input: EvaluateNotificationPlatformMetricsContinuityInput,
): NotificationPlatformMetricsContinuityView {
  return buildNotificationPlatformMetricsContinuityProjection(input);
}

/**
 * Graceful degradation: Notification Platform Metrics continuity stays Ready/Degraded
 * while other owners are Degraded/Unavailable — unless its own recovery is Unavailable.
 */
export function notificationPlatformMetricsContinuesWhileOthersDegraded(input: {
  notificationPlatformMetricsState: NotificationPlatformMetricsOperationalState;
  otherOwnerStates: readonly OperationalState[];
}): boolean {
  if (input.notificationPlatformMetricsState === 'Unavailable') {
    return false;
  }
  return input.otherOwnerStates.some((state) => state === 'Degraded' || state === 'Unavailable');
}
