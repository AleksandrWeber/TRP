import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { buildNotificationPlatformQueueAnchorState } from '../modules/notification-delivery/domain/durable-notification-platform-queue-anchor';
import {
  getNotificationPlatformQueueContinuityRecord,
  recordNotificationPlatformQueueIntegrityFailure,
  recordNotificationPlatformQueueRecoveryFailure,
  recordNotificationPlatformQueueRecoveryStart,
  recordNotificationPlatformQueueRecoverySuccess,
  resetNotificationPlatformQueueContinuity,
} from '../modules/notification-delivery/domain/notification-platform-queue-continuity-status';
import {
  buildNotificationPlatformQueueContinuityProjection,
  evaluateNotificationPlatformQueueOperationalState,
  notificationPlatformQueueContinuesWhileOthersDegraded,
} from '../modules/notification-delivery/domain/notification-platform-queue-operational-continuity';
import { buildNotificationPlatformQueueRecoveryDiagnostics } from '../modules/notification-delivery/domain/notification-platform-queue-restart-recovery';
import {
  buildPlatformOperationalProjection,
  healthyOwnersContinueWhileOthersUnavailable,
  OPERATIONAL_STATES,
} from '../modules/operational-continuity/operational-readiness';
import {
  transitionSafetyAnswers,
  W5_N08_D_ARCHITECTURE_CLAIMS,
  W5_N08_D_EXPLICIT_OUT,
  W5_N08_D_NOTIFICATION_OWNER,
  W5_N08_D_SLICE_ID,
  W5_N08_D_SUPPORTED_STATES,
  W5_N08_D_TECHNICAL_DEBT_DELTA,
  W5_N08_D_TRANSITION_MATRIX,
} from './w5-n08-d-notification-platform-queue-operational-continuity';

const REPO_ROOT = join(__dirname, '../../../..');
const recordedAt = '2026-08-29T20:00:00.000Z';

function canonicalAnchor(workspaceId: string, queueAnchorId: string) {
  const outcome = buildNotificationPlatformQueueAnchorState({
    workspaceId,
    queueAnchorId,
    platformQueueType: 'unified-platform-queue',
    correlationId: 'corr-1',
    actorId: 'actor-1',
    recordedAt,
    prior: null,
  });
  if (!outcome.ok) throw new Error('expected canonical anchor');
  return outcome.anchor;
}

describe('W5-N08-d notification platform queue operational continuity — unit', () => {
  beforeEach(() => {
    resetNotificationPlatformQueueContinuity();
  });

  it('operational state derivation: Recovering / Ready / Degraded / Unavailable only', () => {
    expect(W5_N08_D_SUPPORTED_STATES).toEqual([...OPERATIONAL_STATES]);
    expect(
      evaluateNotificationPlatformQueueOperationalState({
        recovering: true,
        ownerReadiness: 'ready',
        continuity: null,
      }),
    ).toBe('Recovering');
    expect(
      evaluateNotificationPlatformQueueOperationalState({
        recovering: false,
        ownerReadiness: 'unavailable',
        continuity: null,
      }),
    ).toBe('Unavailable');
    expect(W5_N08_D_ARCHITECTURE_CLAIMS.neverHardcodesReady).toBe(true);
    expect(W5_N08_D_ARCHITECTURE_CLAIMS.canFabricateReadiness).toBe(false);
  });

  it('integrity failure → Degraded; recovery failure → Unavailable; healthy recovery → Ready', () => {
    recordNotificationPlatformQueueRecoveryStart();
    recordNotificationPlatformQueueRecoverySuccess({
      diagnostics: buildNotificationPlatformQueueRecoveryDiagnostics([
        canonicalAnchor('ws-1', 'queue-1'),
      ]),
    });
    recordNotificationPlatformQueueIntegrityFailure('integrity-check-failed');
    expect(
      evaluateNotificationPlatformQueueOperationalState({
        recovering: false,
        ownerReadiness: 'ready',
        continuity: getNotificationPlatformQueueContinuityRecord(),
      }),
    ).toBe('Degraded');

    recordNotificationPlatformQueueRecoveryFailure({ reason: 'corrupt' });
    expect(
      evaluateNotificationPlatformQueueOperationalState({
        recovering: false,
        ownerReadiness: 'ready',
        continuity: getNotificationPlatformQueueContinuityRecord(),
      }),
    ).toBe('Unavailable');

    resetNotificationPlatformQueueContinuity();
    recordNotificationPlatformQueueRecoveryStart();
    recordNotificationPlatformQueueRecoverySuccess({
      diagnostics: buildNotificationPlatformQueueRecoveryDiagnostics([]),
    });
    expect(
      evaluateNotificationPlatformQueueOperationalState({
        recovering: false,
        ownerReadiness: 'ready',
        continuity: getNotificationPlatformQueueContinuityRecord(),
      }),
    ).toBe('Ready');
  });

  it('Degraded never fabricates Ready', () => {
    recordNotificationPlatformQueueRecoveryStart();
    recordNotificationPlatformQueueRecoverySuccess({
      diagnostics: buildNotificationPlatformQueueRecoveryDiagnostics([
        canonicalAnchor('ws-1', 'queue-1'),
      ]),
    });
    recordNotificationPlatformQueueIntegrityFailure('integrity-check-failed');
    const projection = buildNotificationPlatformQueueContinuityProjection({
      recovering: false,
      ownerReadiness: 'ready',
      continuity: getNotificationPlatformQueueContinuityRecord(),
    });
    expect(projection.operationalState).toBe('Degraded');
    expect(projection.operationalState).not.toBe('Ready');
  });
});

