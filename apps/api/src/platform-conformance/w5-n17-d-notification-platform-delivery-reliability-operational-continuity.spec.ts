import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { buildNotificationPlatformReliabilityAnchorState } from '../modules/notification-delivery/domain/durable-notification-platform-reliability-anchor';
import {
  getNotificationPlatformReliabilityContinuityRecord,
  recordNotificationPlatformReliabilityIntegrityFailure,
  recordNotificationPlatformReliabilityRecoveryFailure,
  recordNotificationPlatformReliabilityRecoveryStart,
  recordNotificationPlatformReliabilityRecoverySuccess,
  resetNotificationPlatformReliabilityContinuity,
} from '../modules/notification-delivery/domain/notification-platform-reliability-continuity-status';
import {
  buildNotificationPlatformReliabilityContinuityProjection,
  evaluateNotificationPlatformReliabilityOperationalState,
  notificationPlatformReliabilityContinuesWhileOthersDegraded,
} from '../modules/notification-delivery/domain/notification-platform-reliability-operational-continuity';
import { buildNotificationPlatformReliabilityRecoveryDiagnostics } from '../modules/notification-delivery/domain/notification-platform-reliability-restart-recovery';
import {
  buildPlatformOperationalProjection,
  healthyOwnersContinueWhileOthersUnavailable,
  OPERATIONAL_STATES,
} from '../modules/operational-continuity/operational-readiness';
import {
  transitionSafetyAnswers,
  W5_N17_D_ARCHITECTURE_CLAIMS,
  W5_N17_D_EXPLICIT_OUT,
  W5_N17_D_NOTIFICATION_OWNER,
  W5_N17_D_SLICE_ID,
  W5_N17_D_SUPPORTED_STATES,
  W5_N17_D_TECHNICAL_DEBT_DELTA,
  W5_N17_D_TRANSITION_MATRIX,
} from './w5-n17-d-notification-platform-delivery-reliability-operational-continuity';

const REPO_ROOT = join(__dirname, '../../../..');
const recordedAt = '2026-09-02T16:00:00.000Z';

function canonicalAnchor(workspaceId: string, reliabilityAnchorId: string) {
  const outcome = buildNotificationPlatformReliabilityAnchorState({
    workspaceId,
    reliabilityAnchorId,
    platformReliabilityType: 'cross-channel-foundation',
    correlationId: 'corr-1',
    actorId: 'actor-1',
    recordedAt,
    prior: null,
  });
  if (!outcome.ok) throw new Error('expected canonical anchor');
  return outcome.anchor;
}

describe('W5-N17-d notification platform delivery reliability operational continuity — unit', () => {
  beforeEach(() => {
    resetNotificationPlatformReliabilityContinuity();
  });

  it('operational state derivation: Recovering / Ready / Degraded / Unavailable only', () => {
    expect(W5_N17_D_SUPPORTED_STATES).toEqual([...OPERATIONAL_STATES]);
    expect(
      evaluateNotificationPlatformReliabilityOperationalState({
        recovering: true,
        ownerReadiness: 'ready',
        continuity: null,
      }),
    ).toBe('Recovering');
    expect(
      evaluateNotificationPlatformReliabilityOperationalState({
        recovering: false,
        ownerReadiness: 'unavailable',
        continuity: null,
      }),
    ).toBe('Unavailable');
    expect(W5_N17_D_ARCHITECTURE_CLAIMS.neverHardcodesReady).toBe(true);
    expect(W5_N17_D_ARCHITECTURE_CLAIMS.canFabricateReadiness).toBe(false);
  });

  it('integrity failure → Degraded; recovery failure → Unavailable; healthy recovery → Ready', () => {
    recordNotificationPlatformReliabilityRecoveryStart();
    recordNotificationPlatformReliabilityRecoverySuccess({
      diagnostics: buildNotificationPlatformReliabilityRecoveryDiagnostics([
        canonicalAnchor('ws-1', 'reliability-1'),
      ]),
    });
    recordNotificationPlatformReliabilityIntegrityFailure('integrity-check-failed');
    expect(
      evaluateNotificationPlatformReliabilityOperationalState({
        recovering: false,
        ownerReadiness: 'ready',
        continuity: getNotificationPlatformReliabilityContinuityRecord(),
      }),
    ).toBe('Degraded');

    recordNotificationPlatformReliabilityRecoveryFailure({ reason: 'corrupt' });
    expect(
      evaluateNotificationPlatformReliabilityOperationalState({
        recovering: false,
        ownerReadiness: 'ready',
        continuity: getNotificationPlatformReliabilityContinuityRecord(),
      }),
    ).toBe('Unavailable');

    resetNotificationPlatformReliabilityContinuity();
    recordNotificationPlatformReliabilityRecoveryStart();
    recordNotificationPlatformReliabilityRecoverySuccess({
      diagnostics: buildNotificationPlatformReliabilityRecoveryDiagnostics([]),
    });
    expect(
      evaluateNotificationPlatformReliabilityOperationalState({
        recovering: false,
        ownerReadiness: 'ready',
        continuity: getNotificationPlatformReliabilityContinuityRecord(),
      }),
    ).toBe('Ready');
  });

  it('Degraded never fabricates Ready', () => {
    recordNotificationPlatformReliabilityRecoveryStart();
    recordNotificationPlatformReliabilityRecoverySuccess({
      diagnostics: buildNotificationPlatformReliabilityRecoveryDiagnostics([
        canonicalAnchor('ws-1', 'reliability-1'),
      ]),
    });
    recordNotificationPlatformReliabilityIntegrityFailure('integrity-check-failed');
    const projection = buildNotificationPlatformReliabilityContinuityProjection({
      recovering: false,
      ownerReadiness: 'ready',
      continuity: getNotificationPlatformReliabilityContinuityRecord(),
    });
    expect(projection.operationalState).toBe('Degraded');
    expect(projection.operationalState).not.toBe('Ready');
  });
});

