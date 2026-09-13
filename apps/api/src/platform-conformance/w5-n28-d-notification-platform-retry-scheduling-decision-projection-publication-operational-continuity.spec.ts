import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { buildNotificationPlatformRetrySchedulingDecisionProjectionPublicationAnchorState } from '../modules/notification-delivery/domain/durable-notification-platform-retry-scheduling-decision-projection-publication-anchor';
import {
  getNotificationPlatformRetrySchedulingDecisionProjectionPublicationContinuityRecord,
  recordNotificationPlatformRetrySchedulingDecisionProjectionPublicationIntegrityFailure,
  recordNotificationPlatformRetrySchedulingDecisionProjectionPublicationRecoveryFailure,
  recordNotificationPlatformRetrySchedulingDecisionProjectionPublicationRecoveryStart,
  recordNotificationPlatformRetrySchedulingDecisionProjectionPublicationRecoverySuccess,
  resetNotificationPlatformRetrySchedulingDecisionProjectionPublicationContinuity,
} from '../modules/notification-delivery/domain/notification-platform-retry-scheduling-decision-projection-publication-continuity-status';
import {
  buildNotificationPlatformRetrySchedulingDecisionProjectionPublicationContinuityProjection,
  evaluateNotificationPlatformRetrySchedulingDecisionProjectionPublicationOperationalState,
  notificationPlatformRetrySchedulingDecisionProjectionPublicationContinuesWhileOthersDegraded,
} from '../modules/notification-delivery/domain/notification-platform-retry-scheduling-decision-projection-publication-operational-continuity';
import { buildNotificationPlatformRetrySchedulingDecisionProjectionPublicationRecoveryDiagnostics } from '../modules/notification-delivery/domain/notification-platform-retry-scheduling-decision-projection-publication-restart-recovery';
import {
  buildPlatformOperationalProjection,
  healthyOwnersContinueWhileOthersUnavailable,
  OPERATIONAL_STATES,
} from '../modules/operational-continuity/operational-readiness';
import {
  transitionSafetyAnswers,
  W5_N28_D_ARCHITECTURE_CLAIMS,
  W5_N28_D_EXPLICIT_OUT,
  W5_N28_D_NOTIFICATION_OWNER,
  W5_N28_D_SLICE_ID,
  W5_N28_D_SUPPORTED_STATES,
  W5_N28_D_TECHNICAL_DEBT_DELTA,
  W5_N28_D_TRANSITION_MATRIX,
} from './w5-n28-d-notification-platform-retry-scheduling-decision-projection-publication-operational-continuity';

const REPO_ROOT = join(__dirname, '../../../..');
const recordedAt = '2026-09-13T23:20:00.000Z';

function canonicalAnchor(workspaceId: string, publicationAnchorId: string) {
  const outcome = buildNotificationPlatformRetrySchedulingDecisionProjectionPublicationAnchorState({
    workspaceId,
    publicationAnchorId,
    platformRetrySchedulingDecisionProjectionPublicationType:
      'decision-projection-publication-description-foundation',
    correlationId: 'corr-1',
    actorId: 'actor-1',
    recordedAt,
    prior: null,
  });
  if (!outcome.ok) throw new Error('expected canonical publication anchor');
  return outcome.anchor;
}

