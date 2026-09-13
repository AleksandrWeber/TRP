import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { buildNotificationPlatformRetrySchedulingDecisionEvaluationAnchorState } from '../modules/notification-delivery/domain/durable-notification-platform-retry-scheduling-decision-evaluation-anchor';
import {
  getNotificationPlatformRetrySchedulingDecisionEvaluationContinuityRecord,
  recordNotificationPlatformRetrySchedulingDecisionEvaluationIntegrityFailure,
  recordNotificationPlatformRetrySchedulingDecisionEvaluationRecoveryFailure,
  recordNotificationPlatformRetrySchedulingDecisionEvaluationRecoveryStart,
  recordNotificationPlatformRetrySchedulingDecisionEvaluationRecoverySuccess,
  resetNotificationPlatformRetrySchedulingDecisionEvaluationContinuity,
} from '../modules/notification-delivery/domain/notification-platform-retry-scheduling-decision-evaluation-continuity-status';
import {
  buildNotificationPlatformRetrySchedulingDecisionEvaluationContinuityProjection,
  evaluateNotificationPlatformRetrySchedulingDecisionEvaluationOperationalState,
  notificationPlatformRetrySchedulingDecisionEvaluationContinuesWhileOthersDegraded,
} from '../modules/notification-delivery/domain/notification-platform-retry-scheduling-decision-evaluation-operational-continuity';
import { buildNotificationPlatformRetrySchedulingDecisionEvaluationRecoveryDiagnostics } from '../modules/notification-delivery/domain/notification-platform-retry-scheduling-decision-evaluation-restart-recovery';
import {
  buildPlatformOperationalProjection,
  healthyOwnersContinueWhileOthersUnavailable,
  OPERATIONAL_STATES,
} from '../modules/operational-continuity/operational-readiness';
import {
  transitionSafetyAnswers,
  W5_N26_D_ARCHITECTURE_CLAIMS,
  W5_N26_D_EXPLICIT_OUT,
  W5_N26_D_NOTIFICATION_OWNER,
  W5_N26_D_SLICE_ID,
  W5_N26_D_SUPPORTED_STATES,
  W5_N26_D_TECHNICAL_DEBT_DELTA,
  W5_N26_D_TRANSITION_MATRIX,
} from './w5-n26-d-notification-platform-retry-scheduling-decision-evaluation-operational-continuity';

const REPO_ROOT = join(__dirname, '../../../..');
const recordedAt = '2026-09-13T22:40:00.000Z';

function canonicalAnchor(workspaceId: string, evaluationAnchorId: string) {
  const outcome = buildNotificationPlatformRetrySchedulingDecisionEvaluationAnchorState({
    workspaceId,
    evaluationAnchorId,
    platformRetrySchedulingDecisionEvaluationType: 'decision-evaluation-description-foundation',
    correlationId: 'corr-1',
    actorId: 'actor-1',
    recordedAt,
    prior: null,
  });
  if (!outcome.ok) throw new Error('expected canonical decision anchor');
  return outcome.anchor;
}

