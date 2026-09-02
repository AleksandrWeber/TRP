import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { buildNotificationPlatformWorkerRuntimeAnchorState } from '../modules/notification-delivery/domain/durable-notification-platform-worker-runtime-anchor';
import {
  getNotificationPlatformWorkerRuntimeContinuityRecord,
  recordNotificationPlatformWorkerRuntimeIntegrityFailure,
  recordNotificationPlatformWorkerRuntimeRecoveryFailure,
  recordNotificationPlatformWorkerRuntimeRecoveryStart,
  recordNotificationPlatformWorkerRuntimeRecoverySuccess,
  resetNotificationPlatformWorkerRuntimeContinuity,
} from '../modules/notification-delivery/domain/notification-platform-worker-runtime-continuity-status';
import {
  buildNotificationPlatformWorkerRuntimeContinuityProjection,
  evaluateNotificationPlatformWorkerRuntimeOperationalState,
  notificationPlatformWorkerRuntimeContinuesWhileOthersDegraded,
} from '../modules/notification-delivery/domain/notification-platform-worker-runtime-operational-continuity';
import { buildNotificationPlatformWorkerRuntimeRecoveryDiagnostics } from '../modules/notification-delivery/domain/notification-platform-worker-runtime-restart-recovery';
import {
  buildPlatformOperationalProjection,
  healthyOwnersContinueWhileOthersUnavailable,
  OPERATIONAL_STATES,
} from '../modules/operational-continuity/operational-readiness';
import {
  transitionSafetyAnswers,
  W5_N11_D_ARCHITECTURE_CLAIMS,
  W5_N11_D_EXPLICIT_OUT,
  W5_N11_D_NOTIFICATION_OWNER,
  W5_N11_D_SLICE_ID,
  W5_N11_D_SUPPORTED_STATES,
  W5_N11_D_TECHNICAL_DEBT_DELTA,
  W5_N11_D_TRANSITION_MATRIX,
} from './w5-n11-d-notification-platform-worker-runtime-operational-continuity';

const REPO_ROOT = join(__dirname, '../../../..');
const recordedAt = '2026-09-02T10:00:00.000Z';

function canonicalAnchor(workspaceId: string, workerRuntimeAnchorId: string) {
  const outcome = buildNotificationPlatformWorkerRuntimeAnchorState({
    workspaceId,
    workerRuntimeAnchorId,
    platformWorkerRuntimeType: 'unified-platform-worker-runtime',
    correlationId: 'corr-1',
    actorId: 'actor-1',
    recordedAt,
    prior: null,
  });
  if (!outcome.ok) throw new Error('expected canonical anchor');
  return outcome.anchor;
}

describe('W5-N11-d notification platform worker runtime operational continuity — unit', () => {
  beforeEach(() => {
    resetNotificationPlatformWorkerRuntimeContinuity();
  });

  it('operational state derivation: Recovering / Ready / Degraded / Unavailable only', () => {
    expect(W5_N11_D_SUPPORTED_STATES).toEqual([...OPERATIONAL_STATES]);
    expect(
      evaluateNotificationPlatformWorkerRuntimeOperationalState({
        recovering: true,
        ownerReadiness: 'ready',
        continuity: null,
      }),
    ).toBe('Recovering');
    expect(
      evaluateNotificationPlatformWorkerRuntimeOperationalState({
        recovering: false,
        ownerReadiness: 'unavailable',
        continuity: null,
      }),
    ).toBe('Unavailable');
    expect(W5_N11_D_ARCHITECTURE_CLAIMS.neverHardcodesReady).toBe(true);
    expect(W5_N11_D_ARCHITECTURE_CLAIMS.canFabricateReadiness).toBe(false);
  });

  it('integrity failure → Degraded; recovery failure → Unavailable; healthy recovery → Ready', () => {
    recordNotificationPlatformWorkerRuntimeRecoveryStart();
    recordNotificationPlatformWorkerRuntimeRecoverySuccess({
      diagnostics: buildNotificationPlatformWorkerRuntimeRecoveryDiagnostics([
        canonicalAnchor('ws-1', 'worker-runtime-1'),
      ]),
    });
    recordNotificationPlatformWorkerRuntimeIntegrityFailure('integrity-check-failed');
    expect(
      evaluateNotificationPlatformWorkerRuntimeOperationalState({
        recovering: false,
        ownerReadiness: 'ready',
        continuity: getNotificationPlatformWorkerRuntimeContinuityRecord(),
      }),
    ).toBe('Degraded');

    recordNotificationPlatformWorkerRuntimeRecoveryFailure({ reason: 'corrupt' });
    expect(
      evaluateNotificationPlatformWorkerRuntimeOperationalState({
        recovering: false,
        ownerReadiness: 'ready',
        continuity: getNotificationPlatformWorkerRuntimeContinuityRecord(),
      }),
    ).toBe('Unavailable');

    resetNotificationPlatformWorkerRuntimeContinuity();
    recordNotificationPlatformWorkerRuntimeRecoveryStart();
    recordNotificationPlatformWorkerRuntimeRecoverySuccess({
      diagnostics: buildNotificationPlatformWorkerRuntimeRecoveryDiagnostics([]),
    });
    expect(
      evaluateNotificationPlatformWorkerRuntimeOperationalState({
        recovering: false,
        ownerReadiness: 'ready',
        continuity: getNotificationPlatformWorkerRuntimeContinuityRecord(),
      }),
    ).toBe('Ready');
  });

  it('Degraded never fabricates Ready', () => {
    recordNotificationPlatformWorkerRuntimeRecoveryStart();
    recordNotificationPlatformWorkerRuntimeRecoverySuccess({
      diagnostics: buildNotificationPlatformWorkerRuntimeRecoveryDiagnostics([
        canonicalAnchor('ws-1', 'worker-runtime-1'),
      ]),
    });
    recordNotificationPlatformWorkerRuntimeIntegrityFailure('integrity-check-failed');
    const projection = buildNotificationPlatformWorkerRuntimeContinuityProjection({
      recovering: false,
      ownerReadiness: 'ready',
      continuity: getNotificationPlatformWorkerRuntimeContinuityRecord(),
    });
    expect(projection.operationalState).toBe('Degraded');
    expect(projection.operationalState).not.toBe('Ready');
  });
});

