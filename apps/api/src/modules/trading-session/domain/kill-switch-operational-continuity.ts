/**
 * W3-O04-d — Kill Switch operational continuity (pure).
 *
 * Operational state is derived from W3-O04-c recovered state + owner health.
 * Supported states only: Recovering | Ready | Degraded | Unavailable.
 * Never hardcodes Ready. Never fabricates readiness.
 */

import {
  assertOperationalState,
  type KillSwitchContinuityView,
  type OperationalState,
} from '../../operational-continuity/operational-readiness';
import type {
  KillSwitchContinuityRecord,
  KillSwitchOwnerReadiness,
} from './kill-switch-continuity-status';
import type { KillSwitchRecoveryDiagnostics } from './kill-switch-restart-recovery';

export type KillSwitchOperationalState = OperationalState;
export type KillSwitchContinuityProjection = KillSwitchContinuityView;

export type EvaluateKillSwitchContinuityInput = Readonly<{
  recovering: boolean;
  ownerReadiness: KillSwitchOwnerReadiness;
  continuity: KillSwitchContinuityRecord | null;
}>;

/**
 * Derive Kill Switch operational state from recovered persistence + owner health.
 * Ready only after successful integrity verification and owner Ready.
 * Integrity failure → Degraded. Recovery failure → Unavailable.
 */
export function evaluateKillSwitchOperationalState(
  input: EvaluateKillSwitchContinuityInput,
): KillSwitchOperationalState {
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

export function buildKillSwitchContinuityProjection(
  input: EvaluateKillSwitchContinuityInput,
): KillSwitchContinuityView {
  const operationalState = evaluateKillSwitchOperationalState(input);
  assertOperationalState(operationalState);

  const diagnostics: KillSwitchRecoveryDiagnostics | null = input.continuity?.diagnostics ?? null;

  return Object.freeze({
    operationalState,
    ownerReadiness: input.ownerReadiness,
    recoveryTimestamp: input.continuity?.recoveryCompletedAt ?? null,
    recoveryDurationMs: input.continuity?.recoveryDurationMs ?? null,
    reason: input.continuity?.reason,
    restoredCount: diagnostics?.restoredCount ?? 0,
    armedCount: diagnostics?.armedCount ?? 0,
    integrityVerified: input.continuity?.integrityVerified ?? false,
    workspaceIds: diagnostics?.workspaceIds ?? Object.freeze([]),
  });
}

/**
 * Graceful degradation: trading-session Kill Switch continuity stays Ready/Degraded
 * while other owners are Degraded/Unavailable — unless its own recovery is Unavailable.
 */
export function killSwitchContinuesWhileOthersDegraded(input: {
  killSwitchState: KillSwitchOperationalState;
  otherOwnerStates: readonly OperationalState[];
}): boolean {
  if (input.killSwitchState === 'Unavailable') {
    return false;
  }
  if (input.killSwitchState !== 'Ready' && input.killSwitchState !== 'Degraded') {
    return false;
  }
  return input.otherOwnerStates.some((state) => state === 'Degraded' || state === 'Unavailable');
}
