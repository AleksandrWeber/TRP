/**
 * W4-E03-d — OKX Exchange Connectivity operational continuity (pure).
 *
 * Operational state is derived from W4-E03-c recovered state + owner health.
 * Supported states only: Recovering | Ready | Degraded | Unavailable.
 * Never hardcodes Ready. Never fabricates readiness or Connected.
 */

import {
  assertOperationalState,
  type OkxExchangeConnectivityContinuityView,
  type OperationalState,
} from '../../operational-continuity/operational-readiness';
import type {
  OkxExchangeConnectivityContinuityRecord,
  OkxExchangeConnectivityOwnerReadiness,
} from './okx-exchange-connectivity-continuity-status';
import type { OkxExchangeConnectivityRecoveryDiagnostics } from './okx-exchange-connectivity-restart-recovery';

export type OkxExchangeConnectivityOperationalState = OperationalState;
export type OkxExchangeConnectivityContinuityProjection = OkxExchangeConnectivityContinuityView;

export type EvaluateOkxExchangeConnectivityContinuityInput = Readonly<{
  recovering: boolean;
  ownerReadiness: OkxExchangeConnectivityOwnerReadiness;
  continuity: OkxExchangeConnectivityContinuityRecord | null;
}>;

/**
 * Derive OKX Exchange Connectivity operational state from recovered persistence + owner health.
 * Ready only after successful integrity verification and owner Ready.
 * Integrity failure → Degraded. Recovery failure → Unavailable.
 */
export function evaluateOkxExchangeConnectivityOperationalState(
  input: EvaluateOkxExchangeConnectivityContinuityInput,
): OkxExchangeConnectivityOperationalState {
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

export function buildOkxExchangeConnectivityContinuityProjection(
  input: EvaluateOkxExchangeConnectivityContinuityInput,
): OkxExchangeConnectivityContinuityView {
  const operationalState = evaluateOkxExchangeConnectivityOperationalState(input);
  assertOperationalState(operationalState);

  const diagnostics: OkxExchangeConnectivityRecoveryDiagnostics | null =
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
 * Graceful degradation: OKX exchange connectivity continuity stays Ready/Degraded
 * while other owners are Degraded/Unavailable — unless its own recovery is Unavailable.
 */
export function okxExchangeConnectivityContinuesWhileOthersDegraded(input: {
  okxExchangeConnectivityState: OkxExchangeConnectivityOperationalState;
  otherOwnerStates: readonly OperationalState[];
}): boolean {
  if (input.okxExchangeConnectivityState === 'Unavailable') {
    return false;
  }
  if (
    input.okxExchangeConnectivityState !== 'Ready' &&
    input.okxExchangeConnectivityState !== 'Degraded'
  ) {
    return false;
  }
  return input.otherOwnerStates.some((state) => state === 'Degraded' || state === 'Unavailable');
}