describe('W5-N17-d notification platform delivery reliability operational continuity — integration', () => {
  beforeEach(() => {
    resetNotificationPlatformReliabilityContinuity();
  });

  it('ownership remains notification-delivery only', () => {
    expect(W5_N17_D_NOTIFICATION_OWNER).toBe('notification-delivery');
  });

  it('platform projection includes notification platform reliability continuity view', () => {
    recordNotificationPlatformReliabilityRecoveryStart();
    recordNotificationPlatformReliabilityRecoverySuccess({
      diagnostics: buildNotificationPlatformReliabilityRecoveryDiagnostics([
        canonicalAnchor('ws-1', 'reliability-1'),
      ]),
    });
    const notificationPlatformReliability =
      buildNotificationPlatformReliabilityContinuityProjection({
        recovering: false,
        ownerReadiness: 'ready',
        continuity: getNotificationPlatformReliabilityContinuityRecord(),
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
      recoveryTimestamp: '2026-09-02T16:00:00.000Z',
      recoveryDurationMs: 10,
      notificationPlatformReliability,
    });
    expect(projection.notificationPlatformReliability?.operationalState).toBe('Ready');
    expect(projection.notificationPlatformReliability?.canonicalAnchorCount).toBe(1);
  });

  it('healthy platform components continue while notification platform reliability is Unavailable', () => {
    expect(
      notificationPlatformReliabilityContinuesWhileOthersDegraded({
        notificationPlatformReliabilityState: 'Unavailable',
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

  it('transition safety answers confirm derived readiness without ownership drift', () => {
    expect(transitionSafetyAnswers().reusesW5N17bPersistence).toBe(true);
    expect(transitionSafetyAnswers().reusesW5N17cRecovery).toBe(true);
    expect(transitionSafetyAnswers().degradedNeverFabricatesReady).toBe(true);
  });

  it('architecture claims: no delivery execution or functional claims', () => {
    expect(W5_N17_D_ARCHITECTURE_CLAIMS.deliveryExecutionRuntime).toBe(false);
    expect(W5_N17_D_ARCHITECTURE_CLAIMS.deliveryReliabilityFunctionalClaimed).toBe(false);
    expect(W5_N17_D_ARCHITECTURE_CLAIMS.retryExecutionImplemented).toBe(false);
    expect(W5_N17_D_ARCHITECTURE_CLAIMS.newPersistenceOwner).toBe(false);
  });

  it('technical debt delta: operational continuity resolved; package Close deferred to slice e', () => {
    expect(W5_N17_D_TECHNICAL_DEBT_DELTA.resolved.length).toBeGreaterThan(0);
    expect(W5_N17_D_TECHNICAL_DEBT_DELTA.introduced).toEqual([]);
    expect(W5_N17_D_TECHNICAL_DEBT_DELTA.deferred).toEqual([]);
  });

  it('explicit OUT covers W5-N17-e and delivery execution runtime', () => {
    expect(W5_N17_D_EXPLICIT_OUT).toEqual(
      expect.arrayContaining(['w5-n17-e', 'delivery-execution-runtime']),
    );
  });

  it('transition matrix: recovery + operational continuity; retry execution still missing', () => {
    expect(W5_N17_D_TRANSITION_MATRIX.before).toContain('Restart recovery (W5-N17-c)');
    expect(W5_N17_D_TRANSITION_MATRIX.after).toContain('Operational continuity (W5-N17-d)');
    expect(
      W5_N17_D_TRANSITION_MATRIX.stillMissing.some((item) => item.includes('Retry execution')),
    ).toBe(true);
  });

  it('required reports and domain files exist', () => {
    const wave5 = join(REPO_ROOT, 'docs/project/version-3/wave-5');
    for (const name of [
      'w5-n17-d-implementation-report.md',
      'w5-n17-d-architecture-review.md',
      'w5-n17-d-security-review.md',
      'w5-n17-d-product-review.md',
      'w5-n17-d-validation-report.md',
    ]) {
      expect(existsSync(join(wave5, name))).toBe(true);
    }
    expect(
      existsSync(
        join(
          REPO_ROOT,
          'apps/api/src/modules/notification-delivery/domain/notification-platform-reliability-operational-continuity.ts',
        ),
      ),
    ).toBe(true);
  });

  it('slice id is W5-N17-d', () => {
    expect(W5_N17_D_SLICE_ID).toBe('W5-N17-d');
  });
});
