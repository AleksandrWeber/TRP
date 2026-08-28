import { beforeEach, describe, expect, it } from 'vitest';
import {
  buildVenuePermissionContinuityProjection,
  evaluateVenuePermissionOperationalState,
  venuePermissionContinuesWhileOthersDegraded,
} from './venue-permission-operational-continuity';
import {
  getVenuePermissionContinuityRecord,
  recordVenuePermissionIntegrityFailure,
  recordVenuePermissionRecoveryFailure,
  recordVenuePermissionRecoveryStart,
  recordVenuePermissionRecoverySuccess,
  resetVenuePermissionContinuity,
} from './venue-permission-continuity-status';
import { buildVenuePermissionVerificationAnchorState } from './durable-venue-permission-verification-state';
import { buildVenuePermissionVerificationRecoveryDiagnostics } from './venue-permission-restart-recovery';

const recordedAt = '2026-08-29T10:00:00.000Z';

function verifiedAnchor(workspaceId: string, exchangeIdentifier: string) {
  const outcome = buildVenuePermissionVerificationAnchorState({
    workspaceId,
    exchangeIdentifier,
    connectionId: 'conn-42',
    adapterExchangeConnectionId: 'ex-conn-9',
    permissionVerificationId: 'pv-99',
    vendorPermissionHash: 'vendor-hash',
    integrityMetadataHash: 'integrity-hash',
    correlationId: 'corr-1',
    recordedAt,
    prior: null,
  });
  if (!outcome.ok) throw new Error('expected verified anchor');
  return outcome.state;
}

describe('venue-permission-operational-continuity domain — W4-E05-d', () => {
  beforeEach(() => {
    resetVenuePermissionContinuity();
  });

  it('integrity failure → Degraded; recovery failure → Unavailable; healthy recovery → Ready', () => {
    recordVenuePermissionRecoveryStart();
    recordVenuePermissionRecoverySuccess({
      diagnostics: buildVenuePermissionVerificationRecoveryDiagnostics([
        verifiedAnchor('ws-1', 'BINANCE'),
      ]),
    });
    recordVenuePermissionIntegrityFailure('integrity-check-failed');
    expect(
      evaluateVenuePermissionOperationalState({
        recovering: false,
        ownerReadiness: 'ready',
        continuity: getVenuePermissionContinuityRecord(),
      }),
    ).toBe('Degraded');

    recordVenuePermissionRecoveryFailure({ reason: 'corrupt' });
    expect(
      evaluateVenuePermissionOperationalState({
        recovering: false,
        ownerReadiness: 'ready',
        continuity: getVenuePermissionContinuityRecord(),
      }),
    ).toBe('Unavailable');

    resetVenuePermissionContinuity();
    recordVenuePermissionRecoveryStart();
    recordVenuePermissionRecoverySuccess({
      diagnostics: buildVenuePermissionVerificationRecoveryDiagnostics([]),
    });
    expect(
      evaluateVenuePermissionOperationalState({
        recovering: false,
        ownerReadiness: 'ready',
        continuity: getVenuePermissionContinuityRecord(),
      }),
    ).toBe('Ready');
  });

  it('never fabricates Ready without continuity record', () => {
    expect(
      evaluateVenuePermissionOperationalState({
        recovering: false,
        ownerReadiness: 'ready',
        continuity: null,
      }),
    ).toBe('Unavailable');
  });

  it('Degraded never fabricates Ready', () => {
    recordVenuePermissionRecoveryStart();
    recordVenuePermissionRecoverySuccess({
      diagnostics: buildVenuePermissionVerificationRecoveryDiagnostics([
        verifiedAnchor('ws-1', 'BINANCE'),
      ]),
    });
    recordVenuePermissionIntegrityFailure('integrity-check-failed');
    const projection = buildVenuePermissionContinuityProjection({
      recovering: false,
      ownerReadiness: 'ready',
      continuity: getVenuePermissionContinuityRecord(),
    });
    expect(projection.operationalState).toBe('Degraded');
    expect(projection.operationalState).not.toBe('Ready');
  });

  it('graceful degradation: healthy venue permission continues while other owners degraded', () => {
    expect(
      venuePermissionContinuesWhileOthersDegraded({
        venuePermissionState: 'Ready',
        otherOwnerStates: ['Degraded', 'Unavailable'],
      }),
    ).toBe(true);
    expect(
      venuePermissionContinuesWhileOthersDegraded({
        venuePermissionState: 'Unavailable',
        otherOwnerStates: ['Ready'],
      }),
    ).toBe(false);
  });

  it('projection exposes verified anchor counts from recovery diagnostics', () => {
    recordVenuePermissionRecoveryStart();
    recordVenuePermissionRecoverySuccess({
      diagnostics: buildVenuePermissionVerificationRecoveryDiagnostics([
        verifiedAnchor('ws-1', 'BINANCE'),
      ]),
    });
    const projection = buildVenuePermissionContinuityProjection({
      recovering: false,
      ownerReadiness: 'ready',
      continuity: getVenuePermissionContinuityRecord(),
    });
    expect(projection.operationalState).toBe('Ready');
    expect(projection.verifiedAnchorCount).toBe(1);
    expect(projection.integrityVerified).toBe(true);
  });
});
