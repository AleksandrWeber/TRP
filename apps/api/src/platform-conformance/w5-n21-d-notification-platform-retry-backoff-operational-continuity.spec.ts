import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { buildNotificationPlatformRetryBackoffAnchorState } from '../modules/notification-delivery/domain/durable-notification-platform-retry-backoff-anchor';
import {
  getNotificationPlatformRetryBackoffContinuityRecord,
  recordNotificationPlatformRetryBackoffIntegrityFailure,
  recordNotificationPlatformRetryBackoffRecoveryFailure,
  recordNotificationPlatformRetryBackoffRecoveryStart,
  recordNotificationPlatformRetryBackoffRecoverySuccess,
  resetNotificationPlatformRetryBackoffContinuity,
} from '../modules/notification-delivery/domain/notification-platform-retry-backoff-continuity-status';
import {
  buildNotificationPlatformRetryBackoffContinuityProjection,
  evaluateNotificationPlatformRetryBackoffOperationalState,
  notificationPlatformRetryBackoffContinuesWhileOthersDegraded,
} from '../modules/notification-delivery/domain/notification-platform-retry-backoff-operational-continuity';
import { buildNotificationPlatformRetryBackoffRecoveryDiagnostics } from '../modules/notification-delivery/domain/notification-platform-retry-backoff-restart-recovery';
import {
  buildPlatformOperationalProjection,
  healthyOwnersContinueWhileOthersUnavailable,
  OPERATIONAL_STATES,
} from '../modules/operational-continuity/operational-readiness';
import {
  transitionSafetyAnswers,
  W5_N21_D_ARCHITECTURE_CLAIMS,
  W5_N21_D_EXPLICIT_OUT,
  W5_N21_D_NOTIFICATION_OWNER,
  W5_N21_D_SLICE_ID,
  W5_N21_D_SUPPORTED_STATES,
  W5_N21_D_TECHNICAL_DEBT_DELTA,
  W5_N21_D_TRANSITION_MATRIX,
} from './w5-n21-d-notification-platform-retry-backoff-operational-continuity';

const REPO_ROOT = join(__dirname, '../../../..');
const recordedAt = '2026-09-12T21:30:00.000Z';

function canonicalAnchor(workspaceId: string, retryBackoffAnchorId: string) {
  const outcome = buildNotificationPlatformRetryBackoffAnchorState({
    workspaceId,
    retryBackoffAnchorId,
    platformRetryBackoffType: 'backoff-description-foundation',
    correlationId: 'corr-1',
    actorId: 'actor-1',
    recordedAt,
    prior: null,
  });
  if (!outcome.ok) throw new Error('expected canonical anchor');
  return outcome.anchor;
}

describe('W5-N21-d notification platform retry backoff operational continuity — unit', () => {
  beforeEach(() => {
    resetNotificationPlatformRetryBackoffContinuity();
  });

  it('operational state derivation: Recovering / Ready / Degraded / Unavailable only', () => {
    expect(W5_N21_D_SUPPORTED_STATES).toEqual([...OPERATIONAL_STATES]);
    expect(
      evaluateNotificationPlatformRetryBackoffOperationalState({
        recovering: true,
        ownerReadiness: 'ready',
        continuity: null,
      }),
    ).toBe('Recovering');
    expect(
      evaluateNotificationPlatformRetryBackoffOperationalState({
        recovering: false,
        ownerReadiness: 'unavailable',
        continuity: null,
      }),
    ).toBe('Unavailable');
    expect(W5_N21_D_ARCHITECTURE_CLAIMS.neverHardcodesReady).toBe(true);
    expect(W5_N21_D_ARCHITECTURE_CLAIMS.canFabricateReadiness).toBe(false);
  });

  it('integrity failure → Degraded; recovery failure → Unavailable; healthy recovery → Ready', () => {
    recordNotificationPlatformRetryBackoffRecoveryStart();
    recordNotificationPlatformRetryBackoffRecoverySuccess({
      diagnostics: buildNotificationPlatformRetryBackoffRecoveryDiagnostics([
        canonicalAnchor('ws-1', 'retry-backoff-1'),
      ]),
    });
    recordNotificationPlatformRetryBackoffIntegrityFailure('integrity-check-failed');
    expect(
      evaluateNotificationPlatformRetryBackoffOperationalState({
        recovering: false,
        ownerReadiness: 'ready',
        continuity: getNotificationPlatformRetryBackoffContinuityRecord(),
      }),
    ).toBe('Degraded');

    recordNotificationPlatformRetryBackoffRecoveryFailure({ reason: 'corrupt' });
    expect(
      evaluateNotificationPlatformRetryBackoffOperationalState({
        recovering: false,
        ownerReadiness: 'ready',
        continuity: getNotificationPlatformRetryBackoffContinuityRecord(),
      }),
    ).toBe('Unavailable');

    resetNotificationPlatformRetryBackoffContinuity();
    recordNotificationPlatformRetryBackoffRecoveryStart();
    recordNotificationPlatformRetryBackoffRecoverySuccess({
      diagnostics: buildNotificationPlatformRetryBackoffRecoveryDiagnostics([]),
    });
    expect(
      evaluateNotificationPlatformRetryBackoffOperationalState({
        recovering: false,
        ownerReadiness: 'ready',
        continuity: getNotificationPlatformRetryBackoffContinuityRecord(),
      }),
    ).toBe('Ready');
  });

  it('Degraded never fabricates Ready', () => {
    recordNotificationPlatformRetryBackoffRecoveryStart();
    recordNotificationPlatformRetryBackoffRecoverySuccess({
      diagnostics: buildNotificationPlatformRetryBackoffRecoveryDiagnostics([
        canonicalAnchor('ws-1', 'retry-backoff-1'),
      ]),
    });
    recordNotificationPlatformRetryBackoffIntegrityFailure('integrity-check-failed');
    const projection = buildNotificationPlatformRetryBackoffContinuityProjection({
      recovering: false,
      ownerReadiness: 'ready',
      continuity: getNotificationPlatformRetryBackoffContinuityRecord(),
    });
    expect(projection.operationalState).toBe('Degraded');
    expect(projection.operationalState).not.toBe('Ready');
  });
});