describe('W5-N08-d notification platform queue operational continuity — integration', () => {
  beforeEach(() => {
    resetNotificationPlatformQueueContinuity();
  });

  it('ownership remains notification-delivery only', () => {
    expect(W5_N08_D_NOTIFICATION_OWNER).toBe('notification-delivery');
  });

  it('platform projection includes notification platform queue continuity view', () => {
    recordNotificationPlatformQueueRecoveryStart();
    recordNotificationPlatformQueueRecoverySuccess({
      diagnostics: buildNotificationPlatformQueueRecoveryDiagnostics([
        canonicalAnchor('ws-1', 'queue-1'),
      ]),
    });
    const notificationPlatformQueue = buildNotificationPlatformQueueContinuityProjection({
      recovering: false,
      ownerReadiness: 'ready',
      continuity: getNotificationPlatformQueueContinuityRecord(),
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
      recoveryTimestamp: '2026-08-29T20:00:00.000Z',
      recoveryDurationMs: 10,
      notificationPlatformQueue,
    });
    expect(projection.notificationPlatformQueue?.operationalState).toBe('Ready');
    expect(projection.notificationPlatformQueue?.canonicalAnchorCount).toBe(1);
  });

  it('healthy platform components continue while notification platform queue is Unavailable', () => {
    expect(
      notificationPlatformQueueContinuesWhileOthersDegraded({
        notificationPlatformQueueState: 'Unavailable',
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
    expect(transitionSafetyAnswers().reusesW5N08bPersistence).toBe(true);
    expect(transitionSafetyAnswers().reusesW5N08cRecovery).toBe(true);
    expect(transitionSafetyAnswers().degradedNeverFabricatesReady).toBe(true);
  });

  it('architecture claims: no platform queue execution or functional claims', () => {
    expect(W5_N08_D_ARCHITECTURE_CLAIMS.platformQueueExecution).toBe(false);
    expect(W5_N08_D_ARCHITECTURE_CLAIMS.platformQueueFunctionalClaimed).toBe(false);
    expect(W5_N08_D_ARCHITECTURE_CLAIMS.queueWorkersImplemented).toBe(false);
    expect(W5_N08_D_ARCHITECTURE_CLAIMS.newPersistenceOwner).toBe(false);
  });

  it('technical debt delta: operational continuity resolved; package close deferred', () => {
    expect(W5_N08_D_TECHNICAL_DEBT_DELTA.resolved.length).toBeGreaterThan(0);
    expect(W5_N08_D_TECHNICAL_DEBT_DELTA.introduced).toEqual([]);
    expect(
      W5_N08_D_TECHNICAL_DEBT_DELTA.deferred.some((item) => item.toLowerCase().includes('close')),
    ).toBe(true);
  });

  it('explicit OUT covers W5-N08-e and queue execution', () => {
    expect(W5_N08_D_EXPLICIT_OUT).toEqual(
      expect.arrayContaining(['w5-n08-e', 'platform-queue-execution']),
    );
  });

  it('transition matrix: recovery + operational continuity; package close still missing', () => {
    expect(W5_N08_D_TRANSITION_MATRIX.before).toContain('Restart recovery (W5-N08-c)');
    expect(W5_N08_D_TRANSITION_MATRIX.after).toContain('Operational continuity (W5-N08-d)');
    expect(
      W5_N08_D_TRANSITION_MATRIX.stillMissing.some((item) => item.includes('Package Close')),
    ).toBe(true);
  });

  it('required reports and domain files exist', () => {
    const wave5 = join(REPO_ROOT, 'docs/project/version-3/wave-5');
    for (const name of [
      'w5-n08-d-implementation-report.md',
      'w5-n08-d-architecture-review.md',
      'w5-n08-d-security-review.md',
      'w5-n08-d-product-review.md',
      'w5-n08-d-validation-report.md',
    ]) {
      expect(existsSync(join(wave5, name))).toBe(true);
    }
    expect(
      existsSync(
        join(
          REPO_ROOT,
          'apps/api/src/modules/notification-delivery/domain/notification-platform-queue-operational-continuity.ts',
        ),
      ),
    ).toBe(true);
  });

  it('slice id is W5-N08-d', () => {
    expect(W5_N08_D_SLICE_ID).toBe('W5-N08-d');
  });
});
