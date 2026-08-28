/**
 * W4-E04-d — Kraken Exchange Connectivity operational continuity (pure).
 *
 * Operational state is derived from W4-E04-c recovered state + owner health.
 * Supported states only: Recovering | Ready | Degraded | Unavailable.
 * Never hardcodes Ready. Never fabricates readiness or Connected.
 */

import {
  assertOperationalState,
  type KrakenExchangeConnectivityContinuityView,
  type OperationalState,
} from '../../operational-continuity/operational-readiness';
import type {
  KrakenExchangeConnectivityContinuityRecord,
  KrakenExchangeConnectivityOwnerReadiness,
} from './kraken-exchange-connectivity-continuity-status';
import type { KrakenExchangeConnectivityRecoveryDiagnostics } from './kraken-exchange-connectivity-restart-recovery';

export type KrakenExchangeConnectivityOperationalState = OperationalState;
export type KrakenExchangeConnectivityContinuityProjection =
  KrakenExchangeConnectivityContinuityView;

export type EvaluateKrakenExchangeConnectivityContinuityInput = Readonly<{
  recovering: boolean;
  ownerReadiness: KrakenExchangeConnectivityOwnerReadiness;
  continuity: KrakenExchangeConnectivityContinuityRecord | null;
}>;

/**
 * Derive Kraken Exchange Connectivity operational state from recovered persistence + owner health.
 * Ready only after successful integrity verification and owner Ready.
 * Integrity failure → Degraded. Recovery failure → Unavailable.
 */
export function evaluateKrakenExchangeConnectivityOperationalState(
  input: EvaluateKrakenExchangeConnectivityContinuityInput,
): KrakenExchangeConnectivityOperationalState {
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

export function buildKrakenExchangeConnectivityContinuityProjection(
  input: EvaluateKrakenExchangeConnectivityContinuityInput,
): KrakenExchangeConnectivityContinuityView {
  const operationalState = evaluateKrakenExchangeConnectivityOperationalState(input);
  assertOperationalState(operationalState);

  const diagnostics: KrakenExchangeConnectivityRecoveryDiagnostics | null =
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
 * Graceful degradation: Kraken exchange connectivity continuity stays Ready/Degraded
 * while other owners are Degraded/Unavailable — unless its own recovery is Unavailable.
 */
export function krakenExchangeConnectivityContinuesWhileOthersDegraded(input: {
  krakenExchangeConnectivityState: KrakenExchangeConnectivityOperationalState;
  otherOwnerStates: readonly OperationalState[];
}): boolean {
  if (input.krakenExchangeConnectivityState === 'Unavailable') {
    return false;
  }
  if (
    input.krakenExchangeConnectivityState !== 'Ready' &&
    input.krakenExchangeConnectivityState !== 'Degraded'
  ) {
    return false;
  }
  return input.otherOwnerStates.some((state) => state === 'Degraded' || state === 'Unavailable');
}