describe('W5-N26-d notification platform retry scheduling decision evaluation operational continuity — unit', () => {
  beforeEach(() => {
    resetNotificationPlatformRetrySchedulingDecisionEvaluationContinuity();
  });

  it('operational state derivation: Recovering / Ready / Degraded / Unavailable only', () => {
    expect(W5_N26_D_SUPPORTED_STATES).toEqual([...OPERATIONAL_STATES]);
    expect(
      evaluateNotificationPlatformRetrySchedulingDecisionEvaluationOperationalState({
        recovering: true,
        ownerReadiness: 'ready',
        continuity: null,
      }),
    ).toBe('Recovering');
    expect(
      evaluateNotificationPlatformRetrySchedulingDecisionEvaluationOperationalState({
        recovering: false,
        ownerReadiness: 'unavailable',
        continuity: null,
      }),
    ).toBe('Unavailable');
    expect(W5_N26_D_ARCHITECTURE_CLAIMS.neverHardcodesReady).toBe(true);
    expect(W5_N26_D_ARCHITECTURE_CLAIMS.canFabricateReadiness).toBe(false);
  });

  it('integrity failure → Degraded; recovery failure → Unavailable; healthy recovery → Ready', () => {
    recordNotificationPlatformRetrySchedulingDecisionEvaluationRecoveryStart();
    recordNotificationPlatformRetrySchedulingDecisionEvaluationRecoverySuccess({
      diagnostics: buildNotificationPlatformRetrySchedulingDecisionEvaluationRecoveryDiagnostics([
        canonicalAnchor('ws-1', 'evaluation-anchor-1'),
      ]),
    });
    recordNotificationPlatformRetrySchedulingDecisionEvaluationIntegrityFailure(
      'integrity-check-failed',
    );
    expect(
      evaluateNotificationPlatformRetrySchedulingDecisionEvaluationOperationalState({
        recovering: false,
        ownerReadiness: 'ready',
        continuity: getNotificationPlatformRetrySchedulingDecisionEvaluationContinuityRecord(),
      }),
    ).toBe('Degraded');

    recordNotificationPlatformRetrySchedulingDecisionEvaluationRecoveryFailure({
      reason: 'corrupt',
    });
    expect(
      evaluateNotificationPlatformRetrySchedulingDecisionEvaluationOperationalState({
        recovering: false,
        ownerReadiness: 'ready',
        continuity: getNotificationPlatformRetrySchedulingDecisionEvaluationContinuityRecord(),
      }),
    ).toBe('Unavailable');

    resetNotificationPlatformRetrySchedulingDecisionEvaluationContinuity();
    recordNotificationPlatformRetrySchedulingDecisionEvaluationRecoveryStart();
    recordNotificationPlatformRetrySchedulingDecisionEvaluationRecoverySuccess({
      diagnostics: buildNotificationPlatformRetrySchedulingDecisionEvaluationRecoveryDiagnostics(
        [],
      ),
    });
    expect(
      evaluateNotificationPlatformRetrySchedulingDecisionEvaluationOperationalState({
        recovering: false,
        ownerReadiness: 'ready',
        continuity: getNotificationPlatformRetrySchedulingDecisionEvaluationContinuityRecord(),
      }),
    ).toBe('Ready');
  });

  it('Degraded never fabricates Ready', () => {
    recordNotificationPlatformRetrySchedulingDecisionEvaluationRecoveryStart();
    recordNotificationPlatformRetrySchedulingDecisionEvaluationRecoverySuccess({
      diagnostics: buildNotificationPlatformRetrySchedulingDecisionEvaluationRecoveryDiagnostics([
        canonicalAnchor('ws-1', 'evaluation-anchor-1'),
      ]),
    });
    recordNotificationPlatformRetrySchedulingDecisionEvaluationIntegrityFailure(
      'integrity-check-failed',
    );
    const projection =
      buildNotificationPlatformRetrySchedulingDecisionEvaluationContinuityProjection({
        recovering: false,
        ownerReadiness: 'ready',
        continuity: getNotificationPlatformRetrySchedulingDecisionEvaluationContinuityRecord(),
      });
    expect(projection.operationalState).toBe('Degraded');
    expect(projection.operationalState).not.toBe('Ready');
  });
});

