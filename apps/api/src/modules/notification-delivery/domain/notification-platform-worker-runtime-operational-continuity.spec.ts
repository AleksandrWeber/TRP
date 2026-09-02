import { beforeEach, describe, expect, it } from 'vitest';
import { buildNotificationPlatformWorkerRuntimeAnchorState } from './durable-notification-platform-worker-runtime-anchor';
import {
  getNotificationPlatformWorkerRuntimeContinuityRecord,
  recordNotificationPlatformWorkerRuntimeIntegrityFailure,
  recordNotificationPlatformWorkerRuntimeRecoveryFailure,
  recordNotificationPlatformWorkerRuntimeRecoveryStart,
  recordNotificationPlatformWorkerRuntimeRecoverySuccess,
  resetNotificationPlatformWorkerRuntimeContinuity,
} from './notification-platform-worker-runtime-continuity-status';
import {
  buildNotificationPlatformWorkerRuntimeContinuityProjection,
  evaluateNotificationPlatformWorkerRuntimeOperationalState,
  notificationPlatformWorkerRuntimeContinuesWhileOthersDegraded,
} from './notification-platform-worker-runtime-operational-continuity';
import { buildNotificationPlatformWorkerRuntimeRecoveryDiagnostics } from './notification-platform-worker-runtime-restart-recovery';

const recordedAt = '2026-09-02T10:00:00.000Z';

function canonicalAnchor(workspaceId: string, workerRuntimeAnchorId: string) {
  const outcome = buildNotificationPlatformWorkerRuntimeAnchorState({
    workspaceId,
    workerRuntimeAnchorId,
    platformWorkerRuntimeType: 'unified-platform-worker-runtime',
    correlationId: 'corr-1',
    actorId: 'actor-1',
    recordedAt,
    prior: null,
  });
  if (!outcome.ok) throw new Error('expected canonical anchor');
  return outcome.anchor;
}

describe('notification-platform-worker-runtime-operational-continuity domain — W5-N11-d', () => {
  beforeEach(() => {
    resetNotificationPlatformWorkerRuntimeContinuity();
  });

  it('integrity failure → Degraded; recovery failure → Unavailable; healthy recovery → Ready', () => {
    recordNotificationPlatformWorkerRuntimeRecoveryStart();
    recordNotificationPlatformWorkerRuntimeRecoverySuccess({
      diagnostics: buildNotificationPlatformWorkerRuntimeRecoveryDiagnostics([
        canonicalAnchor('ws-1', 'worker-runtime-1'),
      ]),
    });
    recordNotificationPlatformWorkerRuntimeIntegrityFailure('integrity-check-failed');
    expect(
      evaluateNotificationPlatformWorkerRuntimeOperationalState({
        recovering: false,
        ownerReadiness: 'ready',
        continuity: getNotificationPlatformWorkerRuntimeContinuityRecord(),
      }),
    ).toBe('Degraded');

    recordNotificationPlatformWorkerRuntimeRecoveryFailure({ reason: 'corrupt' });
    expect(
      evaluateNotificationPlatformWorkerRuntimeOperationalState({
        recovering: false,
        ownerReadiness: 'ready',
        continuity: getNotificationPlatformWorkerRuntimeContinuityRecord(),
      }),
    ).toBe('Unavailable');

    resetNotificationPlatformWorkerRuntimeContinuity();
    recordNotificationPlatformWorkerRuntimeRecoveryStart();
    recordNotificationPlatformWorkerRuntimeRecoverySuccess({
      diagnostics: buildNotificationPlatformWorkerRuntimeRecoveryDiagnostics([]),
    });
    expect(
      evaluateNotificationPlatformWorkerRuntimeOperationalState({
        recovering: false,
        ownerReadiness: 'ready',
        continuity: getNotificationPlatformWorkerRuntimeContinuityRecord(),
      }),
    ).toBe('Ready');
  });

  it('never fabricates Ready without continuity record', () => {
    expect(
      evaluateNotificationPlatformWorkerRuntimeOperationalState({
        recovering: false,
        ownerReadiness: 'ready',
        continuity: null,
      }),
    ).toBe('Unavailable');
  });

  it('Degraded never fabricates Ready', () => {
    recordNotificationPlatformWorkerRuntimeRecoveryStart();
    recordNotificationPlatformWorkerRuntimeRecoverySuccess({
      diagnostics: buildNotificationPlatformWorkerRuntimeRecoveryDiagnostics([
        canonicalAnchor('ws-1', 'worker-runtime-1'),
      ]),
    });
    recordNotificationPlatformWorkerRuntimeIntegrityFailure('integrity-check-failed');
    const projection = buildNotificationPlatformWorkerRuntimeContinuityProjection({
      recovering: false,
      ownerReadiness: 'ready',
      continuity: getNotificationPlatformWorkerRuntimeContinuityRecord(),
    });
    expect(projection.operationalState).toBe('Degraded');
    expect(projection.operationalState).not.toBe('Ready');
  });

  it('graceful degradation: healthy platform worker runtime continues while other owners degraded', () => {
    expect(
      notificationPlatformWorkerRuntimeContinuesWhileOthersDegraded({
        notificationPlatformWorkerRuntimeState: 'Ready',
        otherOwnerStates: ['Degraded', 'Unavailable'],
      }),
    ).toBe(true);
    expect(
      notificationPlatformWorkerRuntimeContinuesWhileOthersDegraded({
        notificationPlatformWorkerRuntimeState: 'Unavailable',
        otherOwnerStates: ['Ready'],
      }),
    ).toBe(false);
  });

  it('projection exposes canonical anchor counts from recovery diagnostics', () => {
    recordNotificationPlatformWorkerRuntimeRecoveryStart();
    recordNotificationPlatformWorkerRuntimeRecoverySuccess({
      diagnostics: buildNotificationPlatformWorkerRuntimeRecoveryDiagnostics([
        canonicalAnchor('ws-1', 'worker-runtime-1'),
      ]),
    });
    const projection = buildNotificationPlatformWorkerRuntimeContinuityProjection({
      recovering: false,
      ownerReadiness: 'ready',
      continuity: getNotificationPlatformWorkerRuntimeContinuityRecord(),
    });
    expect(projection.operationalState).toBe('Ready');
    expect(projection.canonicalAnchorCount).toBe(1);
    expect(projection.integrityVerified).toBe(true);
  });
});
