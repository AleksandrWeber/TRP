import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { buildNotificationPlatformRetryExecutionAnchorState } from '../modules/notification-delivery/domain/durable-notification-platform-retry-execution-anchor';
import {
  getNotificationPlatformRetryExecutionContinuityRecord,
  recordNotificationPlatformRetryExecutionIntegrityFailure,
  recordNotificationPlatformRetryExecutionRecoveryFailure,
  recordNotificationPlatformRetryExecutionRecoveryStart,
  recordNotificationPlatformRetryExecutionRecoverySuccess,
  resetNotificationPlatformRetryExecutionContinuity,
} from '../modules/notification-delivery/domain/notification-platform-retry-execution-continuity-status';
import {
  buildNotificationPlatformRetryExecutionContinuityProjection,
  evaluateNotificationPlatformRetryExecutionOperationalState,
  notificationPlatformRetryExecutionContinuesWhileOthersDegraded,
} from '../modules/notification-delivery/domain/notification-platform-retry-execution-operational-continuity';
import { buildNotificationPlatformRetryExecutionRecoveryDiagnostics } from '../modules/notification-delivery/domain/notification-platform-retry-execution-restart-recovery';
import {
  buildPlatformOperationalProjection,
  healthyOwnersContinueWhileOthersUnavailable,
  OPERATIONAL_STATES,
} from '../modules/operational-continuity/operational-readiness';
import {
  transitionSafetyAnswers,
  W5_N18_D_ARCHITECTURE_CLAIMS,
  W5_N18_D_EXPLICIT_OUT,
  W5_N18_D_NOTIFICATION_OWNER,
  W5_N18_D_SLICE_ID,
  W5_N18_D_SUPPORTED_STATES,
  W5_N18_D_TECHNICAL_DEBT_DELTA,
  W5_N18_D_TRANSITION_MATRIX,
} from './w5-n18-d-notification-platform-retry-execution-operational-continuity';

const REPO_ROOT = join(__dirname, '../../../..');
const recordedAt = '2026-09-02T16:00:00.000Z';

function canonicalAnchor(workspaceId: string, retryExecutionAnchorId: string) {
  const outcome = buildNotificationPlatformRetryExecutionAnchorState({
    workspaceId,
    retryExecutionAnchorId,
    platformRetryExecutionType: 'cross-channel-foundation',
    correlationId: 'corr-1',
    actorId: 'actor-1',
    recordedAt,
    prior: null,
  });
  if (!outcome.ok) throw new Error('expected canonical anchor');
  return outcome.anchor;
}

describe('W5-N18-d notification platform retry execution operational continuity — unit', () => {
  beforeEach(() => {
    resetNotificationPlatformRetryExecutionContinuity();
  });

  it('operational state derivation: Recovering / Ready / Degraded / Unavailable only', () => {
    expect(W5_N18_D_SUPPORTED_STATES).toEqual([...OPERATIONAL_STATES]);
    expect(
      evaluateNotificationPlatformRetryExecutionOperationalState({
        recovering: true,
        ownerReadiness: 'ready',
        continuity: null,
      }),
    ).toBe('Recovering');
    expect(
      evaluateNotificationPlatformRetryExecutionOperationalState({
        recovering: false,
        ownerReadiness: 'unavailable',
        continuity: null,
      }),
    ).toBe('Unavailable');
    expect(W5_N18_D_ARCHITECTURE_CLAIMS.neverHardcodesReady).toBe(true);
    expect(W5_N18_D_ARCHITECTURE_CLAIMS.canFabricateReadiness).toBe(false);
  });

  it('integrity failure → Degraded; recovery failure → Unavailable; healthy recovery → Ready', () => {
    recordNotificationPlatformRetryExecutionRecoveryStart();
    recordNotificationPlatformRetryExecutionRecoverySuccess({
      diagnostics: buildNotificationPlatformRetryExecutionRecoveryDiagnostics([
        canonicalAnchor('ws-1', 'retry-execution-1'),
      ]),
    });
    recordNotificationPlatformRetryExecutionIntegrityFailure('integrity-check-failed');
    expect(
      evaluateNotificationPlatformRetryExecutionOperationalState({
        recovering: false,
        ownerReadiness: 'ready',
        continuity: getNotificationPlatformRetryExecutionContinuityRecord(),
      }),
    ).toBe('Degraded');

    recordNotificationPlatformRetryExecutionRecoveryFailure({ reason: 'corrupt' });
    expect(
      evaluateNotificationPlatformRetryExecutionOperationalState({
        recovering: false,
        ownerReadiness: 'ready',
        continuity: getNotificationPlatformRetryExecutionContinuityRecord(),
      }),
    ).toBe('Unavailable');

    resetNotificationPlatformRetryExecutionContinuity();
    recordNotificationPlatformRetryExecutionRecoveryStart();
    recordNotificationPlatformRetryExecutionRecoverySuccess({
      diagnostics: buildNotificationPlatformRetryExecutionRecoveryDiagnostics([]),
    });
    expect(
      evaluateNotificationPlatformRetryExecutionOperationalState({
        recovering: false,
        ownerReadiness: 'ready',
        continuity: getNotificationPlatformRetryExecutionContinuityRecord(),
      }),
    ).toBe('Ready');
  });

  it('Degraded never fabricates Ready', () => {
    recordNotificationPlatformRetryExecutionRecoveryStart();
    recordNotificationPlatformRetryExecutionRecoverySuccess({
      diagnostics: buildNotificationPlatformRetryExecutionRecoveryDiagnostics([
        canonicalAnchor('ws-1', 'retry-execution-1'),
      ]),
    });
    recordNotificationPlatformRetryExecutionIntegrityFailure('integrity-check-failed');
    const projection = buildNotificationPlatformRetryExecutionContinuityProjection({
      recovering: false,
      ownerReadiness: 'ready',
      continuity: getNotificationPlatformRetryExecutionContinuityRecord(),
    });
    expect(projection.operationalState).toBe('Degraded');
    expect(projection.operationalState).not.toBe('Ready');
  });
});

