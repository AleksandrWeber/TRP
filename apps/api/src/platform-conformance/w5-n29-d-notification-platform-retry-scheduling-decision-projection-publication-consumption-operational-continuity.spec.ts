import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { buildNotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionAnchorState } from '../modules/notification-delivery/domain/durable-notification-platform-retry-scheduling-decision-projection-publication-consumption-anchor';
import {
  getNotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionContinuityRecord,
  recordNotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionIntegrityFailure,
  recordNotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionRecoveryFailure,
  recordNotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionRecoveryStart,
  recordNotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionRecoverySuccess,
  resetNotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionContinuity,
} from '../modules/notification-delivery/domain/notification-platform-retry-scheduling-decision-projection-publication-consumption-continuity-status';
import {
  buildNotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionContinuityProjection,
  evaluateNotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionOperationalState,
  notificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionContinuesWhileOthersDegraded,
} from '../modules/notification-delivery/domain/notification-platform-retry-scheduling-decision-projection-publication-consumption-operational-continuity';
import { buildNotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionRecoveryDiagnostics } from '../modules/notification-delivery/domain/notification-platform-retry-scheduling-decision-projection-publication-consumption-restart-recovery';
import {
  buildPlatformOperationalProjection,
  healthyOwnersContinueWhileOthersUnavailable,
  OPERATIONAL_STATES,
} from '../modules/operational-continuity/operational-readiness';
import {
  transitionSafetyAnswers,
  W5_N29_D_ARCHITECTURE_CLAIMS,
  W5_N29_D_EXPLICIT_OUT,
  W5_N29_D_NOTIFICATION_OWNER,
  W5_N29_D_SLICE_ID,
  W5_N29_D_SUPPORTED_STATES,
  W5_N29_D_TECHNICAL_DEBT_DELTA,
  W5_N29_D_TRANSITION_MATRIX,
} from './w5-n29-d-notification-platform-retry-scheduling-decision-projection-publication-consumption-operational-continuity';

const REPO_ROOT = join(__dirname, '../../../..');
const recordedAt = '2026-09-14T23:20:00.000Z';

function canonicalAnchor(workspaceId: string, consumptionAnchorId: string) {
  const outcome =
    buildNotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionAnchorState({
      workspaceId,
      consumptionAnchorId,
      platformRetrySchedulingDecisionProjectionPublicationConsumptionType:
        'decision-projection-publication-consumption-description-foundation',
      correlationId: 'corr-1',
      actorId: 'actor-1',
      recordedAt,
      prior: null,
    });
  if (!outcome.ok) throw new Error('expected canonical consumption anchor');
  return outcome.anchor;
}

