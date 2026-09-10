import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { buildNotificationPlatformRetrySchedulingAnchorState } from '../modules/notification-delivery/domain/durable-notification-platform-retry-scheduling-anchor';
import {
  getNotificationPlatformRetrySchedulingContinuityRecord,
  recordNotificationPlatformRetrySchedulingIntegrityFailure,
  recordNotificationPlatformRetrySchedulingRecoveryFailure,
  recordNotificationPlatformRetrySchedulingRecoveryStart,
  recordNotificationPlatformRetrySchedulingRecoverySuccess,
  resetNotificationPlatformRetrySchedulingContinuity,
} from '../modules/notification-delivery/domain/notification-platform-retry-scheduling-continuity-status';
import {
  buildNotificationPlatformRetrySchedulingContinuityProjection,
  evaluateNotificationPlatformRetrySchedulingOperationalState,
  notificationPlatformRetrySchedulingContinuesWhileOthersDegraded,
} from '../modules/notification-delivery/domain/notification-platform-retry-scheduling-operational-continuity';
import { buildNotificationPlatformRetrySchedulingRecoveryDiagnostics } from '../modules/notification-delivery/domain/notification-platform-retry-scheduling-restart-recovery';
import {
  buildPlatformOperationalProjection,
  healthyOwnersContinueWhileOthersUnavailable,
  OPERATIONAL_STATES,
} from '../modules/operational-continuity/operational-readiness';
import {
  transitionSafetyAnswers,
  W5_N19_D_ARCHITECTURE_CLAIMS,
  W5_N19_D_EXPLICIT_OUT,
  W5_N19_D_NOTIFICATION_OWNER,
  W5_N19_D_SLICE_ID,
  W5_N19_D_SUPPORTED_STATES,
  W5_N19_D_TECHNICAL_DEBT_DELTA,
  W5_N19_D_TRANSITION_MATRIX,
} from './w5-n19-d-notification-platform-retry-scheduling-operational-continuity';

const REPO_ROOT = join(__dirname, '../../../..');
const recordedAt = '2026-09-10T21:30:00.000Z';

function canonicalAnchor(workspaceId: string, retrySchedulingAnchorId: string) {
  const outcome = buildNotificationPlatformRetrySchedulingAnchorState({
    workspaceId,
    retrySchedulingAnchorId,
    platformRetrySchedulingType: 'eligibility-timing-foundation',
    correlationId: 'corr-1',
    actorId: 'actor-1',
    recordedAt,
    prior: null,
  });
  if (!outcome.ok) throw new Error('expected canonical anchor');
  return outcome.anchor;
}

describe('W5-N19-d notification platform retry scheduling operational continuity — unit', () => {
  beforeEach(() => {
    resetNotificationPlatformRetrySchedulingContinuity();
  });

  it('operational state derivation: Recovering / Ready / Degraded / Unavailable only', () => {
    expect(W5_N19_D_SUPPORTED_STATES).toEqual([...OPERATIONAL_STATES]);
    expect(
      evaluateNotificationPlatformRetrySchedulingOperationalState({
        recovering: true,
        ownerReadiness: 'ready',
        continuity: null,
      }),
    ).toBe('Recovering');
    expect(
      evaluateNotificationPlatformRetrySchedulingOperationalState({
        recovering: false,
        ownerReadiness: 'unavailable',
        continuity: null,
      }),
    ).toBe('Unavailable');
    expect(W5_N19_D_ARCHITECTURE_CLAIMS.neverHardcodesReady).toBe(true);
    expect(W5_N19_D_ARCHITECTURE_CLAIMS.canFabricateReadiness).toBe(false);
  });

  it('integrity failure → Degraded; recovery failure → Unavailable; healthy recovery → Ready', () => {
    recordNotificationPlatformRetrySchedulingRecoveryStart();
    recordNotificationPlatformRetrySchedulingRecoverySuccess({
      diagnostics: buildNotificationPlatformRetrySchedulingRecoveryDiagnostics([
        canonicalAnchor('ws-1', 'retry-scheduling-1'),
      ]),
    });
    recordNotificationPlatformRetrySchedulingIntegrityFailure('integrity-check-failed');
    expect(
      evaluateNotificationPlatformRetrySchedulingOperationalState({
        recovering: false,
        ownerReadiness: 'ready',
        continuity: getNotificationPlatformRetrySchedulingContinuityRecord(),
      }),
    ).toBe('Degraded');

    recordNotificationPlatformRetrySchedulingRecoveryFailure({ reason: 'corrupt' });
    expect(
      evaluateNotificationPlatformRetrySchedulingOperationalState({
        recovering: false,
        ownerReadiness: 'ready',
        continuity: getNotificationPlatformRetrySchedulingContinuityRecord(),
      }),
    ).toBe('Unavailable');

    resetNotificationPlatformRetrySchedulingContinuity();
    recordNotificationPlatformRetrySchedulingRecoveryStart();
    recordNotificationPlatformRetrySchedulingRecoverySuccess({
      diagnostics: buildNotificationPlatformRetrySchedulingRecoveryDiagnostics([]),
    });
    expect(
      evaluateNotificationPlatformRetrySchedulingOperationalState({
        recovering: false,
        ownerReadiness: 'ready',
        continuity: getNotificationPlatformRetrySchedulingContinuityRecord(),
      }),
    ).toBe('Ready');
  });

  it('Degraded never fabricates Ready', () => {
    recordNotificationPlatformRetrySchedulingRecoveryStart();
    recordNotificationPlatformRetrySchedulingRecoverySuccess({
      diagnostics: buildNotificationPlatformRetrySchedulingRecoveryDiagnostics([
        canonicalAnchor('ws-1', 'retry-scheduling-1'),
      ]),
    });
    recordNotificationPlatformRetrySchedulingIntegrityFailure('integrity-check-failed');
    const projection = buildNotificationPlatformRetrySchedulingContinuityProjection({
      recovering: false,
      ownerReadiness: 'ready',
      continuity: getNotificationPlatformRetrySchedulingContinuityRecord(),
    });
    expect(projection.operationalState).toBe('Degraded');
    expect(projection.operationalState).not.toBe('Ready');
  });
});

