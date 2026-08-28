/**
 * W4-E05-d — Venue Permission Verification operational continuity (pure).
 *
 * Operational state is derived from W4-E05-c recovered state + owner health.
 * Supported states only: Recovering | Ready | Degraded | Unavailable.
 * Never hardcodes Ready. Never fabricates readiness or permission labels.
 */

import {
  assertOperationalState,
  type OperationalState,
  type VenuePermissionContinuityView,
} from '../../operational-continuity/operational-readiness';
import type {
  VenuePermissionContinuityRecord,
  VenuePermissionOwnerReadiness,
} from './venue-permission-continuity-status';
import type { VenuePermissionVerificationRecoveryDiagnostics } from './venue-permission-restart-recovery';

export type VenuePermissionOperationalState = OperationalState;
export type VenuePermissionContinuityProjection = VenuePermissionContinuityView;

export type EvaluateVenuePermissionContinuityInput = Readonly<{
  recovering: boolean;
  ownerReadiness: VenuePermissionOwnerReadiness;
  continuity: VenuePermissionContinuityRecord | null;
}>;

/**
 * Derive Venue Permission Verification operational state from recovered persistence + owner health.
 * Ready only after successful integrity verification and owner Ready.
 * Integrity failure → Degraded. Recovery failure → Unavailable.
 */
export function evaluateVenuePermissionOperationalState(
  input: EvaluateVenuePermissionContinuityInput,
): VenuePermissionOperationalState {
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

export function buildVenuePermissionContinuityProjection(
  input: EvaluateVenuePermissionContinuityInput,
): VenuePermissionContinuityView {
  const operationalState = evaluateVenuePermissionOperationalState(input);
  assertOperationalState(operationalState);

  const diagnostics: VenuePermissionVerificationRecoveryDiagnostics | null =
    input.continuity?.diagnostics ?? null;

  return Object.freeze({
    operationalState,
    ownerReadiness: input.ownerReadiness,
    recoveryTimestamp: input.continuity?.recoveryCompletedAt ?? null,
    recoveryDurationMs: input.continuity?.recoveryDurationMs ?? null,
    reason: input.continuity?.reason,
    restoredCount: diagnostics?.restoredCount ?? 0,
    verifiedAnchorCount: diagnostics?.verifiedAnchorCount ?? 0,
    integrityVerified: input.continuity?.integrityVerified ?? false,
    workspaceIds: diagnostics?.workspaceIds ?? Object.freeze([]),
  });
}

/**
 * Graceful degradation: Venue Permission Verification continuity stays Ready/Degraded
 * while other owners are Degraded/Unavailable — unless its own recovery is Unavailable.
 */
export function venuePermissionContinuesWhileOthersDegraded(input: {
  venuePermissionState: VenuePermissionOperationalState;
  otherOwnerStates: readonly OperationalState[];
}): boolean {
  if (input.venuePermissionState === 'Unavailable') {
    return false;
  }
  if (input.venuePermissionState !== 'Ready' && input.venuePermissionState !== 'Degraded') {
    return false;
  }
  return input.otherOwnerStates.some((state) => state === 'Degraded' || state === 'Unavailable');
}
