import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { buildNotificationPlatformDeliveryAnchorState } from '../modules/notification-delivery/domain/durable-notification-platform-delivery-anchor';
import {
  getNotificationPlatformDeliveryContinuityRecord,
  recordNotificationPlatformDeliveryIntegrityFailure,
  recordNotificationPlatformDeliveryRecoveryFailure,
  recordNotificationPlatformDeliveryRecoveryStart,
  recordNotificationPlatformDeliveryRecoverySuccess,
  resetNotificationPlatformDeliveryContinuity,
} from '../modules/notification-delivery/domain/notification-platform-delivery-continuity-status';
import {
  buildNotificationPlatformDeliveryContinuityProjection,
  evaluateNotificationPlatformDeliveryOperationalState,
  notificationPlatformDeliveryContinuesWhileOthersDegraded,
} from '../modules/notification-delivery/domain/notification-platform-delivery-operational-continuity';
import { buildNotificationPlatformDeliveryRecoveryDiagnostics } from '../modules/notification-delivery/domain/notification-platform-delivery-restart-recovery';
import {
  buildPlatformOperationalProjection,
  healthyOwnersContinueWhileOthersUnavailable,
  OPERATIONAL_STATES,
} from '../modules/operational-continuity/operational-readiness';
import {
  transitionSafetyAnswers,
  W5_N06_D_ARCHITECTURE_CLAIMS,
  W5_N06_D_EXPLICIT_OUT,
  W5_N06_D_NOTIFICATION_OWNER,
  W5_N06_D_SLICE_ID,
  W5_N06_D_SUPPORTED_STATES,
  W5_N06_D_TECHNICAL_DEBT_DELTA,
  W5_N06_D_TRANSITION_MATRIX,
} from './w5-n06-d-notification-platform-delivery-operational-continuity';

const REPO_ROOT = join(__dirname, '../../../..');
const recordedAt = '2026-08-29T19:00:00.000Z';

function canonicalAnchor(workspaceId: string, deliveryAnchorId: string) {
  const outcome = buildNotificationPlatformDeliveryAnchorState({
    workspaceId,
    deliveryAnchorId,
    platformDeliveryType: 'unified-platform-delivery',
    correlationId: 'corr-1',
    actorId: 'actor-1',
    recordedAt,
    prior: null,
  });
  if (!outcome.ok) throw new Error('expected canonical anchor');
  return outcome.anchor;
}

describe('W5-N06-d notification platform delivery operational continuity — unit', () => {
  beforeEach(() => {
    resetNotificationPlatformDeliveryContinuity();
  });

  it('operational state derivation: Recovering / Ready / Degraded / Unavailable only', () => {
    expect(W5_N06_D_SUPPORTED_STATES).toEqual([...OPERATIONAL_STATES]);
    expect(
      evaluateNotificationPlatformDeliveryOperationalState({
        recovering: true,
        ownerReadiness: 'ready',
        continuity: null,
      }),
    ).toBe('Recovering');
    expect(
      evaluateNotificationPlatformDeliveryOperationalState({
        recovering: false,
        ownerReadiness: 'unavailable',
        continuity: null,
      }),
    ).toBe('Unavailable');
    expect(W5_N06_D_ARCHITECTURE_CLAIMS.neverHardcodesReady).toBe(true);
    expect(W5_N06_D_ARCHITECTURE_CLAIMS.canFabricateReadiness).toBe(false);
  });

  it('integrity failure → Degraded; recovery failure → Unavailable; healthy recovery → Ready', () => {
    recordNotificationPlatformDeliveryRecoveryStart();
    recordNotificationPlatformDeliveryRecoverySuccess({
      diagnostics: buildNotificationPlatformDeliveryRecoveryDiagnostics([
        canonicalAnchor('ws-1', 'del-1'),
      ]),
    });
    recordNotificationPlatformDeliveryIntegrityFailure('integrity-check-failed');
    expect(
      evaluateNotificationPlatformDeliveryOperationalState({
        recovering: false,
        ownerReadiness: 'ready',
        continuity: getNotificationPlatformDeliveryContinuityRecord(),
      }),
    ).toBe('Degraded');

    recordNotificationPlatformDeliveryRecoveryFailure({ reason: 'corrupt' });
    expect(
      evaluateNotificationPlatformDeliveryOperationalState({
        recovering: false,
        ownerReadiness: 'ready',
        continuity: getNotificationPlatformDeliveryContinuityRecord(),
      }),
    ).toBe('Unavailable');

    resetNotificationPlatformDeliveryContinuity();
    recordNotificationPlatformDeliveryRecoveryStart();
    recordNotificationPlatformDeliveryRecoverySuccess({
      diagnostics: buildNotificationPlatformDeliveryRecoveryDiagnostics([]),
    });
    expect(
      evaluateNotificationPlatformDeliveryOperationalState({
        recovering: false,
        ownerReadiness: 'ready',
        continuity: getNotificationPlatformDeliveryContinuityRecord(),
      }),
    ).toBe('Ready');
  });

  it('Degraded never fabricates Ready', () => {
    recordNotificationPlatformDeliveryRecoveryStart();
    recordNotificationPlatformDeliveryRecoverySuccess({
      diagnostics: buildNotificationPlatformDeliveryRecoveryDiagnostics([
        canonicalAnchor('ws-1', 'del-1'),
      ]),
    });
    recordNotificationPlatformDeliveryIntegrityFailure('integrity-check-failed');
    const projection = buildNotificationPlatformDeliveryContinuityProjection({
      recovering: false,
      ownerReadiness: 'ready',
      continuity: getNotificationPlatformDeliveryContinuityRecord(),
    });
    expect(projection.operationalState).toBe('Degraded');
    expect(projection.operationalState).not.toBe('Ready');
  });
});

