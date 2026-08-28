/**
 * W4-E01-d — Exchange Connectivity operational continuity (pure).
 *
 * Operational state is derived from W4-E01-c recovered state + owner health.
 * Supported states only: Recovering | Ready | Degraded | Unavailable.
 * Never hardcodes Ready. Never fabricates readiness or Connected.
 */

import {
  assertOperationalState,
  type ExchangeConnectivityContinuityView,
  type OperationalState,
} from '../../operational-continuity/operational-readiness';
import type {
  ExchangeConnectivityContinuityRecord,
  ExchangeConnectivityOwnerReadiness,
} from './exchange-connectivity-continuity-status';
import type { ExchangeConnectivityRecoveryDiagnostics } from './exchange-connectivity-restart-recovery';

export type ExchangeConnectivityOperationalState = OperationalState;
export type ExchangeConnectivityContinuityProjection = ExchangeConnectivityContinuityView;

export type EvaluateExchangeConnectivityContinuityInput = Readonly<{
  recovering: boolean;
  ownerReadiness: ExchangeConnectivityOwnerReadiness;
  continuity: ExchangeConnectivityContinuityRecord | null;
}>;

/**
 * Derive Exchange Connectivity operational state from recovered persistence + owner health.
 * Ready only after successful integrity verification and owner Ready.
 * Integrity failure → Degraded. Recovery failure → Unavailable.
 */
export function evaluateExchangeConnectivityOperationalState(
  input: EvaluateExchangeConnectivityContinuityInput,
): ExchangeConnectivityOperationalState {
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

export function buildExchangeConnectivityContinuityProjection(
  input: EvaluateExchangeConnectivityContinuityInput,
): ExchangeConnectivityContinuityView {
  const operationalState = evaluateExchangeConnectivityOperationalState(input);
  assertOperationalState(operationalState);

  const diagnostics: ExchangeConnectivityRecoveryDiagnostics | null =
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
 * Graceful degradation: exchange-adapter connectivity continuity stays Ready/Degraded
 * while other owners are Degraded/Unavailable — unless its own recovery is Unavailable.
 */
export function exchangeConnectivityContinuesWhileOthersDegraded(input: {
  exchangeConnectivityState: ExchangeConnectivityOperationalState;
  otherOwnerStates: readonly OperationalState[];
}): boolean {
  if (input.exchangeConnectivityState === 'Unavailable') {
    return false;
  }
  if (
    input.exchangeConnectivityState !== 'Ready' &&
    input.exchangeConnectivityState !== 'Degraded'
  ) {
    return false;
  }
  return input.otherOwnerStates.some((state) => state === 'Degraded' || state === 'Unavailable');
}