describe('W5-N21-d notification platform retry backoff operational continuity — integration', () => {
  beforeEach(() => {
    resetNotificationPlatformRetryBackoffContinuity();
  });

  it('ownership remains notification-delivery only', () => {
    expect(W5_N21_D_NOTIFICATION_OWNER).toBe('notification-delivery');
  });

  it('platform projection includes notification platform retry backoff continuity view', () => {
    recordNotificationPlatformRetryBackoffRecoveryStart();
    recordNotificationPlatformRetryBackoffRecoverySuccess({
      diagnostics: buildNotificationPlatformRetryBackoffRecoveryDiagnostics([
        canonicalAnchor('ws-1', 'retry-backoff-1'),
      ]),
    });
    const notificationPlatformRetryBackoff =
      buildNotificationPlatformRetryBackoffContinuityProjection({
        recovering: false,
        ownerReadiness: 'ready',
        continuity: getNotificationPlatformRetryBackoffContinuityRecord(),
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
      recoveryTimestamp: '2026-09-12T21:30:00.000Z',
      recoveryDurationMs: 10,
      notificationPlatformRetryBackoff,
    });
    expect(projection.notificationPlatformRetryBackoff?.operationalState).toBe('Ready');
    expect(projection.notificationPlatformRetryBackoff?.canonicalAnchorCount).toBe(1);
  });

  it('healthy platform components continue while notification platform retry backoff is Unavailable', () => {
    expect(
      notificationPlatformRetryBackoffContinuesWhileOthersDegraded({
        notificationPlatformRetryBackoffState: 'Unavailable',
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
    expect(transitionSafetyAnswers().reusesW5N21bPersistence).toBe(true);
    expect(transitionSafetyAnswers().reusesW5N21cRecovery).toBe(true);
    expect(transitionSafetyAnswers().degradedNeverFabricatesReady).toBe(true);
  });

  it('architecture claims: no retry backoff runtime or functional claims', () => {
    expect(W5_N21_D_ARCHITECTURE_CLAIMS.backoffCalculationImplemented).toBe(false);
    expect(W5_N21_D_ARCHITECTURE_CLAIMS.retryBackoffImplemented).toBe(false);
    expect(W5_N21_D_ARCHITECTURE_CLAIMS.retryBackoffFunctionalClaimed).toBe(false);
    expect(W5_N21_D_ARCHITECTURE_CLAIMS.operationalContinuityDerived).toBe(true);
    expect(W5_N21_D_ARCHITECTURE_CLAIMS.customerVisibleFeature).toBe(true);
    expect(W5_N21_D_ARCHITECTURE_CLAIMS.w5N21CompleteClaimed).toBe(false);
    expect(W5_N21_D_ARCHITECTURE_CLAIMS.newPersistenceOwner).toBe(false);
    expect(W5_N21_D_ARCHITECTURE_CLAIMS.backoffEngineIntroduced).toBe(false);
  });

  it('technical debt delta: operational continuity resolved; package Close deferred to slice e', () => {
    expect(W5_N21_D_TECHNICAL_DEBT_DELTA.resolved).toContain(
      'Retry Backoff Operational Continuity Foundation',
    );
    expect(W5_N21_D_TECHNICAL_DEBT_DELTA.introduced).toEqual([]);
    expect(W5_N21_D_TECHNICAL_DEBT_DELTA.deferred).toEqual([
      'W5-N21-e — Package Validation, Operational Verification & Close Evidence',
    ]);
  });

  it('explicit OUT covers W5-N21-e and backoff calculation', () => {
    expect(W5_N21_D_EXPLICIT_OUT).toEqual(
      expect.arrayContaining(['w5-n21-e', 'backoff-calculation']),
    );
  });

  it('transition matrix: recovery + operational continuity; backoff calculation still missing', () => {
    expect(W5_N21_D_TRANSITION_MATRIX.before).toContain('Restart recovery (W5-N21-c)');
    expect(W5_N21_D_TRANSITION_MATRIX.after).toContain('Operational continuity (W5-N21-d)');
    expect(
      W5_N21_D_TRANSITION_MATRIX.stillMissing.some((item) => item.includes('Package Close')),
    ).toBe(true);
    expect(
      W5_N21_D_TRANSITION_MATRIX.stillMissing.some((item) =>
        item.includes('Backoff calculation runtime'),
      ),
    ).toBe(true);
  });

  it('required reports and domain files exist', () => {
    const wave5 = join(REPO_ROOT, 'docs/project/version-3/wave-5');
    for (const name of [
      'w5-n21-d-implementation-report.md',
      'w5-n21-d-architecture-review.md',
      'w5-n21-d-security-review.md',
      'w5-n21-d-product-review.md',
      'w5-n21-d-validation-report.md',
    ]) {
      expect(existsSync(join(wave5, name))).toBe(true);
    }
    expect(
      existsSync(
        join(
          REPO_ROOT,
          'apps/api/src/modules/notification-delivery/domain/notification-platform-retry-backoff-operational-continuity.ts',
        ),
      ),
    ).toBe(true);
  });

  it('slice id is W5-N21-d', () => {
    expect(W5_N21_D_SLICE_ID).toBe('W5-N21-d');
  });
});
