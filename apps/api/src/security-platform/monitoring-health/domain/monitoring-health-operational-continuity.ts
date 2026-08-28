/**
 * W3-O05-d — Monitoring & Security Health operational continuity (pure).
 *
 * Operational state is derived from W3-O05-c recovered state + owner health.
 * Supported states only: Recovering | Ready | Degraded | Unavailable.
 * Never hardcodes Ready. Never fabricates readiness.
 */

import {
  assertOperationalState,
  type MonitoringHealthContinuityView,
  type OperationalState,
} from '../../../modules/operational-continuity/operational-readiness';
import type {
  MonitoringHealthContinuityRecord,
  MonitoringHealthOwnerReadiness,
} from './monitoring-health-continuity-status';
import type { MonitoringHealthRecoveryDiagnostics } from './monitoring-health-restart-recovery';

export type MonitoringHealthOperationalState = OperationalState;
export type MonitoringHealthContinuityProjection = MonitoringHealthContinuityView;

export type EvaluateMonitoringHealthContinuityInput = Readonly<{
  recovering: boolean;
  ownerReadiness: MonitoringHealthOwnerReadiness;
  continuity: MonitoringHealthContinuityRecord | null;
}>;

/**
 * Derive Monitoring & Security Health operational state from recovered persistence + owner health.
 * Ready only after successful integrity verification and owner Ready.
 * Integrity failure → Degraded. Recovery failure → Unavailable.
 */
export function evaluateMonitoringHealthOperationalState(
  input: EvaluateMonitoringHealthContinuityInput,
): MonitoringHealthOperationalState {
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

export function buildMonitoringHealthContinuityProjection(
  input: EvaluateMonitoringHealthContinuityInput,
): MonitoringHealthContinuityView {
  const operationalState = evaluateMonitoringHealthOperationalState(input);
  assertOperationalState(operationalState);

  const diagnostics: MonitoringHealthRecoveryDiagnostics | null =
    input.continuity?.diagnostics ?? null;

  return Object.freeze({
    operationalState,
    ownerReadiness: input.ownerReadiness,
    recoveryTimestamp: input.continuity?.recoveryCompletedAt ?? null,
    recoveryDurationMs: input.continuity?.recoveryDurationMs ?? null,
    reason: input.continuity?.reason,
    restoredCount: diagnostics?.restoredCount ?? 0,
    securityHealthAnchorCount: diagnostics?.securityHealthAnchorCount ?? 0,
    connectionHealthAnchorCount: diagnostics?.connectionHealthAnchorCount ?? 0,
    integrityVerified: input.continuity?.integrityVerified ?? false,
    workspaceIds: diagnostics?.workspaceIds ?? Object.freeze([]),
  });
}

/**
 * Graceful degradation: security-platform monitoring health continuity stays Ready/Degraded
 * while other owners are Degraded/Unavailable — unless its own recovery is Unavailable.
 */
export function monitoringHealthContinuesWhileOthersDegraded(input: {
  monitoringHealthState: MonitoringHealthOperationalState;
  otherOwnerStates: readonly OperationalState[];
}): boolean {
  if (input.monitoringHealthState === 'Unavailable') {
    return false;
  }
  if (input.monitoringHealthState !== 'Ready' && input.monitoringHealthState !== 'Degraded') {
    return false;
  }
  return input.otherOwnerStates.some((state) => state === 'Degraded' || state === 'Unavailable');
}
