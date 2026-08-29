import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { buildNotificationPlatformIntegrationAnchorState } from '../modules/notification-delivery/domain/durable-notification-platform-integration-anchor';
import {
  getNotificationPlatformIntegrationContinuityRecord,
  recordNotificationPlatformIntegrationIntegrityFailure,
  recordNotificationPlatformIntegrationRecoveryFailure,
  recordNotificationPlatformIntegrationRecoveryStart,
  recordNotificationPlatformIntegrationRecoverySuccess,
  resetNotificationPlatformIntegrationContinuity,
} from '../modules/notification-delivery/domain/notification-platform-integration-continuity-status';
import {
  buildNotificationPlatformIntegrationContinuityProjection,
  evaluateNotificationPlatformIntegrationOperationalState,
  notificationPlatformIntegrationContinuesWhileOthersDegraded,
} from '../modules/notification-delivery/domain/notification-platform-integration-operational-continuity';
import { buildNotificationPlatformIntegrationRecoveryDiagnostics } from '../modules/notification-delivery/domain/notification-platform-integration-restart-recovery';
import {
  buildPlatformOperationalProjection,
  healthyOwnersContinueWhileOthersUnavailable,
  OPERATIONAL_STATES,
} from '../modules/operational-continuity/operational-readiness';
import {
  transitionSafetyAnswers,
  W5_N05_D_ARCHITECTURE_CLAIMS,
  W5_N05_D_EXPLICIT_OUT,
  W5_N05_D_NOTIFICATION_OWNER,
  W5_N05_D_SLICE_ID,
  W5_N05_D_SUPPORTED_STATES,
  W5_N05_D_TECHNICAL_DEBT_DELTA,
  W5_N05_D_TRANSITION_MATRIX,
} from './w5-n05-d-notification-platform-integration-operational-continuity';

const REPO_ROOT = join(__dirname, '../../../..');
const recordedAt = '2026-08-29T18:00:00.000Z';

function canonicalAnchor(workspaceId: string, integrationAnchorId: string) {
  const outcome = buildNotificationPlatformIntegrationAnchorState({
    workspaceId,
    integrationAnchorId,
    platformIntegrationType: 'unified-platform-integration',
    correlationId: 'corr-1',
    actorId: 'actor-1',
    recordedAt,
    prior: null,
  });
  if (!outcome.ok) throw new Error('expected canonical anchor');
  return outcome.anchor;
}

describe('W5-N05-d notification platform integration operational continuity — unit', () => {
  beforeEach(() => {
    resetNotificationPlatformIntegrationContinuity();
  });

  it('operational state derivation: Recovering / Ready / Degraded / Unavailable only', () => {
    expect(W5_N05_D_SUPPORTED_STATES).toEqual([...OPERATIONAL_STATES]);
    expect(
      evaluateNotificationPlatformIntegrationOperationalState({
        recovering: true,
        ownerReadiness: 'ready',
        continuity: null,
      }),
    ).toBe('Recovering');
    expect(
      evaluateNotificationPlatformIntegrationOperationalState({
        recovering: false,
        ownerReadiness: 'unavailable',
        continuity: null,
      }),
    ).toBe('Unavailable');
    expect(W5_N05_D_ARCHITECTURE_CLAIMS.neverHardcodesReady).toBe(true);
    expect(W5_N05_D_ARCHITECTURE_CLAIMS.canFabricateReadiness).toBe(false);
  });

  it('integrity failure → Degraded; recovery failure → Unavailable; healthy recovery → Ready', () => {
    recordNotificationPlatformIntegrationRecoveryStart();
    recordNotificationPlatformIntegrationRecoverySuccess({
      diagnostics: buildNotificationPlatformIntegrationRecoveryDiagnostics([
        canonicalAnchor('ws-1', 'int-1'),
      ]),
    });
    recordNotificationPlatformIntegrationIntegrityFailure('integrity-check-failed');
    expect(
      evaluateNotificationPlatformIntegrationOperationalState({
        recovering: false,
        ownerReadiness: 'ready',
        continuity: getNotificationPlatformIntegrationContinuityRecord(),
      }),
    ).toBe('Degraded');

    recordNotificationPlatformIntegrationRecoveryFailure({ reason: 'corrupt' });
    expect(
      evaluateNotificationPlatformIntegrationOperationalState({
        recovering: false,
        ownerReadiness: 'ready',
        continuity: getNotificationPlatformIntegrationContinuityRecord(),
      }),
    ).toBe('Unavailable');

    resetNotificationPlatformIntegrationContinuity();
    recordNotificationPlatformIntegrationRecoveryStart();
    recordNotificationPlatformIntegrationRecoverySuccess({
      diagnostics: buildNotificationPlatformIntegrationRecoveryDiagnostics([]),
    });
    expect(
      evaluateNotificationPlatformIntegrationOperationalState({
        recovering: false,
        ownerReadiness: 'ready',
        continuity: getNotificationPlatformIntegrationContinuityRecord(),
      }),
    ).toBe('Ready');
  });

  it('Degraded never fabricates Ready', () => {
    recordNotificationPlatformIntegrationRecoveryStart();
    recordNotificationPlatformIntegrationRecoverySuccess({
      diagnostics: buildNotificationPlatformIntegrationRecoveryDiagnostics([
        canonicalAnchor('ws-1', 'int-1'),
      ]),
    });
    recordNotificationPlatformIntegrationIntegrityFailure('integrity-check-failed');
    const projection = buildNotificationPlatformIntegrationContinuityProjection({
      recovering: false,
      ownerReadiness: 'ready',
      continuity: getNotificationPlatformIntegrationContinuityRecord(),
    });
    expect(projection.operationalState).toBe('Degraded');
    expect(projection.operationalState).not.toBe('Ready');
  });
});

