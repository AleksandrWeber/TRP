import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { buildNotificationPlatformRetrySchedulingDecisionProjectionAnchorState } from '../modules/notification-delivery/domain/durable-notification-platform-retry-scheduling-decision-projection-anchor';
import {
  getNotificationPlatformRetrySchedulingDecisionProjectionContinuityRecord,
  recordNotificationPlatformRetrySchedulingDecisionProjectionIntegrityFailure,
  recordNotificationPlatformRetrySchedulingDecisionProjectionRecoveryFailure,
  recordNotificationPlatformRetrySchedulingDecisionProjectionRecoveryStart,
  recordNotificationPlatformRetrySchedulingDecisionProjectionRecoverySuccess,
  resetNotificationPlatformRetrySchedulingDecisionProjectionContinuity,
} from '../modules/notification-delivery/domain/notification-platform-retry-scheduling-decision-projection-continuity-status';
import {
  buildNotificationPlatformRetrySchedulingDecisionProjectionContinuityProjection,
  evaluateNotificationPlatformRetrySchedulingDecisionProjectionOperationalState,
  notificationPlatformRetrySchedulingDecisionProjectionContinuesWhileOthersDegraded,
} from '../modules/notification-delivery/domain/notification-platform-retry-scheduling-decision-projection-operational-continuity';
import { buildNotificationPlatformRetrySchedulingDecisionProjectionRecoveryDiagnostics } from '../modules/notification-delivery/domain/notification-platform-retry-scheduling-decision-projection-restart-recovery';
import {
  buildPlatformOperationalProjection,
  healthyOwnersContinueWhileOthersUnavailable,
  OPERATIONAL_STATES,
} from '../modules/operational-continuity/operational-readiness';
import {
  transitionSafetyAnswers,
  W5_N27_D_ARCHITECTURE_CLAIMS,
  W5_N27_D_EXPLICIT_OUT,
  W5_N27_D_NOTIFICATION_OWNER,
  W5_N27_D_SLICE_ID,
  W5_N27_D_SUPPORTED_STATES,
  W5_N27_D_TECHNICAL_DEBT_DELTA,
  W5_N27_D_TRANSITION_MATRIX,
} from './w5-n27-d-notification-platform-retry-scheduling-decision-projection-operational-continuity';

const REPO_ROOT = join(__dirname, '../../../..');
const recordedAt = '2026-09-13T22:40:00.000Z';

function canonicalAnchor(workspaceId: string, projectionAnchorId: string) {
  const outcome = buildNotificationPlatformRetrySchedulingDecisionProjectionAnchorState({
    workspaceId,
    projectionAnchorId,
    platformRetrySchedulingDecisionProjectionType: 'decision-projection-description-foundation',
    correlationId: 'corr-1',
    actorId: 'actor-1',
    recordedAt,
    prior: null,
  });
  if (!outcome.ok) throw new Error('expected canonical decision anchor');
  return outcome.anchor;
}