describe('W5-N28-d notification platform retry scheduling decision projection publication operational continuity — unit', () => {
  beforeEach(() => {
    resetNotificationPlatformRetrySchedulingDecisionProjectionPublicationContinuity();
  });

  it('operational state derivation: Recovering / Ready / Degraded / Unavailable only', () => {
    expect(W5_N28_D_SUPPORTED_STATES).toEqual([...OPERATIONAL_STATES]);
    expect(
      evaluateNotificationPlatformRetrySchedulingDecisionProjectionPublicationOperationalState({
        recovering: true,
        ownerReadiness: 'ready',
        continuity: null,
      }),
    ).toBe('Recovering');
    expect(
      evaluateNotificationPlatformRetrySchedulingDecisionProjectionPublicationOperationalState({
        recovering: false,
        ownerReadiness: 'unavailable',
        continuity: null,
      }),
    ).toBe('Unavailable');
    expect(W5_N28_D_ARCHITECTURE_CLAIMS.neverHardcodesReady).toBe(true);
    expect(W5_N28_D_ARCHITECTURE_CLAIMS.canFabricateReadiness).toBe(false);
  });

  it('integrity failure → Degraded; recovery failure → Unavailable; healthy recovery → Ready', () => {
    recordNotificationPlatformRetrySchedulingDecisionProjectionPublicationRecoveryStart();
    recordNotificationPlatformRetrySchedulingDecisionProjectionPublicationRecoverySuccess({
      diagnostics:
        buildNotificationPlatformRetrySchedulingDecisionProjectionPublicationRecoveryDiagnostics([
          canonicalAnchor('ws-1', 'publication-anchor-1'),
        ]),
    });
    recordNotificationPlatformRetrySchedulingDecisionProjectionPublicationIntegrityFailure(
      'integrity-check-failed',
    );
    expect(
      evaluateNotificationPlatformRetrySchedulingDecisionProjectionPublicationOperationalState({
        recovering: false,
        ownerReadiness: 'ready',
        continuity:
          getNotificationPlatformRetrySchedulingDecisionProjectionPublicationContinuityRecord(),
      }),
    ).toBe('Degraded');

    recordNotificationPlatformRetrySchedulingDecisionProjectionPublicationRecoveryFailure({
      reason: 'corrupt',
    });
    expect(
      evaluateNotificationPlatformRetrySchedulingDecisionProjectionPublicationOperationalState({
        recovering: false,
        ownerReadiness: 'ready',
        continuity:
          getNotificationPlatformRetrySchedulingDecisionProjectionPublicationContinuityRecord(),
      }),
    ).toBe('Unavailable');

    resetNotificationPlatformRetrySchedulingDecisionProjectionPublicationContinuity();
    recordNotificationPlatformRetrySchedulingDecisionProjectionPublicationRecoveryStart();
    recordNotificationPlatformRetrySchedulingDecisionProjectionPublicationRecoverySuccess({
      diagnostics:
        buildNotificationPlatformRetrySchedulingDecisionProjectionPublicationRecoveryDiagnostics(
          [],
        ),
    });
    expect(
      evaluateNotificationPlatformRetrySchedulingDecisionProjectionPublicationOperationalState({
        recovering: false,
        ownerReadiness: 'ready',
        continuity:
          getNotificationPlatformRetrySchedulingDecisionProjectionPublicationContinuityRecord(),
      }),
    ).toBe('Ready');
  });

  it('Degraded never fabricates Ready', () => {
    recordNotificationPlatformRetrySchedulingDecisionProjectionPublicationRecoveryStart();
    recordNotificationPlatformRetrySchedulingDecisionProjectionPublicationRecoverySuccess({
      diagnostics:
        buildNotificationPlatformRetrySchedulingDecisionProjectionPublicationRecoveryDiagnostics([
          canonicalAnchor('ws-1', 'publication-anchor-1'),
        ]),
    });
    recordNotificationPlatformRetrySchedulingDecisionProjectionPublicationIntegrityFailure(
      'integrity-check-failed',
    );
    const projection =
      buildNotificationPlatformRetrySchedulingDecisionProjectionPublicationContinuityProjection({
        recovering: false,
        ownerReadiness: 'ready',
        continuity:
          getNotificationPlatformRetrySchedulingDecisionProjectionPublicationContinuityRecord(),
      });
    expect(projection.operationalState).toBe('Degraded');
    expect(projection.operationalState).not.toBe('Ready');
  });
});

