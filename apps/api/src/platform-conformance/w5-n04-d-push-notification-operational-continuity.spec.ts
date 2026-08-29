import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { buildPushNotificationAnchorState } from '../modules/notification-delivery/domain/durable-push-notification-anchor';
import {
  getPushNotificationContinuityRecord,
  recordPushNotificationIntegrityFailure,
  recordPushNotificationRecoveryFailure,
  recordPushNotificationRecoveryStart,
  recordPushNotificationRecoverySuccess,
  resetPushNotificationContinuity,
} from '../modules/notification-delivery/domain/push-notification-continuity-status';
import {
  buildPushNotificationContinuityProjection,
  evaluatePushNotificationOperationalState,
  pushNotificationContinuesWhileOthersDegraded,
} from '../modules/notification-delivery/domain/push-notification-operational-continuity';
import { buildPushNotificationRecoveryDiagnostics } from '../modules/notification-delivery/domain/push-notification-restart-recovery';
import {
  buildPlatformOperationalProjection,
  healthyOwnersContinueWhileOthersUnavailable,
  OPERATIONAL_STATES,
} from '../modules/operational-continuity/operational-readiness';
import {
  transitionSafetyAnswers,
  W5_N04_D_ARCHITECTURE_CLAIMS,
  W5_N04_D_EXPLICIT_OUT,
  W5_N04_D_NOTIFICATION_OWNER,
  W5_N04_D_SLICE_ID,
  W5_N04_D_SUPPORTED_STATES,
  W5_N04_D_TECHNICAL_DEBT_DELTA,
  W5_N04_D_TRANSITION_MATRIX,
} from './w5-n04-d-push-notification-operational-continuity';

const REPO_ROOT = join(__dirname, '../../../..');
const recordedAt = '2026-08-29T17:00:00.000Z';

function canonicalAnchor(workspaceId: string, notificationId: string) {
  const outcome = buildPushNotificationAnchorState({
    workspaceId,
    notificationId,
    notificationChannel: 'push',
    notificationType: 'report-complete',
    recipientIdentifier: 'device-ref-1',
    templateIdentifier: 'inline:report-complete',
    correlationId: 'corr-1',
    actorId: 'actor-1',
    recordedAt,
    prior: null,
  });
  if (!outcome.ok) throw new Error('expected canonical anchor');
  return outcome.anchor;
}

describe('W5-N04-d push notification operational continuity — unit', () => {
  beforeEach(() => {
    resetPushNotificationContinuity();
  });

  it('operational state derivation: Recovering / Ready / Degraded / Unavailable only', () => {
    expect(W5_N04_D_SUPPORTED_STATES).toEqual([...OPERATIONAL_STATES]);
    expect(
      evaluatePushNotificationOperationalState({
        recovering: true,
        ownerReadiness: 'ready',
        continuity: null,
      }),
    ).toBe('Recovering');
    expect(
      evaluatePushNotificationOperationalState({
        recovering: false,
        ownerReadiness: 'unavailable',
        continuity: null,
      }),
    ).toBe('Unavailable');
    expect(W5_N04_D_ARCHITECTURE_CLAIMS.neverHardcodesReady).toBe(true);
    expect(W5_N04_D_ARCHITECTURE_CLAIMS.canFabricateReadiness).toBe(false);
  });

  it('integrity failure → Degraded; recovery failure → Unavailable; healthy recovery → Ready', () => {
    recordPushNotificationRecoveryStart();
    recordPushNotificationRecoverySuccess({
      diagnostics: buildPushNotificationRecoveryDiagnostics([canonicalAnchor('ws-1', 'ntf-1')]),
    });
    recordPushNotificationIntegrityFailure('integrity-check-failed');
    expect(
      evaluatePushNotificationOperationalState({
        recovering: false,
        ownerReadiness: 'ready',
        continuity: getPushNotificationContinuityRecord(),
      }),
    ).toBe('Degraded');

    recordPushNotificationRecoveryFailure({ reason: 'corrupt' });
    expect(
      evaluatePushNotificationOperationalState({
        recovering: false,
        ownerReadiness: 'ready',
        continuity: getPushNotificationContinuityRecord(),
      }),
    ).toBe('Unavailable');

    resetPushNotificationContinuity();
    recordPushNotificationRecoveryStart();
    recordPushNotificationRecoverySuccess({
      diagnostics: buildPushNotificationRecoveryDiagnostics([]),
    });
    expect(
      evaluatePushNotificationOperationalState({
        recovering: false,
        ownerReadiness: 'ready',
        continuity: getPushNotificationContinuityRecord(),
      }),
    ).toBe('Ready');
  });

  it('Degraded never fabricates Ready', () => {
    recordPushNotificationRecoveryStart();
    recordPushNotificationRecoverySuccess({
      diagnostics: buildPushNotificationRecoveryDiagnostics([canonicalAnchor('ws-1', 'ntf-1')]),
    });
    recordPushNotificationIntegrityFailure('integrity-check-failed');
    const projection = buildPushNotificationContinuityProjection({
      recovering: false,
      ownerReadiness: 'ready',
      continuity: getPushNotificationContinuityRecord(),
    });
    expect(projection.operationalState).toBe('Degraded');
    expect(projection.operationalState).not.toBe('Ready');
  });
});