describe('W5-N11-d notification platform worker runtime operational continuity — integration', () => {
  beforeEach(() => {
    resetNotificationPlatformWorkerRuntimeContinuity();
  });

  it('ownership remains notification-delivery only', () => {
    expect(W5_N11_D_NOTIFICATION_OWNER).toBe('notification-delivery');
  });

  it('platform projection includes notification platform worker runtime continuity view', () => {
    recordNotificationPlatformWorkerRuntimeRecoveryStart();
    recordNotificationPlatformWorkerRuntimeRecoverySuccess({
      diagnostics: buildNotificationPlatformWorkerRuntimeRecoveryDiagnostics([
        canonicalAnchor('ws-1', 'worker-runtime-1'),
      ]),
    });
    const notificationPlatformWorkerRuntime =
      buildNotificationPlatformWorkerRuntimeContinuityProjection({
        recovering: false,
        ownerReadiness: 'ready',
        continuity: getNotificationPlatformWorkerRuntimeContinuityRecord(),
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
      recoveryTimestamp: '2026-09-02T10:00:00.000Z',
      recoveryDurationMs: 10,
      notificationPlatformWorkerRuntime,
    });
    expect(projection.notificationPlatformWorkerRuntime?.operationalState).toBe('Ready');
    expect(projection.notificationPlatformWorkerRuntime?.canonicalAnchorCount).toBe(1);
  });

  it('healthy platform components continue while notification platform worker runtime is Unavailable', () => {
    expect(
      notificationPlatformWorkerRuntimeContinuesWhileOthersDegraded({
        notificationPlatformWorkerRuntimeState: 'Unavailable',
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
    expect(transitionSafetyAnswers().reusesW5N11bPersistence).toBe(true);
    expect(transitionSafetyAnswers().reusesW5N11cRecovery).toBe(true);
    expect(transitionSafetyAnswers().degradedNeverFabricatesReady).toBe(true);
  });

  it('architecture claims: no platform worker runtime execution or functional claims', () => {
    expect(W5_N11_D_ARCHITECTURE_CLAIMS.platformWorkerRuntimeExecution).toBe(false);
    expect(W5_N11_D_ARCHITECTURE_CLAIMS.platformWorkerRuntimeFunctionalClaimed).toBe(false);
    expect(W5_N11_D_ARCHITECTURE_CLAIMS.workerRuntimeImplemented).toBe(false);
    expect(W5_N11_D_ARCHITECTURE_CLAIMS.newPersistenceOwner).toBe(false);
  });

  it('technical debt delta: operational continuity resolved; package close deferred', () => {
    expect(W5_N11_D_TECHNICAL_DEBT_DELTA.resolved.length).toBeGreaterThan(0);
    expect(W5_N11_D_TECHNICAL_DEBT_DELTA.introduced).toEqual([]);
    expect(
      W5_N11_D_TECHNICAL_DEBT_DELTA.deferred.some((item) => item.toLowerCase().includes('close')),
    ).toBe(true);
  });

  it('explicit OUT covers W5-N11-e and worker runtime execution', () => {
    expect(W5_N11_D_EXPLICIT_OUT).toEqual(
      expect.arrayContaining(['w5-n11-e', 'platform-worker-runtime-execution']),
    );
  });

  it('transition matrix: recovery + operational continuity; package close still missing', () => {
    expect(W5_N11_D_TRANSITION_MATRIX.before).toContain('Restart recovery (W5-N11-c)');
    expect(W5_N11_D_TRANSITION_MATRIX.after).toContain('Operational continuity (W5-N11-d)');
    expect(
      W5_N11_D_TRANSITION_MATRIX.stillMissing.some((item) => item.includes('Package Close')),
    ).toBe(true);
  });

  it('required reports and domain files exist', () => {
    const wave5 = join(REPO_ROOT, 'docs/project/version-3/wave-5');
    for (const name of [
      'w5-n11-d-implementation-report.md',
      'w5-n11-d-architecture-review.md',
      'w5-n11-d-security-review.md',
      'w5-n11-d-product-review.md',
      'w5-n11-d-validation-report.md',
    ]) {
      expect(existsSync(join(wave5, name))).toBe(true);
    }
    expect(
      existsSync(
        join(
          REPO_ROOT,
          'apps/api/src/modules/notification-delivery/domain/notification-platform-worker-runtime-operational-continuity.ts',
        ),
      ),
    ).toBe(true);
  });

  it('slice id is W5-N11-d', () => {
    expect(W5_N11_D_SLICE_ID).toBe('W5-N11-d');
  });
});