describe('W5-N19-d notification platform retry scheduling operational continuity — integration', () => {
  beforeEach(() => {
    resetNotificationPlatformRetrySchedulingContinuity();
  });

  it('ownership remains notification-delivery only', () => {
    expect(W5_N19_D_NOTIFICATION_OWNER).toBe('notification-delivery');
  });

  it('platform projection includes notification platform retry scheduling continuity view', () => {
    recordNotificationPlatformRetrySchedulingRecoveryStart();
    recordNotificationPlatformRetrySchedulingRecoverySuccess({
      diagnostics: buildNotificationPlatformRetrySchedulingRecoveryDiagnostics([
        canonicalAnchor('ws-1', 'retry-scheduling-1'),
      ]),
    });
    const notificationPlatformRetryScheduling =
      buildNotificationPlatformRetrySchedulingContinuityProjection({
        recovering: false,
        ownerReadiness: 'ready',
        continuity: getNotificationPlatformRetrySchedulingContinuityRecord(),
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
      recoveryTimestamp: '2026-09-10T21:30:00.000Z',
      recoveryDurationMs: 10,
      notificationPlatformRetryScheduling,
    });
    expect(projection.notificationPlatformRetryScheduling?.operationalState).toBe('Ready');
    expect(projection.notificationPlatformRetryScheduling?.canonicalAnchorCount).toBe(1);
  });

  it('healthy platform components continue while notification platform retry scheduling is Unavailable', () => {
    expect(
      notificationPlatformRetrySchedulingContinuesWhileOthersDegraded({
        notificationPlatformRetrySchedulingState: 'Unavailable',
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
    expect(transitionSafetyAnswers().reusesW5N19bPersistence).toBe(true);
    expect(transitionSafetyAnswers().reusesW5N19cRecovery).toBe(true);
    expect(transitionSafetyAnswers().degradedNeverFabricatesReady).toBe(true);
  });

  it('architecture claims: no retry scheduling runtime or functional claims', () => {
    expect(W5_N19_D_ARCHITECTURE_CLAIMS.retrySchedulingRuntime).toBe(false);
    expect(W5_N19_D_ARCHITECTURE_CLAIMS.retrySchedulingImplemented).toBe(false);
    expect(W5_N19_D_ARCHITECTURE_CLAIMS.retrySchedulingFunctionalClaimed).toBe(false);
    expect(W5_N19_D_ARCHITECTURE_CLAIMS.operationalContinuityDerived).toBe(true);
    expect(W5_N19_D_ARCHITECTURE_CLAIMS.customerVisibleFeature).toBe(true);
    expect(W5_N19_D_ARCHITECTURE_CLAIMS.w5N19CompleteClaimed).toBe(false);
    expect(W5_N19_D_ARCHITECTURE_CLAIMS.newPersistenceOwner).toBe(false);
    expect(W5_N19_D_ARCHITECTURE_CLAIMS.schedulerPlatformIntroduced).toBe(false);
  });

  it('technical debt delta: operational continuity resolved; package Close deferred to slice e', () => {
    expect(W5_N19_D_TECHNICAL_DEBT_DELTA.resolved).toContain(
      'Retry Scheduling Operational Continuity Foundation',
    );
    expect(W5_N19_D_TECHNICAL_DEBT_DELTA.introduced).toEqual([]);
    expect(W5_N19_D_TECHNICAL_DEBT_DELTA.deferred).toEqual([
      'W5-N19-e — Package Validation, Operational Verification & Close Evidence',
    ]);
  });

  it('explicit OUT covers W5-N19-e and retry scheduling runtime', () => {
    expect(W5_N19_D_EXPLICIT_OUT).toEqual(
      expect.arrayContaining(['w5-n19-e', 'retry-scheduling-runtime']),
    );
  });

  it('transition matrix: recovery + operational continuity; retry scheduling runtime still missing', () => {
    expect(W5_N19_D_TRANSITION_MATRIX.before).toContain('Restart recovery (W5-N19-c)');
    expect(W5_N19_D_TRANSITION_MATRIX.after).toContain('Operational continuity (W5-N19-d)');
    expect(
      W5_N19_D_TRANSITION_MATRIX.stillMissing.some((item) => item.includes('Package Close')),
    ).toBe(true);
    expect(
      W5_N19_D_TRANSITION_MATRIX.stillMissing.some((item) =>
        item.includes('Retry scheduling runtime'),
      ),
    ).toBe(true);
  });

  it('required reports and domain files exist', () => {
    const wave5 = join(REPO_ROOT, 'docs/project/version-3/wave-5');
    for (const name of [
      'w5-n19-d-implementation-report.md',
      'w5-n19-d-architecture-review.md',
      'w5-n19-d-security-review.md',
      'w5-n19-d-product-review.md',
      'w5-n19-d-validation-report.md',
    ]) {
      expect(existsSync(join(wave5, name))).toBe(true);
    }
    expect(
      existsSync(
        join(
          REPO_ROOT,
          'apps/api/src/modules/notification-delivery/domain/notification-platform-retry-scheduling-operational-continuity.ts',
        ),
      ),
    ).toBe(true);
  });

  it('slice id is W5-N19-d', () => {
    expect(W5_N19_D_SLICE_ID).toBe('W5-N19-d');
  });
});
