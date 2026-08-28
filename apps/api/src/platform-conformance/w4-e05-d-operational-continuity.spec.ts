import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  buildVenuePermissionContinuityProjection,
  evaluateVenuePermissionOperationalState,
  venuePermissionContinuesWhileOthersDegraded,
} from '../modules/exchange-adapter/domain/venue-permission-operational-continuity';
import {
  getVenuePermissionContinuityRecord,
  recordVenuePermissionIntegrityFailure,
  recordVenuePermissionRecoveryFailure,
  recordVenuePermissionRecoveryStart,
  recordVenuePermissionRecoverySuccess,
  resetVenuePermissionContinuity,
} from '../modules/exchange-adapter/domain/venue-permission-continuity-status';
import { buildVenuePermissionVerificationAnchorState } from '../modules/exchange-adapter/domain/durable-venue-permission-verification-state';
import { buildVenuePermissionVerificationRecoveryDiagnostics } from '../modules/exchange-adapter/domain/venue-permission-restart-recovery';
import {
  buildPlatformOperationalProjection,
  healthyOwnersContinueWhileOthersUnavailable,
  OPERATIONAL_STATES,
} from '../modules/operational-continuity/operational-readiness';
import {
  transitionSafetyAnswers,
  W4_E05_D_ARCHITECTURE_CLAIMS,
  W4_E05_D_EXPLICIT_OUT,
  W4_E05_D_SLICE_ID,
  W4_E05_D_SUPPORTED_STATES,
  W4_E05_D_TECHNICAL_DEBT_DELTA,
  W4_E05_D_TRANSITION_MATRIX,
  W4_E05_D_VENUE_PERMISSION_OWNER,
} from './w4-e05-d-operational-continuity';

const REPO_ROOT = join(__dirname, '../../../..');
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

describe('W4-E05-d venue permission operational continuity — unit', () => {
  beforeEach(() => {
    resetVenuePermissionContinuity();
  });

  it('operational state derivation: Recovering / Ready / Degraded / Unavailable only', () => {
    expect(W4_E05_D_SUPPORTED_STATES).toEqual([...OPERATIONAL_STATES]);
    expect(
      evaluateVenuePermissionOperationalState({
        recovering: true,
        ownerReadiness: 'ready',
        continuity: null,
      }),
    ).toBe('Recovering');
    expect(
      evaluateVenuePermissionOperationalState({
        recovering: false,
        ownerReadiness: 'unavailable',
        continuity: null,
      }),
    ).toBe('Unavailable');
    expect(W4_E05_D_ARCHITECTURE_CLAIMS.neverHardcodesReady).toBe(true);
    expect(W4_E05_D_ARCHITECTURE_CLAIMS.canFabricateReadiness).toBe(false);
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
});

describe('W4-E05-d venue permission operational continuity — integration', () => {
  beforeEach(() => {
    resetVenuePermissionContinuity();
  });

  it('ownership remains exchange-adapter only', () => {
    expect(W4_E05_D_VENUE_PERMISSION_OWNER).toBe('exchange-adapter');
  });

  it('platform projection includes venue permission verification continuity view', () => {
    recordVenuePermissionRecoveryStart();
    recordVenuePermissionRecoverySuccess({
      diagnostics: buildVenuePermissionVerificationRecoveryDiagnostics([
        verifiedAnchor('ws-1', 'OKX'),
      ]),
    });
    const venuePermissionVerification = buildVenuePermissionContinuityProjection({
      recovering: false,
      ownerReadiness: 'ready',
      continuity: getVenuePermissionContinuityRecord(),
    });
    const projection = buildPlatformOperationalProjection({
      owners: Object.freeze([
        Object.freeze({
          owner: 'strategy-library',
          state: 'Ready',
          recoveryRequired: true,
          dependencyOwners: Object.freeze([]),
        }),
      ]),
      recoveryTimestamp: '2026-08-29T10:00:00.000Z',
      recoveryDurationMs: 10,
      venuePermissionVerification,
    });
    expect(projection.venuePermissionVerification?.operationalState).toBe('Ready');
    expect(projection.venuePermissionVerification?.verifiedAnchorCount).toBe(1);
  });

  it('healthy platform components continue while venue permission is Unavailable', () => {
    expect(
      venuePermissionContinuesWhileOthersDegraded({
        venuePermissionState: 'Unavailable',
        otherOwnerStates: ['Ready', 'Ready'],
      }),
    ).toBe(false);
    expect(
      healthyOwnersContinueWhileOthersUnavailable([
        Object.freeze({
          owner: 'strategy-library',
          state: 'Ready',
          recoveryRequired: true,
          dependencyOwners: Object.freeze([]),
        }),
        Object.freeze({
          owner: 'exchange-scope',
          state: 'Unavailable',
          recoveryRequired: true,
          dependencyOwners: Object.freeze([]),
        }),
      ]),
    ).toBe(true);
  });

  it('transition safety answers confirm W4-E05-b/c reuse without ownership drift', () => {
    const answers = transitionSafetyAnswers();
    expect(answers.reusesW4E05bPersistence).toBe(true);
    expect(answers.reusesW4E05cRecovery).toBe(true);
    expect(answers.degradedNeverFabricatesReady).toBe(true);
    expect(W4_E05_D_ARCHITECTURE_CLAIMS.newPersistenceOwner).toBe(false);
    expect(W4_E05_D_ARCHITECTURE_CLAIMS.venuePermissionVerificationProductImplemented).toBe(false);
  });

  it('technical debt delta and explicit OUT cover W4-E05-e deferral', () => {
    expect(W4_E05_D_TECHNICAL_DEBT_DELTA.resolved.length).toBeGreaterThan(0);
    expect(W4_E05_D_TECHNICAL_DEBT_DELTA.introduced).toEqual([]);
    expect(W4_E05_D_EXPLICIT_OUT).toEqual(
      expect.arrayContaining(['w4-e05-e', 'persistence-changes']),
    );
    expect(
      W4_E05_D_TRANSITION_MATRIX.stillMissing.some((item) => item.includes('Package Close')),
    ).toBe(true);
  });

  it('required reports and domain files exist', () => {
    const wave4 = join(REPO_ROOT, 'docs/project/version-3/wave-4');
    for (const name of [
      'w4-e05-d-implementation-report.md',
      'w4-e05-d-architecture-review.md',
      'w4-e05-d-security-review.md',
      'w4-e05-d-product-review.md',
      'w4-e05-d-validation-report.md',
    ]) {
      expect(existsSync(join(wave4, name))).toBe(true);
    }
    expect(
      existsSync(
        join(
          REPO_ROOT,
          'apps/api/src/modules/exchange-adapter/domain/venue-permission-operational-continuity.ts',
        ),
      ),
    ).toBe(true);
  });

  it('slice id is W4-E05-d', () => {
    expect(W4_E05_D_SLICE_ID).toBe('W4-E05-d');
  });
});
