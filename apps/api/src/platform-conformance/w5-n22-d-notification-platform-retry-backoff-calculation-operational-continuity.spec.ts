import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { buildNotificationPlatformRetryBackoffCalculationAnchorState } from '../modules/notification-delivery/domain/durable-notification-platform-retry-backoff-calculation-anchor';
import {
  getNotificationPlatformRetryBackoffCalculationContinuityRecord,
  recordNotificationPlatformRetryBackoffCalculationIntegrityFailure,
  recordNotificationPlatformRetryBackoffCalculationRecoveryFailure,
  recordNotificationPlatformRetryBackoffCalculationRecoveryStart,
  recordNotificationPlatformRetryBackoffCalculationRecoverySuccess,
  resetNotificationPlatformRetryBackoffCalculationContinuity,
} from '../modules/notification-delivery/domain/notification-platform-retry-backoff-calculation-continuity-status';
import {
  buildNotificationPlatformRetryBackoffCalculationContinuityProjection,
  evaluateNotificationPlatformRetryBackoffCalculationOperationalState,
  notificationPlatformRetryBackoffCalculationContinuesWhileOthersDegraded,
} from '../modules/notification-delivery/domain/notification-platform-retry-backoff-calculation-operational-continuity';
import { buildNotificationPlatformRetryBackoffCalculationRecoveryDiagnostics } from '../modules/notification-delivery/domain/notification-platform-retry-backoff-calculation-restart-recovery';
import {
  buildPlatformOperationalProjection,
  healthyOwnersContinueWhileOthersUnavailable,
  OPERATIONAL_STATES,
} from '../modules/operational-continuity/operational-readiness';
import {
  transitionSafetyAnswers,
  W5_N22_D_ARCHITECTURE_CLAIMS,
  W5_N22_D_EXPLICIT_OUT,
  W5_N22_D_NOTIFICATION_OWNER,
  W5_N22_D_SLICE_ID,
  W5_N22_D_SUPPORTED_STATES,
  W5_N22_D_TECHNICAL_DEBT_DELTA,
  W5_N22_D_TRANSITION_MATRIX,
} from './w5-n22-d-notification-platform-retry-backoff-calculation-operational-continuity';

const REPO_ROOT = join(__dirname, '../../../..');
const recordedAt = '2026-09-12T22:30:00.000Z';

function canonicalAnchor(workspaceId: string, calculationAnchorId: string) {
  const outcome = buildNotificationPlatformRetryBackoffCalculationAnchorState({
    workspaceId,
    calculationAnchorId,
    platformBackoffCalculationType: 'backoff-calculation-description-foundation',
    correlationId: 'corr-1',
    actorId: 'actor-1',
    recordedAt,
    prior: null,
  });
  if (!outcome.ok) throw new Error('expected canonical calculation anchor');
  return outcome.anchor;
}

