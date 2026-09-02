import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { buildNotificationPlatformTelemetryAnchorState } from '../modules/notification-delivery/domain/durable-notification-platform-telemetry-anchor';
import {
  getNotificationPlatformTelemetryContinuityRecord,
  recordNotificationPlatformTelemetryIntegrityFailure,
  recordNotificationPlatformTelemetryRecoveryFailure,
  recordNotificationPlatformTelemetryRecoveryStart,
  recordNotificationPlatformTelemetryRecoverySuccess,
  resetNotificationPlatformTelemetryContinuity,
} from '../modules/notification-delivery/domain/notification-platform-telemetry-continuity-status';
import {
  buildNotificationPlatformTelemetryContinuityProjection,
  evaluateNotificationPlatformTelemetryOperationalState,
  notificationPlatformTelemetryContinuesWhileOthersDegraded,
} from '../modules/notification-delivery/domain/notification-platform-telemetry-operational-continuity';
import { buildNotificationPlatformTelemetryRecoveryDiagnostics } from '../modules/notification-delivery/domain/notification-platform-telemetry-restart-recovery';
import {
  buildPlatformOperationalProjection,
  healthyOwnersContinueWhileOthersUnavailable,
  OPERATIONAL_STATES,
} from '../modules/operational-continuity/operational-readiness';
import {
  transitionSafetyAnswers,
  W5_N15_D_ARCHITECTURE_CLAIMS,
  W5_N15_D_EXPLICIT_OUT,
  W5_N15_D_NOTIFICATION_OWNER,
  W5_N15_D_SLICE_ID,
  W5_N15_D_SUPPORTED_STATES,
  W5_N15_D_TECHNICAL_DEBT_DELTA,
  W5_N15_D_TRANSITION_MATRIX,
} from './w5-n15-d-notification-platform-telemetry-operational-continuity';

const REPO_ROOT = join(__dirname, '../../../..');
const recordedAt = '2026-09-02T16:00:00.000Z';

function canonicalAnchor(workspaceId: string, telemetryAnchorId: string) {
  const outcome = buildNotificationPlatformTelemetryAnchorState({
    workspaceId,
    telemetryAnchorId,
    platformTelemetryType: 'unified-platform-telemetry',
    correlationId: 'corr-1',
    actorId: 'actor-1',
    recordedAt,
    prior: null,
  });
  if (!outcome.ok) throw new Error('expected canonical anchor');
  return outcome.anchor;
}

describe('W5-N15-d notification platform telemetry operational continuity — unit', () => {
  beforeEach(() => {
    resetNotificationPlatformTelemetryContinuity();
  });

  it('operational state derivation: Recovering / Ready / Degraded / Unavailable only', () => {
    expect(W5_N15_D_SUPPORTED_STATES).toEqual([...OPERATIONAL_STATES]);
    expect(
      evaluateNotificationPlatformTelemetryOperationalState({
        recovering: true,
        ownerReadiness: 'ready',
        continuity: null,
      }),
    ).toBe('Recovering');
    expect(
      evaluateNotificationPlatformTelemetryOperationalState({
        recovering: false,
        ownerReadiness: 'unavailable',
        continuity: null,
      }),
    ).toBe('Unavailable');
    expect(W5_N15_D_ARCHITECTURE_CLAIMS.neverHardcodesReady).toBe(true);
    expect(W5_N15_D_ARCHITECTURE_CLAIMS.canFabricateReadiness).toBe(false);
  });

  it('integrity failure → Degraded; recovery failure → Unavailable; healthy recovery → Ready', () => {
    recordNotificationPlatformTelemetryRecoveryStart();
    recordNotificationPlatformTelemetryRecoverySuccess({
      diagnostics: buildNotificationPlatformTelemetryRecoveryDiagnostics([
        canonicalAnchor('ws-1', 'telemetry-1'),
      ]),
    });
    recordNotificationPlatformTelemetryIntegrityFailure('integrity-check-failed');
    expect(
      evaluateNotificationPlatformTelemetryOperationalState({
        recovering: false,
        ownerReadiness: 'ready',
        continuity: getNotificationPlatformTelemetryContinuityRecord(),
      }),
    ).toBe('Degraded');

    recordNotificationPlatformTelemetryRecoveryFailure({ reason: 'corrupt' });
    expect(
      evaluateNotificationPlatformTelemetryOperationalState({
        recovering: false,
        ownerReadiness: 'ready',
        continuity: getNotificationPlatformTelemetryContinuityRecord(),
      }),
    ).toBe('Unavailable');

    resetNotificationPlatformTelemetryContinuity();
    recordNotificationPlatformTelemetryRecoveryStart();
    recordNotificationPlatformTelemetryRecoverySuccess({
      diagnostics: buildNotificationPlatformTelemetryRecoveryDiagnostics([]),
    });
    expect(
      evaluateNotificationPlatformTelemetryOperationalState({
        recovering: false,
        ownerReadiness: 'ready',
        continuity: getNotificationPlatformTelemetryContinuityRecord(),
      }),
    ).toBe('Ready');
  });

  it('Degraded never fabricates Ready', () => {
    recordNotificationPlatformTelemetryRecoveryStart();
    recordNotificationPlatformTelemetryRecoverySuccess({
      diagnostics: buildNotificationPlatformTelemetryRecoveryDiagnostics([
        canonicalAnchor('ws-1', 'telemetry-1'),
      ]),
    });
    recordNotificationPlatformTelemetryIntegrityFailure('integrity-check-failed');
    const projection = buildNotificationPlatformTelemetryContinuityProjection({
      recovering: false,
      ownerReadiness: 'ready',
      continuity: getNotificationPlatformTelemetryContinuityRecord(),
    });
    expect(projection.operationalState).toBe('Degraded');
    expect(projection.operationalState).not.toBe('Ready');
  });
});