describe('W5-N27-d notification platform retry scheduling decision projection operational continuity — unit', () => {
  beforeEach(() => {
    resetNotificationPlatformRetrySchedulingDecisionProjectionContinuity();
  });

  it('operational state derivation: Recovering / Ready / Degraded / Unavailable only', () => {
    expect(W5_N27_D_SUPPORTED_STATES).toEqual([...OPERATIONAL_STATES]);
    expect(
      evaluateNotificationPlatformRetrySchedulingDecisionProjectionOperationalState({
        recovering: true,
        ownerReadiness: 'ready',
        continuity: null,
      }),
    ).toBe('Recovering');
    expect(
      evaluateNotificationPlatformRetrySchedulingDecisionProjectionOperationalState({
        recovering: false,
        ownerReadiness: 'unavailable',
        continuity: null,
      }),
    ).toBe('Unavailable');
    expect(W5_N27_D_ARCHITECTURE_CLAIMS.neverHardcodesReady).toBe(true);
    expect(W5_N27_D_ARCHITECTURE_CLAIMS.canFabricateReadiness).toBe(false);
  });

  it('integrity failure → Degraded; recovery failure → Unavailable; healthy recovery → Ready', () => {
    recordNotificationPlatformRetrySchedulingDecisionProjectionRecoveryStart();
    recordNotificationPlatformRetrySchedulingDecisionProjectionRecoverySuccess({
      diagnostics: buildNotificationPlatformRetrySchedulingDecisionProjectionRecoveryDiagnostics([
        canonicalAnchor('ws-1', 'projection-anchor-1'),
      ]),
    });
    recordNotificationPlatformRetrySchedulingDecisionProjectionIntegrityFailure(
      'integrity-check-failed',
    );
    expect(
      evaluateNotificationPlatformRetrySchedulingDecisionProjectionOperationalState({
        recovering: false,
        ownerReadiness: 'ready',
        continuity: getNotificationPlatformRetrySchedulingDecisionProjectionContinuityRecord(),
      }),
    ).toBe('Degraded');

    recordNotificationPlatformRetrySchedulingDecisionProjectionRecoveryFailure({
      reason: 'corrupt',
    });
    expect(
      evaluateNotificationPlatformRetrySchedulingDecisionProjectionOperationalState({
        recovering: false,
        ownerReadiness: 'ready',
        continuity: getNotificationPlatformRetrySchedulingDecisionProjectionContinuityRecord(),
      }),
    ).toBe('Unavailable');

    resetNotificationPlatformRetrySchedulingDecisionProjectionContinuity();
    recordNotificationPlatformRetrySchedulingDecisionProjectionRecoveryStart();
    recordNotificationPlatformRetrySchedulingDecisionProjectionRecoverySuccess({
      diagnostics: buildNotificationPlatformRetrySchedulingDecisionProjectionRecoveryDiagnostics(
        [],
      ),
    });
    expect(
      evaluateNotificationPlatformRetrySchedulingDecisionProjectionOperationalState({
        recovering: false,
        ownerReadiness: 'ready',
        continuity: getNotificationPlatformRetrySchedulingDecisionProjectionContinuityRecord(),
      }),
    ).toBe('Ready');
  });

  it('Degraded never fabricates Ready', () => {
    recordNotificationPlatformRetrySchedulingDecisionProjectionRecoveryStart();
    recordNotificationPlatformRetrySchedulingDecisionProjectionRecoverySuccess({
      diagnostics: buildNotificationPlatformRetrySchedulingDecisionProjectionRecoveryDiagnostics([
        canonicalAnchor('ws-1', 'projection-anchor-1'),
      ]),
    });
    recordNotificationPlatformRetrySchedulingDecisionProjectionIntegrityFailure(
      'integrity-check-failed',
    );
    const projection =
      buildNotificationPlatformRetrySchedulingDecisionProjectionContinuityProjection({
        recovering: false,
        ownerReadiness: 'ready',
        continuity: getNotificationPlatformRetrySchedulingDecisionProjectionContinuityRecord(),
      });
    expect(projection.operationalState).toBe('Degraded');
    expect(projection.operationalState).not.toBe('Ready');
  });
});