describe('W5-N06-d notification platform delivery operational continuity — integration', () => {
  beforeEach(() => {
    resetNotificationPlatformDeliveryContinuity();
  });

  it('ownership remains notification-delivery only', () => {
    expect(W5_N06_D_NOTIFICATION_OWNER).toBe('notification-delivery');
  });

  it('platform projection includes notification platform delivery continuity view', () => {
    recordNotificationPlatformDeliveryRecoveryStart();
    recordNotificationPlatformDeliveryRecoverySuccess({
      diagnostics: buildNotificationPlatformDeliveryRecoveryDiagnostics([
        canonicalAnchor('ws-1', 'del-1'),
      ]),
    });
    const notificationPlatformDelivery = buildNotificationPlatformDeliveryContinuityProjection({
      recovering: false,
      ownerReadiness: 'ready',
      continuity: getNotificationPlatformDeliveryContinuityRecord(),
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
      recoveryTimestamp: '2026-08-29T19:00:00.000Z',
      recoveryDurationMs: 10,
      notificationPlatformDelivery,
    });
    expect(projection.notificationPlatformDelivery?.operationalState).toBe('Ready');
    expect(projection.notificationPlatformDelivery?.canonicalAnchorCount).toBe(1);
  });

  it('healthy platform components continue while notification platform delivery is Unavailable', () => {
    expect(
      notificationPlatformDeliveryContinuesWhileOthersDegraded({
        notificationPlatformDeliveryState: 'Unavailable',
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

  it('transition safety answers confirm W5-N06-b/c reuse without ownership drift', () => {
    const answers = transitionSafetyAnswers();
    expect(answers.reusesW5N06bPersistence).toBe(true);
    expect(answers.reusesW5N06cRecovery).toBe(true);
    expect(answers.degradedNeverFabricatesReady).toBe(true);
    expect(W5_N06_D_ARCHITECTURE_CLAIMS.newPersistenceOwner).toBe(false);
    expect(W5_N06_D_ARCHITECTURE_CLAIMS.platformDeliveryOperationalClaimed).toBe(false);
  });

  it('technical debt delta and explicit OUT cover W5-N06-e deferral', () => {
    expect(W5_N06_D_TECHNICAL_DEBT_DELTA.resolved.length).toBeGreaterThan(0);
    expect(W5_N06_D_TECHNICAL_DEBT_DELTA.introduced).toEqual([]);
    expect(W5_N06_D_EXPLICIT_OUT).toEqual(
      expect.arrayContaining(['w5-n06-e', 'persistence-changes']),
    );
    expect(
      W5_N06_D_TRANSITION_MATRIX.stillMissing.some((item) => item.includes('Package Close')),
    ).toBe(true);
  });

  it('required reports and domain files exist', () => {
    const wave5 = join(REPO_ROOT, 'docs/project/version-3/wave-5');
    for (const name of [
      'w5-n06-d-implementation-report.md',
      'w5-n06-d-architecture-review.md',
      'w5-n06-d-security-review.md',
      'w5-n06-d-product-review.md',
      'w5-n06-d-validation-report.md',
    ]) {
      expect(existsSync(join(wave5, name))).toBe(true);
    }
    expect(
      existsSync(
        join(
          REPO_ROOT,
          'apps/api/src/modules/notification-delivery/domain/notification-platform-delivery-operational-continuity.ts',
        ),
      ),
    ).toBe(true);
  });

  it('slice id is W5-N06-d', () => {
    expect(W5_N06_D_SLICE_ID).toBe('W5-N06-d');
  });
});