describe('W5-N05-d notification platform integration operational continuity — integration', () => {
  beforeEach(() => {
    resetNotificationPlatformIntegrationContinuity();
  });

  it('ownership remains notification-delivery only', () => {
    expect(W5_N05_D_NOTIFICATION_OWNER).toBe('notification-delivery');
  });

  it('platform projection includes notification platform integration continuity view', () => {
    recordNotificationPlatformIntegrationRecoveryStart();
    recordNotificationPlatformIntegrationRecoverySuccess({
      diagnostics: buildNotificationPlatformIntegrationRecoveryDiagnostics([
        canonicalAnchor('ws-1', 'int-1'),
      ]),
    });
    const notificationPlatformIntegration =
      buildNotificationPlatformIntegrationContinuityProjection({
        recovering: false,
        ownerReadiness: 'ready',
        continuity: getNotificationPlatformIntegrationContinuityRecord(),
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
      recoveryTimestamp: '2026-08-29T18:00:00.000Z',
      recoveryDurationMs: 10,
      notificationPlatformIntegration,
    });
    expect(projection.notificationPlatformIntegration?.operationalState).toBe('Ready');
    expect(projection.notificationPlatformIntegration?.canonicalAnchorCount).toBe(1);
  });

  it('healthy platform components continue while notification platform integration is Unavailable', () => {
    expect(
      notificationPlatformIntegrationContinuesWhileOthersDegraded({
        notificationPlatformIntegrationState: 'Unavailable',
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

  it('transition safety answers confirm W5-N05-b/c reuse without ownership drift', () => {
    const answers = transitionSafetyAnswers();
    expect(answers.reusesW5N05bPersistence).toBe(true);
    expect(answers.reusesW5N05cRecovery).toBe(true);
    expect(answers.degradedNeverFabricatesReady).toBe(true);
    expect(W5_N05_D_ARCHITECTURE_CLAIMS.newPersistenceOwner).toBe(false);
    expect(W5_N05_D_ARCHITECTURE_CLAIMS.platformIntegrationOperationalClaimed).toBe(false);
  });

  it('technical debt delta and explicit OUT cover W5-N05-e deferral', () => {
    expect(W5_N05_D_TECHNICAL_DEBT_DELTA.resolved.length).toBeGreaterThan(0);
    expect(W5_N05_D_TECHNICAL_DEBT_DELTA.introduced).toEqual([]);
    expect(W5_N05_D_EXPLICIT_OUT).toEqual(
      expect.arrayContaining(['w5-n05-e', 'persistence-changes']),
    );
    expect(
      W5_N05_D_TRANSITION_MATRIX.stillMissing.some((item) => item.includes('Package Close')),
    ).toBe(true);
  });

  it('required reports and domain files exist', () => {
    const wave5 = join(REPO_ROOT, 'docs/project/version-3/wave-5');
    for (const name of [
      'w5-n05-d-implementation-report.md',
      'w5-n05-d-architecture-review.md',
      'w5-n05-d-security-review.md',
      'w5-n05-d-product-review.md',
      'w5-n05-d-validation-report.md',
    ]) {
      expect(existsSync(join(wave5, name))).toBe(true);
    }
    expect(
      existsSync(
        join(
          REPO_ROOT,
          'apps/api/src/modules/notification-delivery/domain/notification-platform-integration-operational-continuity.ts',
        ),
      ),
    ).toBe(true);
  });

  it('slice id is W5-N05-d', () => {
    expect(W5_N05_D_SLICE_ID).toBe('W5-N05-d');
  });
});