describe('W5-N27-d notification platform retry scheduling decision projection operational continuity — integration', () => {
  beforeEach(() => {
    resetNotificationPlatformRetrySchedulingDecisionProjectionContinuity();
  });

  it('ownership remains notification-delivery only', () => {
    expect(W5_N27_D_NOTIFICATION_OWNER).toBe('notification-delivery');
  });

  it('platform projection includes decision continuity view', () => {
    recordNotificationPlatformRetrySchedulingDecisionProjectionRecoveryStart();
    recordNotificationPlatformRetrySchedulingDecisionProjectionRecoverySuccess({
      diagnostics: buildNotificationPlatformRetrySchedulingDecisionProjectionRecoveryDiagnostics([
        canonicalAnchor('ws-1', 'projection-anchor-1'),
      ]),
    });
    const notificationPlatformRetrySchedulingDecisionProjection =
      buildNotificationPlatformRetrySchedulingDecisionProjectionContinuityProjection({
        recovering: false,
        ownerReadiness: 'ready',
        continuity: getNotificationPlatformRetrySchedulingDecisionProjectionContinuityRecord(),
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
      recoveryTimestamp: recordedAt,
      recoveryDurationMs: 10,
      notificationPlatformRetrySchedulingDecisionProjection,
    });
    expect(projection.notificationPlatformRetrySchedulingDecisionProjection?.operationalState).toBe(
      'Ready',
    );
    expect(
      projection.notificationPlatformRetrySchedulingDecisionProjection?.canonicalAnchorCount,
    ).toBe(1);
  });

  it('healthy platform components continue while decision continuity is Unavailable', () => {
    expect(
      notificationPlatformRetrySchedulingDecisionProjectionContinuesWhileOthersDegraded({
        notificationPlatformRetrySchedulingDecisionProjectionState: 'Unavailable',
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
    expect(transitionSafetyAnswers().reusesW5N27bPersistence).toBe(true);
    expect(transitionSafetyAnswers().reusesW5N27cRecovery).toBe(true);
    expect(transitionSafetyAnswers().degradedNeverFabricatesReady).toBe(true);
  });

  it('architecture claims: no runtime decision, scheduling, or functional claims', () => {
    expect(W5_N27_D_ARCHITECTURE_CLAIMS.runtimeDecisionProjectionImplemented).toBe(false);
    expect(W5_N27_D_ARCHITECTURE_CLAIMS.schedulingDecisionsImplemented).toBe(false);
    expect(W5_N27_D_ARCHITECTURE_CLAIMS.runtimeSchedulingImplemented).toBe(false);
    expect(W5_N27_D_ARCHITECTURE_CLAIMS.backoffCalculationImplemented).toBe(false);
    expect(W5_N27_D_ARCHITECTURE_CLAIMS.eligibilityDeterminationImplemented).toBe(false);
    expect(W5_N27_D_ARCHITECTURE_CLAIMS.executionImplemented).toBe(false);
    expect(W5_N27_D_ARCHITECTURE_CLAIMS.projectionFunctionalClaimed).toBe(false);
    expect(W5_N27_D_ARCHITECTURE_CLAIMS.operationalContinuityDerived).toBe(true);
    expect(W5_N27_D_ARCHITECTURE_CLAIMS.customerVisibleFeature).toBe(true);
    expect(W5_N27_D_ARCHITECTURE_CLAIMS.w5N27CompleteClaimed).toBe(false);
    expect(W5_N27_D_ARCHITECTURE_CLAIMS.newPersistenceOwner).toBe(false);
    expect(W5_N27_D_ARCHITECTURE_CLAIMS.runtimeDecisionEngineIntroduced).toBe(false);
  });

  it('technical debt delta: operational continuity resolved; package Close deferred to slice e', () => {
    expect(W5_N27_D_TECHNICAL_DEBT_DELTA.resolved).toContain(
      'Notification Retry Scheduling Decision Projection Operational Continuity Foundation',
    );
    expect(W5_N27_D_TECHNICAL_DEBT_DELTA.introduced).toEqual([]);
    expect(W5_N27_D_TECHNICAL_DEBT_DELTA.deferred).toEqual([
      'W5-N27-e — Package Validation, Operational Verification & Close Evidence',
    ]);
  });

  it('explicit OUT covers W5-N27-e and decision runtime', () => {
    expect(W5_N27_D_EXPLICIT_OUT).toEqual(
      expect.arrayContaining(['w5-n27-e', 'runtime-decision-logic', 'runtime-scheduling']),
    );
  });

  it('transition matrix: recovery + continuity; package Close still missing', () => {
    expect(W5_N27_D_TRANSITION_MATRIX.before).toContain('Restart recovery (W5-N27-c)');
    expect(W5_N27_D_TRANSITION_MATRIX.after).toContain('Operational continuity (W5-N27-d)');
    expect(
      W5_N27_D_TRANSITION_MATRIX.stillMissing.some((item) => item.includes('Package Close')),
    ).toBe(true);
  });

  it('required reports and continuity files exist', () => {
    const wave5 = join(REPO_ROOT, 'docs/project/version-3/wave-5');
    for (const name of [
      'w5-n27-d-implementation-report.md',
      'w5-n27-d-architecture-review.md',
      'w5-n27-d-security-review.md',
      'w5-n27-d-product-review.md',
      'w5-n27-d-validation-report.md',
    ]) {
      expect(existsSync(join(wave5, name))).toBe(true);
    }
    expect(
      existsSync(
        join(
          REPO_ROOT,
          'apps/api/src/modules/notification-delivery/domain/notification-platform-retry-scheduling-decision-projection-operational-continuity.ts',
        ),
      ),
    ).toBe(true);
  });

  it('slice id is W5-N27-d', () => {
    expect(W5_N27_D_SLICE_ID).toBe('W5-N27-d');
  });
});