describe('W5-N28-d notification platform retry scheduling decision projection publication operational continuity — integration', () => {
  beforeEach(() => {
    resetNotificationPlatformRetrySchedulingDecisionProjectionPublicationContinuity();
  });

  it('ownership remains notification-delivery only', () => {
    expect(W5_N28_D_NOTIFICATION_OWNER).toBe('notification-delivery');
  });

  it('platform projection includes publication continuity view', () => {
    recordNotificationPlatformRetrySchedulingDecisionProjectionPublicationRecoveryStart();
    recordNotificationPlatformRetrySchedulingDecisionProjectionPublicationRecoverySuccess({
      diagnostics:
        buildNotificationPlatformRetrySchedulingDecisionProjectionPublicationRecoveryDiagnostics([
          canonicalAnchor('ws-1', 'publication-anchor-1'),
        ]),
    });
    const notificationPlatformRetrySchedulingDecisionProjectionPublication =
      buildNotificationPlatformRetrySchedulingDecisionProjectionPublicationContinuityProjection({
        recovering: false,
        ownerReadiness: 'ready',
        continuity:
          getNotificationPlatformRetrySchedulingDecisionProjectionPublicationContinuityRecord(),
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
      notificationPlatformRetrySchedulingDecisionProjectionPublication,
    });
    expect(
      projection.notificationPlatformRetrySchedulingDecisionProjectionPublication?.operationalState,
    ).toBe('Ready');
    expect(
      projection.notificationPlatformRetrySchedulingDecisionProjectionPublication
        ?.canonicalAnchorCount,
    ).toBe(1);
  });

  it('healthy platform components continue while publication continuity is Unavailable', () => {
    expect(
      notificationPlatformRetrySchedulingDecisionProjectionPublicationContinuesWhileOthersDegraded({
        notificationPlatformRetrySchedulingDecisionProjectionPublicationState: 'Unavailable',
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
    expect(transitionSafetyAnswers().reusesW5N28bPersistence).toBe(true);
    expect(transitionSafetyAnswers().reusesW5N28cRecovery).toBe(true);
    expect(transitionSafetyAnswers().degradedNeverFabricatesReady).toBe(true);
  });

  it('architecture claims: no runtime publication, projection, scheduling, or functional claims', () => {
    expect(W5_N28_D_ARCHITECTURE_CLAIMS.runtimeDecisionProjectionImplemented).toBe(false);
    expect(W5_N28_D_ARCHITECTURE_CLAIMS.runtimePublicationImplemented).toBe(false);
    expect(W5_N28_D_ARCHITECTURE_CLAIMS.schedulingDecisionsImplemented).toBe(false);
    expect(W5_N28_D_ARCHITECTURE_CLAIMS.runtimeSchedulingImplemented).toBe(false);
    expect(W5_N28_D_ARCHITECTURE_CLAIMS.backoffCalculationImplemented).toBe(false);
    expect(W5_N28_D_ARCHITECTURE_CLAIMS.eligibilityDeterminationImplemented).toBe(false);
    expect(W5_N28_D_ARCHITECTURE_CLAIMS.executionImplemented).toBe(false);
    expect(W5_N28_D_ARCHITECTURE_CLAIMS.publicationFunctionalClaimed).toBe(false);
    expect(W5_N28_D_ARCHITECTURE_CLAIMS.operationalContinuityDerived).toBe(true);
    expect(W5_N28_D_ARCHITECTURE_CLAIMS.customerVisibleFeature).toBe(true);
    expect(W5_N28_D_ARCHITECTURE_CLAIMS.w5N28CompleteClaimed).toBe(false);
    expect(W5_N28_D_ARCHITECTURE_CLAIMS.newPersistenceOwner).toBe(false);
    expect(W5_N28_D_ARCHITECTURE_CLAIMS.runtimeDecisionEngineIntroduced).toBe(false);
  });

  it('technical debt delta: operational continuity resolved; package Close deferred to slice e', () => {
    expect(W5_N28_D_TECHNICAL_DEBT_DELTA.resolved).toContain(
      'Notification Retry Scheduling Decision Projection Publication Operational Continuity Foundation',
    );
    expect(W5_N28_D_TECHNICAL_DEBT_DELTA.introduced).toEqual([]);
    expect(W5_N28_D_TECHNICAL_DEBT_DELTA.deferred).toEqual([
      'W5-N28-e — Package Validation, Operational Verification & Close Evidence',
    ]);
  });

  it('explicit OUT covers W5-N28-e and publication runtime', () => {
    expect(W5_N28_D_EXPLICIT_OUT).toEqual(
      expect.arrayContaining(['w5-n28-e', 'runtime-decision-logic', 'runtime-scheduling']),
    );
  });

  it('transition matrix: recovery + continuity; package Close still missing', () => {
    expect(W5_N28_D_TRANSITION_MATRIX.before).toContain('Restart recovery (W5-N28-c)');
    expect(W5_N28_D_TRANSITION_MATRIX.after).toContain('Operational continuity (W5-N28-d)');
    expect(
      W5_N28_D_TRANSITION_MATRIX.stillMissing.some((item) => item.includes('Package Close')),
    ).toBe(true);
  });

  it('required reports and continuity files exist', () => {
    const wave5 = join(REPO_ROOT, 'docs/project/version-3/wave-5');
    for (const name of [
      'w5-n28-d-implementation-report.md',
      'w5-n28-d-architecture-review.md',
      'w5-n28-d-security-review.md',
      'w5-n28-d-product-review.md',
      'w5-n28-d-validation-report.md',
    ]) {
      expect(existsSync(join(wave5, name))).toBe(true);
    }
    expect(
      existsSync(
        join(
          REPO_ROOT,
          'apps/api/src/modules/notification-delivery/domain/notification-platform-retry-scheduling-decision-projection-publication-operational-continuity.ts',
        ),
      ),
    ).toBe(true);
  });

  it('slice id is W5-N28-d', () => {
    expect(W5_N28_D_SLICE_ID).toBe('W5-N28-d');
  });
});
