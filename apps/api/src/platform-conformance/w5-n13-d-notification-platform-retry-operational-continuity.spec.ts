import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { buildNotificationPlatformRetryAnchorState } from '../modules/notification-delivery/domain/durable-notification-platform-retry-anchor';
import {
  getNotificationPlatformRetryContinuityRecord,
  recordNotificationPlatformRetryIntegrityFailure,
  recordNotificationPlatformRetryRecoveryFailure,
  recordNotificationPlatformRetryRecoveryStart,
  recordNotificationPlatformRetryRecoverySuccess,
  resetNotificationPlatformRetryContinuity,
} from '../modules/notification-delivery/domain/notification-platform-retry-continuity-status';
import {
  buildNotificationPlatformRetryContinuityProjection,
  evaluateNotificationPlatformRetryOperationalState,
  notificationPlatformRetryContinuesWhileOthersDegraded,
} from '../modules/notification-delivery/domain/notification-platform-retry-operational-continuity';
import { buildNotificationPlatformRetryRecoveryDiagnostics } from '../modules/notification-delivery/domain/notification-platform-retry-restart-recovery';
import {
  buildPlatformOperationalProjection,
  healthyOwnersContinueWhileOthersUnavailable,
  OPERATIONAL_STATES,
} from '../modules/operational-continuity/operational-readiness';
import {
  transitionSafetyAnswers,
  W5_N13_D_ARCHITECTURE_CLAIMS,
  W5_N13_D_EXPLICIT_OUT,
  W5_N13_D_NOTIFICATION_OWNER,
  W5_N13_D_SLICE_ID,
  W5_N13_D_SUPPORTED_STATES,
  W5_N13_D_TECHNICAL_DEBT_DELTA,
  W5_N13_D_TRANSITION_MATRIX,
} from './w5-n13-d-notification-platform-retry-operational-continuity';

const REPO_ROOT = join(__dirname, '../../../..');
const recordedAt = '2026-09-02T16:00:00.000Z';

function canonicalAnchor(workspaceId: string, retryAnchorId: string) {
  const outcome = buildNotificationPlatformRetryAnchorState({
    workspaceId,
    retryAnchorId,
    platformRetryType: 'unified-platform-retry',
    correlationId: 'corr-1',
    actorId: 'actor-1',
    recordedAt,
    prior: null,
  });
  if (!outcome.ok) throw new Error('expected canonical anchor');
  return outcome.anchor;
}

describe('W5-N13-d notification platform retry operational continuity — unit', () => {
  beforeEach(() => {
    resetNotificationPlatformRetryContinuity();
  });

  it('operational state derivation: Recovering / Ready / Degraded / Unavailable only', () => {
    expect(W5_N13_D_SUPPORTED_STATES).toEqual([...OPERATIONAL_STATES]);
    expect(
      evaluateNotificationPlatformRetryOperationalState({
        recovering: true,
        ownerReadiness: 'ready',
        continuity: null,
      }),
    ).toBe('Recovering');
    expect(
      evaluateNotificationPlatformRetryOperationalState({
        recovering: false,
        ownerReadiness: 'unavailable',
        continuity: null,
      }),
    ).toBe('Unavailable');
    expect(W5_N13_D_ARCHITECTURE_CLAIMS.neverHardcodesReady).toBe(true);
    expect(W5_N13_D_ARCHITECTURE_CLAIMS.canFabricateReadiness).toBe(false);
  });

  it('integrity failure → Degraded; recovery failure → Unavailable; healthy recovery → Ready', () => {
    recordNotificationPlatformRetryRecoveryStart();
    recordNotificationPlatformRetryRecoverySuccess({
      diagnostics: buildNotificationPlatformRetryRecoveryDiagnostics([
        canonicalAnchor('ws-1', 'retry-1'),
      ]),
    });
    recordNotificationPlatformRetryIntegrityFailure('integrity-check-failed');
    expect(
      evaluateNotificationPlatformRetryOperationalState({
        recovering: false,
        ownerReadiness: 'ready',
        continuity: getNotificationPlatformRetryContinuityRecord(),
      }),
    ).toBe('Degraded');

    recordNotificationPlatformRetryRecoveryFailure({ reason: 'corrupt' });
    expect(
      evaluateNotificationPlatformRetryOperationalState({
        recovering: false,
        ownerReadiness: 'ready',
        continuity: getNotificationPlatformRetryContinuityRecord(),
      }),
    ).toBe('Unavailable');

    resetNotificationPlatformRetryContinuity();
    recordNotificationPlatformRetryRecoveryStart();
    recordNotificationPlatformRetryRecoverySuccess({
      diagnostics: buildNotificationPlatformRetryRecoveryDiagnostics([]),
    });
    expect(
      evaluateNotificationPlatformRetryOperationalState({
        recovering: false,
        ownerReadiness: 'ready',
        continuity: getNotificationPlatformRetryContinuityRecord(),
      }),
    ).toBe('Ready');
  });

  it('Degraded never fabricates Ready', () => {
    recordNotificationPlatformRetryRecoveryStart();
    recordNotificationPlatformRetryRecoverySuccess({
      diagnostics: buildNotificationPlatformRetryRecoveryDiagnostics([
        canonicalAnchor('ws-1', 'retry-1'),
      ]),
    });
    recordNotificationPlatformRetryIntegrityFailure('integrity-check-failed');
    const projection = buildNotificationPlatformRetryContinuityProjection({
      recovering: false,
      ownerReadiness: 'ready',
      continuity: getNotificationPlatformRetryContinuityRecord(),
    });
    expect(projection.operationalState).toBe('Degraded');
    expect(projection.operationalState).not.toBe('Ready');
  });
});