describe('W5-N15-d notification platform telemetry operational continuity — integration', () => {
  beforeEach(() => {
    resetNotificationPlatformTelemetryContinuity();
  });

  it('ownership remains notification-delivery only', () => {
    expect(W5_N15_D_NOTIFICATION_OWNER).toBe('notification-delivery');
  });

  it('platform projection includes notification platform telemetry continuity view', () => {
    recordNotificationPlatformTelemetryRecoveryStart();
    recordNotificationPlatformTelemetryRecoverySuccess({
      diagnostics: buildNotificationPlatformTelemetryRecoveryDiagnostics([
        canonicalAnchor('ws-1', 'telemetry-1'),
      ]),
    });
    const notificationPlatformTelemetry = buildNotificationPlatformTelemetryContinuityProjection({
      recovering: false,
      ownerReadiness: 'ready',
      continuity: getNotificationPlatformTelemetryContinuityRecord(),
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
      notificationPlatformTelemetry,
    });
    expect(projection.notificationPlatformTelemetry?.operationalState).toBe('Ready');
    expect(projection.notificationPlatformTelemetry?.canonicalAnchorCount).toBe(1);
  });

  it('healthy platform components continue while notification platform telemetry is Unavailable', () => {
    expect(
      notificationPlatformTelemetryContinuesWhileOthersDegraded({
        notificationPlatformTelemetryState: 'Unavailable',
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
    expect(transitionSafetyAnswers().reusesW5N15bPersistence).toBe(true);
    expect(transitionSafetyAnswers().reusesW5N15cRecovery).toBe(true);
    expect(transitionSafetyAnswers().degradedNeverFabricatesReady).toBe(true);
  });

  it('architecture claims: no telemetry runtime or functional claims', () => {
    expect(W5_N15_D_ARCHITECTURE_CLAIMS.metricsCollectionImplemented).toBe(false);
    expect(W5_N15_D_ARCHITECTURE_CLAIMS.platformTelemetryFunctionalClaimed).toBe(false);
    expect(W5_N15_D_ARCHITECTURE_CLAIMS.exportersImplemented).toBe(false);
    expect(W5_N15_D_ARCHITECTURE_CLAIMS.newPersistenceOwner).toBe(false);
  });

  it('technical debt delta: operational continuity resolved; package close deferred', () => {
    expect(W5_N15_D_TECHNICAL_DEBT_DELTA.resolved.length).toBeGreaterThan(0);
    expect(W5_N15_D_TECHNICAL_DEBT_DELTA.introduced).toEqual([]);
    expect(W5_N15_D_TECHNICAL_DEBT_DELTA.deferred).toEqual(
      expect.arrayContaining(['W5-N15-e — Package Close Evidence']),
    );
  });

  it('explicit OUT covers W5-N15-e and telemetry runtime', () => {
    expect(W5_N15_D_EXPLICIT_OUT).toEqual(
      expect.arrayContaining(['w5-n15-e', 'platform-telemetry-runtime']),
    );
  });

  it('transition matrix: recovery + operational continuity; telemetry runtime still missing', () => {
    expect(W5_N15_D_TRANSITION_MATRIX.before).toContain('Restart recovery (W5-N15-c)');
    expect(W5_N15_D_TRANSITION_MATRIX.after).toContain('Operational continuity (W5-N15-d)');
    expect(
      W5_N15_D_TRANSITION_MATRIX.stillMissing.some((item) => item.includes('Metrics collection')),
    ).toBe(true);
  });

  it('required reports and domain files exist', () => {
    const wave5 = join(REPO_ROOT, 'docs/project/version-3/wave-5');
    for (const name of [
      'w5-n15-d-implementation-report.md',
      'w5-n15-d-architecture-review.md',
      'w5-n15-d-security-review.md',
      'w5-n15-d-product-review.md',
      'w5-n15-d-validation-report.md',
    ]) {
      expect(existsSync(join(wave5, name))).toBe(true);
    }
    expect(
      existsSync(
        join(
          REPO_ROOT,
          'apps/api/src/modules/notification-delivery/domain/notification-platform-telemetry-operational-continuity.ts',
        ),
      ),
    ).toBe(true);
  });

  it('slice id is W5-N15-d', () => {
    expect(W5_N15_D_SLICE_ID).toBe('W5-N15-d');
  });
});