describe('W5-N29-d notification platform retry scheduling decision projection publication operational continuity — unit', () => {
  beforeEach(() => {
    resetNotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionContinuity();
  });

  it('operational state derivation: Recovering / Ready / Degraded / Unavailable only', () => {
    expect(W5_N29_D_SUPPORTED_STATES).toEqual([...OPERATIONAL_STATES]);
    expect(
      evaluateNotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionOperationalState(
        {
          recovering: true,
          ownerReadiness: 'ready',
          continuity: null,
        },
      ),
    ).toBe('Recovering');
    expect(
      evaluateNotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionOperationalState(
        {
          recovering: false,
          ownerReadiness: 'unavailable',
          continuity: null,
        },
      ),
    ).toBe('Unavailable');
    expect(W5_N29_D_ARCHITECTURE_CLAIMS.neverHardcodesReady).toBe(true);
    expect(W5_N29_D_ARCHITECTURE_CLAIMS.canFabricateReadiness).toBe(false);
  });

  it('integrity failure → Degraded; recovery failure → Unavailable; healthy recovery → Ready', () => {
    recordNotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionRecoveryStart();
    recordNotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionRecoverySuccess(
      {
        diagnostics:
          buildNotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionRecoveryDiagnostics(
            [canonicalAnchor('ws-1', 'consumption-anchor-1')],
          ),
      },
    );
    recordNotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionIntegrityFailure(
      'integrity-check-failed',
    );
    expect(
      evaluateNotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionOperationalState(
        {
          recovering: false,
          ownerReadiness: 'ready',
          continuity:
            getNotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionContinuityRecord(),
        },
      ),
    ).toBe('Degraded');

    recordNotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionRecoveryFailure(
      {
        reason: 'corrupt',
      },
    );
    expect(
      evaluateNotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionOperationalState(
        {
          recovering: false,
          ownerReadiness: 'ready',
          continuity:
            getNotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionContinuityRecord(),
        },
      ),
    ).toBe('Unavailable');

    resetNotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionContinuity();
    recordNotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionRecoveryStart();
    recordNotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionRecoverySuccess(
      {
        diagnostics:
          buildNotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionRecoveryDiagnostics(
            [],
          ),
      },
    );
    expect(
      evaluateNotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionOperationalState(
        {
          recovering: false,
          ownerReadiness: 'ready',
          continuity:
            getNotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionContinuityRecord(),
        },
      ),
    ).toBe('Ready');
  });

  it('Degraded never fabricates Ready', () => {
    recordNotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionRecoveryStart();
    recordNotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionRecoverySuccess(
      {
        diagnostics:
          buildNotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionRecoveryDiagnostics(
            [canonicalAnchor('ws-1', 'consumption-anchor-1')],
          ),
      },
    );
    recordNotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionIntegrityFailure(
      'integrity-check-failed',
    );
    const projection =
      buildNotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionContinuityProjection(
        {
          recovering: false,
          ownerReadiness: 'ready',
          continuity:
            getNotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionContinuityRecord(),
        },
      );
    expect(projection.operationalState).toBe('Degraded');
    expect(projection.operationalState).not.toBe('Ready');
  });
});