describe('W5-N22-d notification platform retry backoff calculation operational continuity — unit', () => {
  beforeEach(() => {
    resetNotificationPlatformRetryBackoffCalculationContinuity();
  });

  it('operational state derivation: Recovering / Ready / Degraded / Unavailable only', () => {
    expect(W5_N22_D_SUPPORTED_STATES).toEqual([...OPERATIONAL_STATES]);
    expect(
      evaluateNotificationPlatformRetryBackoffCalculationOperationalState({
        recovering: true,
        ownerReadiness: 'ready',
        continuity: null,
      }),
    ).toBe('Recovering');
    expect(
      evaluateNotificationPlatformRetryBackoffCalculationOperationalState({
        recovering: false,
        ownerReadiness: 'unavailable',
        continuity: null,
      }),
    ).toBe('Unavailable');
    expect(W5_N22_D_ARCHITECTURE_CLAIMS.neverHardcodesReady).toBe(true);
    expect(W5_N22_D_ARCHITECTURE_CLAIMS.canFabricateReadiness).toBe(false);
  });

  it('integrity failure → Degraded; recovery failure → Unavailable; healthy recovery → Ready', () => {
    recordNotificationPlatformRetryBackoffCalculationRecoveryStart();
    recordNotificationPlatformRetryBackoffCalculationRecoverySuccess({
      diagnostics: buildNotificationPlatformRetryBackoffCalculationRecoveryDiagnostics([
        canonicalAnchor('ws-1', 'calc-anchor-1'),
      ]),
    });
    recordNotificationPlatformRetryBackoffCalculationIntegrityFailure('integrity-check-failed');
    expect(
      evaluateNotificationPlatformRetryBackoffCalculationOperationalState({
        recovering: false,
        ownerReadiness: 'ready',
        continuity: getNotificationPlatformRetryBackoffCalculationContinuityRecord(),
      }),
    ).toBe('Degraded');

    recordNotificationPlatformRetryBackoffCalculationRecoveryFailure({ reason: 'corrupt' });
    expect(
      evaluateNotificationPlatformRetryBackoffCalculationOperationalState({
        recovering: false,
        ownerReadiness: 'ready',
        continuity: getNotificationPlatformRetryBackoffCalculationContinuityRecord(),
      }),
    ).toBe('Unavailable');

    resetNotificationPlatformRetryBackoffCalculationContinuity();
    recordNotificationPlatformRetryBackoffCalculationRecoveryStart();
    recordNotificationPlatformRetryBackoffCalculationRecoverySuccess({
      diagnostics: buildNotificationPlatformRetryBackoffCalculationRecoveryDiagnostics([]),
    });
    expect(
      evaluateNotificationPlatformRetryBackoffCalculationOperationalState({
        recovering: false,
        ownerReadiness: 'ready',
        continuity: getNotificationPlatformRetryBackoffCalculationContinuityRecord(),
      }),
    ).toBe('Ready');
  });

  it('Degraded never fabricates Ready', () => {
    recordNotificationPlatformRetryBackoffCalculationRecoveryStart();
    recordNotificationPlatformRetryBackoffCalculationRecoverySuccess({
      diagnostics: buildNotificationPlatformRetryBackoffCalculationRecoveryDiagnostics([
        canonicalAnchor('ws-1', 'calc-anchor-1'),
      ]),
    });
    recordNotificationPlatformRetryBackoffCalculationIntegrityFailure('integrity-check-failed');
    const projection = buildNotificationPlatformRetryBackoffCalculationContinuityProjection({
      recovering: false,
      ownerReadiness: 'ready',
      continuity: getNotificationPlatformRetryBackoffCalculationContinuityRecord(),
    });
    expect(projection.operationalState).toBe('Degraded');
    expect(projection.operationalState).not.toBe('Ready');
  });
});