describe('W5-N18-d notification platform retry execution operational continuity — integration', () => {
  beforeEach(() => {
    resetNotificationPlatformRetryExecutionContinuity();
  });

  it('ownership remains notification-delivery only', () => {
    expect(W5_N18_D_NOTIFICATION_OWNER).toBe('notification-delivery');
  });

  it('platform projection includes notification platform retry execution continuity view', () => {
    recordNotificationPlatformRetryExecutionRecoveryStart();
    recordNotificationPlatformRetryExecutionRecoverySuccess({
      diagnostics: buildNotificationPlatformRetryExecutionRecoveryDiagnostics([
        canonicalAnchor('ws-1', 'retry-execution-1'),
      ]),
    });
    const notificationPlatformRetryExecution =
      buildNotificationPlatformRetryExecutionContinuityProjection({
        recovering: false,
        ownerReadiness: 'ready',
        continuity: getNotificationPlatformRetryExecutionContinuityRecord(),
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
      notificationPlatformRetryExecution,
    });
    expect(projection.notificationPlatformRetryExecution?.operationalState).toBe('Ready');
    expect(projection.notificationPlatformRetryExecution?.canonicalAnchorCount).toBe(1);
  });

  it('healthy platform components continue while notification platform retry execution is Unavailable', () => {
    expect(
      notificationPlatformRetryExecutionContinuesWhileOthersDegraded({
        notificationPlatformRetryExecutionState: 'Unavailable',
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
    expect(transitionSafetyAnswers().reusesW5N18bPersistence).toBe(true);
    expect(transitionSafetyAnswers().reusesW5N18cRecovery).toBe(true);
    expect(transitionSafetyAnswers().degradedNeverFabricatesReady).toBe(true);
  });

  it('architecture claims: no retry execution runtime or functional claims', () => {
    expect(W5_N18_D_ARCHITECTURE_CLAIMS.retryExecutionRuntime).toBe(false);
    expect(W5_N18_D_ARCHITECTURE_CLAIMS.retryExecutionImplemented).toBe(false);
    expect(W5_N18_D_ARCHITECTURE_CLAIMS.retryExecutionFunctionalClaimed).toBe(false);
    expect(W5_N18_D_ARCHITECTURE_CLAIMS.operationalContinuityDerived).toBe(true);
    expect(W5_N18_D_ARCHITECTURE_CLAIMS.customerVisibleFeature).toBe(true);
    expect(W5_N18_D_ARCHITECTURE_CLAIMS.w5N18CompleteClaimed).toBe(false);
    expect(W5_N18_D_ARCHITECTURE_CLAIMS.newPersistenceOwner).toBe(false);
  });

  it('technical debt delta: operational continuity resolved; package Close deferred to slice e', () => {
    expect(W5_N18_D_TECHNICAL_DEBT_DELTA.resolved.length).toBeGreaterThan(0);
    expect(W5_N18_D_TECHNICAL_DEBT_DELTA.resolved).toContain(
      'Retry Execution Operational Continuity Foundation',
    );
    expect(W5_N18_D_TECHNICAL_DEBT_DELTA.introduced).toEqual([]);
    expect(W5_N18_D_TECHNICAL_DEBT_DELTA.deferred).toEqual([]);
  });

  it('explicit OUT covers W5-N18-e and retry execution runtime', () => {
    expect(W5_N18_D_EXPLICIT_OUT).toEqual(
      expect.arrayContaining(['w5-n18-e', 'retry-execution-runtime']),
    );
  });

  it('transition matrix: recovery + operational continuity; retry execution runtime still missing', () => {
    expect(W5_N18_D_TRANSITION_MATRIX.before).toContain('Restart recovery (W5-N18-c)');
    expect(W5_N18_D_TRANSITION_MATRIX.after).toContain('Operational continuity (W5-N18-d)');
    expect(
      W5_N18_D_TRANSITION_MATRIX.stillMissing.some((item) => item.includes('Package Close')),
    ).toBe(true);
    expect(
      W5_N18_D_TRANSITION_MATRIX.stillMissing.some((item) =>
        item.includes('Retry execution runtime'),
      ),
    ).toBe(true);
  });

  it('required reports and domain files exist', () => {
    const wave5 = join(REPO_ROOT, 'docs/project/version-3/wave-5');
    for (const name of [
      'w5-n18-d-implementation-report.md',
      'w5-n18-d-architecture-review.md',
      'w5-n18-d-security-review.md',
      'w5-n18-d-product-review.md',
      'w5-n18-d-validation-report.md',
    ]) {
      expect(existsSync(join(wave5, name))).toBe(true);
    }
    expect(
      existsSync(
        join(
          REPO_ROOT,
          'apps/api/src/modules/notification-delivery/domain/notification-platform-retry-execution-operational-continuity.ts',
        ),
      ),
    ).toBe(true);
  });

  it('slice id is W5-N18-d', () => {
    expect(W5_N18_D_SLICE_ID).toBe('W5-N18-d');
  });
});