describe('W5-N29-d notification platform retry scheduling decision projection publication operational continuity — integration', () => {
  beforeEach(() => {
    resetNotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionContinuity();
  });

  it('ownership remains notification-delivery only', () => {
    expect(W5_N29_D_NOTIFICATION_OWNER).toBe('notification-delivery');
  });

  it('platform projection includes publication consumption continuity view', () => {
    recordNotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionRecoveryStart();
    recordNotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionRecoverySuccess(
      {
        diagnostics:
          buildNotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionRecoveryDiagnostics(
            [canonicalAnchor('ws-1', 'consumption-anchor-1')],
          ),
      },
    );
    const notificationPlatformRetrySchedulingDecisionProjectionPublicationConsumption =
      buildNotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionContinuityProjection(
        {
          recovering: false,
          ownerReadiness: 'ready',
          continuity:
            getNotificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionContinuityRecord(),
        },
      );
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
      notificationPlatformRetrySchedulingDecisionProjectionPublicationConsumption,
    });
    expect(
      projection.notificationPlatformRetrySchedulingDecisionProjectionPublicationConsumption
        ?.operationalState,
    ).toBe('Ready');
    expect(
      projection.notificationPlatformRetrySchedulingDecisionProjectionPublicationConsumption
        ?.canonicalAnchorCount,
    ).toBe(1);
  });

  it('healthy platform components continue while publication consumption continuity is Unavailable', () => {
    expect(
      notificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionContinuesWhileOthersDegraded(
        {
          notificationPlatformRetrySchedulingDecisionProjectionPublicationConsumptionState:
            'Unavailable',
          otherOwnerStates: ['Ready', 'Ready'],
        },
      ),
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
    expect(transitionSafetyAnswers().reusesW5N29bPersistence).toBe(true);
    expect(transitionSafetyAnswers().reusesW5N29cRecovery).toBe(true);
    expect(transitionSafetyAnswers().degradedNeverFabricatesReady).toBe(true);
  });

  it('architecture claims: no runtime consumption, projection, scheduling, or functional claims', () => {
    expect(W5_N29_D_ARCHITECTURE_CLAIMS.runtimeDecisionProjectionImplemented).toBe(false);
    expect(W5_N29_D_ARCHITECTURE_CLAIMS.runtimePublicationImplemented).toBe(false);
    expect(W5_N29_D_ARCHITECTURE_CLAIMS.schedulingDecisionsImplemented).toBe(false);
    expect(W5_N29_D_ARCHITECTURE_CLAIMS.runtimeSchedulingImplemented).toBe(false);
    expect(W5_N29_D_ARCHITECTURE_CLAIMS.backoffCalculationImplemented).toBe(false);
    expect(W5_N29_D_ARCHITECTURE_CLAIMS.eligibilityDeterminationImplemented).toBe(false);
    expect(W5_N29_D_ARCHITECTURE_CLAIMS.executionImplemented).toBe(false);
    expect(W5_N29_D_ARCHITECTURE_CLAIMS.consumptionFunctionalClaimed).toBe(false);
    expect(W5_N29_D_ARCHITECTURE_CLAIMS.operationalContinuityDerived).toBe(true);
    expect(W5_N29_D_ARCHITECTURE_CLAIMS.customerVisibleFeature).toBe(true);
    expect(W5_N29_D_ARCHITECTURE_CLAIMS.w5N29CompleteClaimed).toBe(false);
    expect(W5_N29_D_ARCHITECTURE_CLAIMS.newPersistenceOwner).toBe(false);
    expect(W5_N29_D_ARCHITECTURE_CLAIMS.runtimeDecisionEngineIntroduced).toBe(false);
  });

  it('technical debt delta: operational continuity resolved; package Close deferred to slice e', () => {
    expect(W5_N29_D_TECHNICAL_DEBT_DELTA.resolved).toContain(
      'Notification Retry Scheduling Decision Projection Publication Consumption Operational Continuity Foundation',
    );
    expect(W5_N29_D_TECHNICAL_DEBT_DELTA.introduced).toEqual([]);
    expect(W5_N29_D_TECHNICAL_DEBT_DELTA.deferred).toEqual([
      'W5-N29-e — Package Validation, Operational Verification & Close Evidence',
    ]);
  });

  it('explicit OUT covers W5-N29-e and publication runtime', () => {
    expect(W5_N29_D_EXPLICIT_OUT).toEqual(
      expect.arrayContaining(['w5-n29-e', 'runtime-decision-logic', 'runtime-scheduling']),
    );
  });

  it('transition matrix: recovery + continuity; package Close still missing', () => {
    expect(W5_N29_D_TRANSITION_MATRIX.before).toContain('Restart recovery (W5-N29-c)');
    expect(W5_N29_D_TRANSITION_MATRIX.after).toContain('Operational continuity (W5-N29-d)');
    expect(
      W5_N29_D_TRANSITION_MATRIX.stillMissing.some((item) => item.includes('Package Close')),
    ).toBe(true);
  });

  it('required reports and continuity files exist', () => {
    const wave5 = join(REPO_ROOT, 'docs/project/version-3/wave-5');
    for (const name of [
      'w5-n29-d-implementation-report.md',
      'w5-n29-d-architecture-review.md',
      'w5-n29-d-security-review.md',
      'w5-n29-d-product-review.md',
      'w5-n29-d-validation-report.md',
    ]) {
      expect(existsSync(join(wave5, name))).toBe(true);
    }
    expect(
      existsSync(
        join(
          REPO_ROOT,
          'apps/api/src/modules/notification-delivery/domain/notification-platform-retry-scheduling-decision-projection-publication-consumption-operational-continuity.ts',
        ),
      ),
    ).toBe(true);
  });

  it('slice id is W5-N29-d', () => {
    expect(W5_N29_D_SLICE_ID).toBe('W5-N29-d');
  });
});