describe('W5-N22-d notification platform retry backoff calculation operational continuity — integration', () => {
  beforeEach(() => {
    resetNotificationPlatformRetryBackoffCalculationContinuity();
  });

  it('ownership remains notification-delivery only', () => {
    expect(W5_N22_D_NOTIFICATION_OWNER).toBe('notification-delivery');
  });

  it('platform projection includes calculation continuity view', () => {
    recordNotificationPlatformRetryBackoffCalculationRecoveryStart();
    recordNotificationPlatformRetryBackoffCalculationRecoverySuccess({
      diagnostics: buildNotificationPlatformRetryBackoffCalculationRecoveryDiagnostics([
        canonicalAnchor('ws-1', 'calc-anchor-1'),
      ]),
    });
    const notificationPlatformRetryBackoffCalculation =
      buildNotificationPlatformRetryBackoffCalculationContinuityProjection({
        recovering: false,
        ownerReadiness: 'ready',
        continuity: getNotificationPlatformRetryBackoffCalculationContinuityRecord(),
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
      notificationPlatformRetryBackoffCalculation,
    });
    expect(projection.notificationPlatformRetryBackoffCalculation?.operationalState).toBe('Ready');
    expect(projection.notificationPlatformRetryBackoffCalculation?.canonicalAnchorCount).toBe(1);
  });

  it('healthy platform components continue while calculation continuity is Unavailable', () => {
    expect(
      notificationPlatformRetryBackoffCalculationContinuesWhileOthersDegraded({
        notificationPlatformRetryBackoffCalculationState: 'Unavailable',
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
    expect(transitionSafetyAnswers().reusesW5N22bPersistence).toBe(true);
    expect(transitionSafetyAnswers().reusesW5N22cRecovery).toBe(true);
    expect(transitionSafetyAnswers().degradedNeverFabricatesReady).toBe(true);
  });

  it('architecture claims: no calculation runtime or functional claims', () => {
    expect(W5_N22_D_ARCHITECTURE_CLAIMS.calculationRuntimeImplemented).toBe(false);
    expect(W5_N22_D_ARCHITECTURE_CLAIMS.backoffCalculationImplemented).toBe(false);
    expect(W5_N22_D_ARCHITECTURE_CLAIMS.schedulingImplemented).toBe(false);
    expect(W5_N22_D_ARCHITECTURE_CLAIMS.executionImplemented).toBe(false);
    expect(W5_N22_D_ARCHITECTURE_CLAIMS.backoffCalculationFunctionalClaimed).toBe(false);
    expect(W5_N22_D_ARCHITECTURE_CLAIMS.operationalContinuityDerived).toBe(true);
    expect(W5_N22_D_ARCHITECTURE_CLAIMS.customerVisibleFeature).toBe(true);
    expect(W5_N22_D_ARCHITECTURE_CLAIMS.w5N22CompleteClaimed).toBe(false);
    expect(W5_N22_D_ARCHITECTURE_CLAIMS.newPersistenceOwner).toBe(false);
    expect(W5_N22_D_ARCHITECTURE_CLAIMS.calculationEngineIntroduced).toBe(false);
  });

  it('technical debt delta: operational continuity resolved; package Close deferred to slice e', () => {
    expect(W5_N22_D_TECHNICAL_DEBT_DELTA.resolved).toContain(
      'Retry Backoff Calculation Operational Continuity Foundation',
    );
    expect(W5_N22_D_TECHNICAL_DEBT_DELTA.introduced).toEqual([]);
    expect(W5_N22_D_TECHNICAL_DEBT_DELTA.deferred).toEqual([
      'W5-N22-e — Package Validation, Operational Verification & Close Evidence',
    ]);
  });

  it('explicit OUT covers W5-N22-e and calculation runtime', () => {
    expect(W5_N22_D_EXPLICIT_OUT).toEqual(
      expect.arrayContaining(['w5-n22-e', 'calculation-runtime', 'retry-scheduling']),
    );
  });

  it('transition matrix: recovery + continuity; package Close still missing', () => {
    expect(W5_N22_D_TRANSITION_MATRIX.before).toContain('Restart recovery (W5-N22-c)');
    expect(W5_N22_D_TRANSITION_MATRIX.after).toContain('Operational continuity (W5-N22-d)');
    expect(
      W5_N22_D_TRANSITION_MATRIX.stillMissing.some((item) => item.includes('Package Close')),
    ).toBe(true);
  });

  it('required reports and continuity files exist', () => {
    const wave5 = join(REPO_ROOT, 'docs/project/version-3/wave-5');
    for (const name of [
      'w5-n22-d-implementation-report.md',
      'w5-n22-d-architecture-review.md',
      'w5-n22-d-security-review.md',
      'w5-n22-d-product-review.md',
      'w5-n22-d-validation-report.md',
    ]) {
      expect(existsSync(join(wave5, name))).toBe(true);
    }
    expect(
      existsSync(
        join(
          REPO_ROOT,
          'apps/api/src/modules/notification-delivery/domain/notification-platform-retry-backoff-calculation-operational-continuity.ts',
        ),
      ),
    ).toBe(true);
  });

  it('slice id is W5-N22-d', () => {
    expect(W5_N22_D_SLICE_ID).toBe('W5-N22-d');
  });
});