describe('W5-N26-d notification platform retry scheduling decision evaluation operational continuity — integration', () => {
  beforeEach(() => {
    resetNotificationPlatformRetrySchedulingDecisionEvaluationContinuity();
  });

  it('ownership remains notification-delivery only', () => {
    expect(W5_N26_D_NOTIFICATION_OWNER).toBe('notification-delivery');
  });

  it('platform projection includes decision continuity view', () => {
    recordNotificationPlatformRetrySchedulingDecisionEvaluationRecoveryStart();
    recordNotificationPlatformRetrySchedulingDecisionEvaluationRecoverySuccess({
      diagnostics: buildNotificationPlatformRetrySchedulingDecisionEvaluationRecoveryDiagnostics([
        canonicalAnchor('ws-1', 'evaluation-anchor-1'),
      ]),
    });
    const notificationPlatformRetrySchedulingDecisionEvaluation =
      buildNotificationPlatformRetrySchedulingDecisionEvaluationContinuityProjection({
        recovering: false,
        ownerReadiness: 'ready',
        continuity: getNotificationPlatformRetrySchedulingDecisionEvaluationContinuityRecord(),
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
      notificationPlatformRetrySchedulingDecisionEvaluation,
    });
    expect(projection.notificationPlatformRetrySchedulingDecisionEvaluation?.operationalState).toBe(
      'Ready',
    );
    expect(
      projection.notificationPlatformRetrySchedulingDecisionEvaluation?.canonicalAnchorCount,
    ).toBe(1);
  });

  it('healthy platform components continue while decision continuity is Unavailable', () => {
    expect(
      notificationPlatformRetrySchedulingDecisionEvaluationContinuesWhileOthersDegraded({
        notificationPlatformRetrySchedulingDecisionEvaluationState: 'Unavailable',
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
    expect(transitionSafetyAnswers().reusesW5N26bPersistence).toBe(true);
    expect(transitionSafetyAnswers().reusesW5N26cRecovery).toBe(true);
    expect(transitionSafetyAnswers().degradedNeverFabricatesReady).toBe(true);
  });

  it('architecture claims: no runtime decision, scheduling, or functional claims', () => {
    expect(W5_N26_D_ARCHITECTURE_CLAIMS.runtimeDecisionEvaluationImplemented).toBe(false);
    expect(W5_N26_D_ARCHITECTURE_CLAIMS.schedulingDecisionsImplemented).toBe(false);
    expect(W5_N26_D_ARCHITECTURE_CLAIMS.runtimeSchedulingImplemented).toBe(false);
    expect(W5_N26_D_ARCHITECTURE_CLAIMS.backoffCalculationImplemented).toBe(false);
    expect(W5_N26_D_ARCHITECTURE_CLAIMS.eligibilityDeterminationImplemented).toBe(false);
    expect(W5_N26_D_ARCHITECTURE_CLAIMS.executionImplemented).toBe(false);
    expect(W5_N26_D_ARCHITECTURE_CLAIMS.evaluationFunctionalClaimed).toBe(false);
    expect(W5_N26_D_ARCHITECTURE_CLAIMS.operationalContinuityDerived).toBe(true);
    expect(W5_N26_D_ARCHITECTURE_CLAIMS.customerVisibleFeature).toBe(true);
    expect(W5_N26_D_ARCHITECTURE_CLAIMS.w5N26CompleteClaimed).toBe(false);
    expect(W5_N26_D_ARCHITECTURE_CLAIMS.newPersistenceOwner).toBe(false);
    expect(W5_N26_D_ARCHITECTURE_CLAIMS.runtimeDecisionEngineIntroduced).toBe(false);
  });

  it('technical debt delta: operational continuity resolved; package Close deferred to slice e', () => {
    expect(W5_N26_D_TECHNICAL_DEBT_DELTA.resolved).toContain(
      'Notification Retry Scheduling Decision Evaluation Operational Continuity Foundation',
    );
    expect(W5_N26_D_TECHNICAL_DEBT_DELTA.introduced).toEqual([]);
    expect(W5_N26_D_TECHNICAL_DEBT_DELTA.deferred).toEqual([
      'W5-N26-e — Package Validation, Operational Verification & Close Evidence',
    ]);
  });

  it('explicit OUT covers W5-N26-e and decision runtime', () => {
    expect(W5_N26_D_EXPLICIT_OUT).toEqual(
      expect.arrayContaining(['w5-n26-e', 'runtime-decision-logic', 'runtime-scheduling']),
    );
  });

  it('transition matrix: recovery + continuity; package Close still missing', () => {
    expect(W5_N26_D_TRANSITION_MATRIX.before).toContain('Restart recovery (W5-N26-c)');
    expect(W5_N26_D_TRANSITION_MATRIX.after).toContain('Operational continuity (W5-N26-d)');
    expect(
      W5_N26_D_TRANSITION_MATRIX.stillMissing.some((item) => item.includes('Package Close')),
    ).toBe(true);
  });

  it('required reports and continuity files exist', () => {
    const wave5 = join(REPO_ROOT, 'docs/project/version-3/wave-5');
    for (const name of [
      'w5-n26-d-implementation-report.md',
      'w5-n26-d-architecture-review.md',
      'w5-n26-d-security-review.md',
      'w5-n26-d-product-review.md',
      'w5-n26-d-validation-report.md',
    ]) {
      expect(existsSync(join(wave5, name))).toBe(true);
    }
    expect(
      existsSync(
        join(
          REPO_ROOT,
          'apps/api/src/modules/notification-delivery/domain/notification-platform-retry-scheduling-decision-evaluation-operational-continuity.ts',
        ),
      ),
    ).toBe(true);
  });

  it('slice id is W5-N26-d', () => {
    expect(W5_N26_D_SLICE_ID).toBe('W5-N26-d');
  });
});
