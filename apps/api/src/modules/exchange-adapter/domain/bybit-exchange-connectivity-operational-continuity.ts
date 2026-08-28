/**
 * W4-E02-d — Bybit Exchange Connectivity operational continuity (pure).
 *
 * Operational state is derived from W4-E02-c recovered state + owner health.
 * Supported states only: Recovering | Ready | Degraded | Unavailable.
 * Never hardcodes Ready. Never fabricates readiness or Connected.
 */

import {
  assertOperationalState,
  type BybitExchangeConnectivityContinuityView,
  type OperationalState,
} from '../../operational-continuity/operational-readiness';
import type {
  BybitExchangeConnectivityContinuityRecord,
  BybitExchangeConnectivityOwnerReadiness,
} from './bybit-exchange-connectivity-continuity-status';
import type { BybitExchangeConnectivityRecoveryDiagnostics } from './bybit-exchange-connectivity-restart-recovery';

export type BybitExchangeConnectivityOperationalState = OperationalState;
export type BybitExchangeConnectivityContinuityProjection = BybitExchangeConnectivityContinuityView;

export type EvaluateBybitExchangeConnectivityContinuityInput = Readonly<{
  recovering: boolean;
  ownerReadiness: BybitExchangeConnectivityOwnerReadiness;
  continuity: BybitExchangeConnectivityContinuityRecord | null;
}>;

/**
 * Derive Bybit Exchange Connectivity operational state from recovered persistence + owner health.
 * Ready only after successful integrity verification and owner Ready.
 * Integrity failure → Degraded. Recovery failure → Unavailable.
 */
export function evaluateBybitExchangeConnectivityOperationalState(
  input: EvaluateBybitExchangeConnectivityContinuityInput,
): BybitExchangeConnectivityOperationalState {
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

export function buildBybitExchangeConnectivityContinuityProjection(
  input: EvaluateBybitExchangeConnectivityContinuityInput,
): BybitExchangeConnectivityContinuityView {
  const operationalState = evaluateBybitExchangeConnectivityOperationalState(input);
  assertOperationalState(operationalState);

  const diagnostics: BybitExchangeConnectivityRecoveryDiagnostics | null =
    input.continuity?.diagnostics ?? null;

  return Object.freeze({
    operationalState,
    ownerReadiness: input.ownerReadiness,
    recoveryTimestamp: input.continuity?.recoveryCompletedAt ?? null,
    recoveryDurationMs: input.continuity?.recoveryDurationMs ?? null,
    reason: input.continuity?.reason,
    restoredCount: diagnostics?.restoredCount ?? 0,
    connectionAnchorCount: diagnostics?.connectionAnchorCount ?? 0,
    adapterAnchorCount: diagnostics?.adapterAnchorCount ?? 0,
    integrityVerified: input.continuity?.integrityVerified ?? false,
    workspaceIds: diagnostics?.workspaceIds ?? Object.freeze([]),
  });
}

/**
 * Graceful degradation: Bybit exchange connectivity continuity stays Ready/Degraded
 * while other owners are Degraded/Unavailable — unless its own recovery is Unavailable.
 */
export function bybitExchangeConnectivityContinuesWhileOthersDegraded(input: {
  bybitExchangeConnectivityState: BybitExchangeConnectivityOperationalState;
  otherOwnerStates: readonly OperationalState[];
}): boolean {
  if (input.bybitExchangeConnectivityState === 'Unavailable') {
    return false;
  }
  if (
    input.bybitExchangeConnectivityState !== 'Ready' &&
    input.bybitExchangeConnectivityState !== 'Degraded'
  ) {
    return false;
  }
  return input.otherOwnerStates.some((state) => state === 'Degraded' || state === 'Unavailable');
}