describe('W5-N04-d push notification operational continuity — integration', () => {
  beforeEach(() => {
    resetPushNotificationContinuity();
  });

  it('ownership remains notification-delivery only', () => {
    expect(W5_N04_D_NOTIFICATION_OWNER).toBe('notification-delivery');
  });

  it('platform projection includes push notification continuity view', () => {
    recordPushNotificationRecoveryStart();
    recordPushNotificationRecoverySuccess({
      diagnostics: buildPushNotificationRecoveryDiagnostics([canonicalAnchor('ws-1', 'ntf-1')]),
    });
    const pushNotification = buildPushNotificationContinuityProjection({
      recovering: false,
      ownerReadiness: 'ready',
      continuity: getPushNotificationContinuityRecord(),
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
      recoveryTimestamp: '2026-08-29T17:00:00.000Z',
      recoveryDurationMs: 10,
      pushNotification,
    });
    expect(projection.pushNotification?.operationalState).toBe('Ready');
    expect(projection.pushNotification?.canonicalAnchorCount).toBe(1);
  });

  it('healthy platform components continue while push notification is Unavailable', () => {
    expect(
      pushNotificationContinuesWhileOthersDegraded({
        pushNotificationState: 'Unavailable',
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

  it('transition safety answers confirm W5-N04-b/c reuse without ownership drift', () => {
    const answers = transitionSafetyAnswers();
    expect(answers.reusesW5N04bPersistence).toBe(true);
    expect(answers.reusesW5N04cRecovery).toBe(true);
    expect(answers.degradedNeverFabricatesReady).toBe(true);
    expect(W5_N04_D_ARCHITECTURE_CLAIMS.newPersistenceOwner).toBe(false);
    expect(W5_N04_D_ARCHITECTURE_CLAIMS.pushNotificationsOperationalClaimed).toBe(false);
  });

  it('technical debt delta and explicit OUT cover W5-N04-e deferral', () => {
    expect(W5_N04_D_TECHNICAL_DEBT_DELTA.resolved.length).toBeGreaterThan(0);
    expect(W5_N04_D_TECHNICAL_DEBT_DELTA.introduced).toEqual([]);
    expect(W5_N04_D_EXPLICIT_OUT).toEqual(
      expect.arrayContaining(['w5-n04-e', 'persistence-changes']),
    );
    expect(
      W5_N04_D_TRANSITION_MATRIX.stillMissing.some((item) => item.includes('Package Close')),
    ).toBe(true);
  });

  it('required reports and domain files exist', () => {
    const wave5 = join(REPO_ROOT, 'docs/project/version-3/wave-5');
    for (const name of [
      'w5-n04-d-implementation-report.md',
      'w5-n04-d-architecture-review.md',
      'w5-n04-d-security-review.md',
      'w5-n04-d-product-review.md',
      'w5-n04-d-validation-report.md',
    ]) {
      expect(existsSync(join(wave5, name))).toBe(true);
    }
    expect(
      existsSync(
        join(
          REPO_ROOT,
          'apps/api/src/modules/notification-delivery/domain/push-notification-operational-continuity.ts',
        ),
      ),
    ).toBe(true);
  });

  it('slice id is W5-N04-d', () => {
    expect(W5_N04_D_SLICE_ID).toBe('W5-N04-d');
  });
});