describe('W5-N13-d notification platform retry operational continuity — integration', () => {
  beforeEach(() => {
    resetNotificationPlatformRetryContinuity();
  });

  it('ownership remains notification-delivery only', () => {
    expect(W5_N13_D_NOTIFICATION_OWNER).toBe('notification-delivery');
  });

  it('platform projection includes notification platform retry continuity view', () => {
    recordNotificationPlatformRetryRecoveryStart();
    recordNotificationPlatformRetryRecoverySuccess({
      diagnostics: buildNotificationPlatformRetryRecoveryDiagnostics([
        canonicalAnchor('ws-1', 'retry-1'),
      ]),
    });
    const notificationPlatformRetry = buildNotificationPlatformRetryContinuityProjection({
      recovering: false,
      ownerReadiness: 'ready',
      continuity: getNotificationPlatformRetryContinuityRecord(),
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
      recoveryTimestamp: '2026-09-02T16:00:00.000Z',
      recoveryDurationMs: 10,
      notificationPlatformRetry,
    });
    expect(projection.notificationPlatformRetry?.operationalState).toBe('Ready');
    expect(projection.notificationPlatformRetry?.canonicalAnchorCount).toBe(1);
  });

  it('healthy platform components continue while notification platform retry is Unavailable', () => {
    expect(
      notificationPlatformRetryContinuesWhileOthersDegraded({
        notificationPlatformRetryState: 'Unavailable',
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
    expect(transitionSafetyAnswers().reusesW5N13bPersistence).toBe(true);
    expect(transitionSafetyAnswers().reusesW5N13cRecovery).toBe(true);
    expect(transitionSafetyAnswers().degradedNeverFabricatesReady).toBe(true);
  });

  it('architecture claims: no retry runtime or functional claims', () => {
    expect(W5_N13_D_ARCHITECTURE_CLAIMS.retryRuntimeImplemented).toBe(false);
    expect(W5_N13_D_ARCHITECTURE_CLAIMS.platformRetryFunctionalClaimed).toBe(false);
    expect(W5_N13_D_ARCHITECTURE_CLAIMS.retryExecutionImplemented).toBe(false);
    expect(W5_N13_D_ARCHITECTURE_CLAIMS.newPersistenceOwner).toBe(false);
  });

  it('technical debt delta: operational continuity resolved; package close deferred', () => {
    expect(W5_N13_D_TECHNICAL_DEBT_DELTA.resolved.length).toBeGreaterThan(0);
    expect(W5_N13_D_TECHNICAL_DEBT_DELTA.introduced).toEqual([]);
    expect(W5_N13_D_TECHNICAL_DEBT_DELTA.deferred.some((item) => item.includes('W5-N13-e'))).toBe(
      true,
    );
  });

  it('explicit OUT covers W5-N13-e and retry runtime', () => {
    expect(W5_N13_D_EXPLICIT_OUT).toEqual(
      expect.arrayContaining(['w5-n13-e', 'platform-retry-runtime']),
    );
  });

  it('transition matrix: recovery + operational continuity; retry runtime still missing', () => {
    expect(W5_N13_D_TRANSITION_MATRIX.before).toContain('Restart recovery (W5-N13-c)');
    expect(W5_N13_D_TRANSITION_MATRIX.after).toContain('Operational continuity (W5-N13-d)');
    expect(
      W5_N13_D_TRANSITION_MATRIX.stillMissing.some((item) => item.includes('Retry runtime')),
    ).toBe(true);
  });

  it('required reports and domain files exist', () => {
    const wave5 = join(REPO_ROOT, 'docs/project/version-3/wave-5');
    for (const name of [
      'w5-n13-d-implementation-report.md',
      'w5-n13-d-architecture-review.md',
      'w5-n13-d-security-review.md',
      'w5-n13-d-product-review.md',
      'w5-n13-d-validation-report.md',
    ]) {
      expect(existsSync(join(wave5, name))).toBe(true);
    }
    expect(
      existsSync(
        join(
          REPO_ROOT,
          'apps/api/src/modules/notification-delivery/domain/notification-platform-retry-operational-continuity.ts',
        ),
      ),
    ).toBe(true);
  });

  it('slice id is W5-N13-d', () => {
    expect(W5_N13_D_SLICE_ID).toBe('W5-N13-d');
  });
});
