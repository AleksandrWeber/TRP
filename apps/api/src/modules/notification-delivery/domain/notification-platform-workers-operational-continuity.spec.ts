import { beforeEach, describe, expect, it } from 'vitest';
import { buildNotificationPlatformWorkersAnchorState } from './durable-notification-platform-workers-anchor';
import {
  getNotificationPlatformWorkersContinuityRecord,
  recordNotificationPlatformWorkersIntegrityFailure,
  recordNotificationPlatformWorkersRecoveryFailure,
  recordNotificationPlatformWorkersRecoveryStart,
  recordNotificationPlatformWorkersRecoverySuccess,
  resetNotificationPlatformWorkersContinuity,
} from './notification-platform-workers-continuity-status';
import {
  buildNotificationPlatformWorkersContinuityProjection,
  evaluateNotificationPlatformWorkersOperationalState,
  notificationPlatformWorkersContinuesWhileOthersDegraded,
} from './notification-platform-workers-operational-continuity';
import { buildNotificationPlatformWorkersRecoveryDiagnostics } from './notification-platform-workers-restart-recovery';

const recordedAt = '2026-08-29T21:00:00.000Z';

function canonicalAnchor(workspaceId: string, workersAnchorId: string) {
  const outcome = buildNotificationPlatformWorkersAnchorState({
    workspaceId,
    workersAnchorId,
    platformWorkerType: 'unified-platform-workers',
    correlationId: 'corr-1',
    actorId: 'actor-1',
    recordedAt,
    prior: null,
  });
  if (!outcome.ok) throw new Error('expected canonical anchor');
  return outcome.anchor;
}

describe('notification-platform-workers-operational-continuity domain — W5-N09-d', () => {
  beforeEach(() => {
    resetNotificationPlatformWorkersContinuity();
  });

  it('integrity failure → Degraded; recovery failure → Unavailable; healthy recovery → Ready', () => {
    recordNotificationPlatformWorkersRecoveryStart();
    recordNotificationPlatformWorkersRecoverySuccess({
      diagnostics: buildNotificationPlatformWorkersRecoveryDiagnostics([
        canonicalAnchor('ws-1', 'workers-1'),
      ]),
    });
    recordNotificationPlatformWorkersIntegrityFailure('integrity-check-failed');
    expect(
      evaluateNotificationPlatformWorkersOperationalState({
        recovering: false,
        ownerReadiness: 'ready',
        continuity: getNotificationPlatformWorkersContinuityRecord(),
      }),
    ).toBe('Degraded');

    recordNotificationPlatformWorkersRecoveryFailure({ reason: 'corrupt' });
    expect(
      evaluateNotificationPlatformWorkersOperationalState({
        recovering: false,
        ownerReadiness: 'ready',
        continuity: getNotificationPlatformWorkersContinuityRecord(),
      }),
    ).toBe('Unavailable');

    resetNotificationPlatformWorkersContinuity();
    recordNotificationPlatformWorkersRecoveryStart();
    recordNotificationPlatformWorkersRecoverySuccess({
      diagnostics: buildNotificationPlatformWorkersRecoveryDiagnostics([]),
    });
    expect(
      evaluateNotificationPlatformWorkersOperationalState({
        recovering: false,
        ownerReadiness: 'ready',
        continuity: getNotificationPlatformWorkersContinuityRecord(),
      }),
    ).toBe('Ready');
  });

  it('never fabricates Ready without continuity record', () => {
    expect(
      evaluateNotificationPlatformWorkersOperationalState({
        recovering: false,
        ownerReadiness: 'ready',
        continuity: null,
      }),
    ).toBe('Unavailable');
  });

  it('Degraded never fabricates Ready', () => {
    recordNotificationPlatformWorkersRecoveryStart();
    recordNotificationPlatformWorkersRecoverySuccess({
      diagnostics: buildNotificationPlatformWorkersRecoveryDiagnostics([
        canonicalAnchor('ws-1', 'workers-1'),
      ]),
    });
    recordNotificationPlatformWorkersIntegrityFailure('integrity-check-failed');
    const projection = buildNotificationPlatformWorkersContinuityProjection({
      recovering: false,
      ownerReadiness: 'ready',
      continuity: getNotificationPlatformWorkersContinuityRecord(),
    });
    expect(projection.operationalState).toBe('Degraded');
    expect(projection.operationalState).not.toBe('Ready');
  });

  it('graceful degradation: healthy platform workers continues while other owners degraded', () => {
    expect(
      notificationPlatformWorkersContinuesWhileOthersDegraded({
        notificationPlatformWorkersState: 'Ready',
        otherOwnerStates: ['Degraded', 'Unavailable'],
      }),
    ).toBe(true);
    expect(
      notificationPlatformWorkersContinuesWhileOthersDegraded({
        notificationPlatformWorkersState: 'Unavailable',
        otherOwnerStates: ['Ready'],
      }),
    ).toBe(false);
  });

  it('projection exposes canonical anchor counts from recovery diagnostics', () => {
    recordNotificationPlatformWorkersRecoveryStart();
    recordNotificationPlatformWorkersRecoverySuccess({
      diagnostics: buildNotificationPlatformWorkersRecoveryDiagnostics([
        canonicalAnchor('ws-1', 'workers-1'),
      ]),
    });
    const projection = buildNotificationPlatformWorkersContinuityProjection({
      recovering: false,
      ownerReadiness: 'ready',
      continuity: getNotificationPlatformWorkersContinuityRecord(),
    });
    expect(projection.operationalState).toBe('Ready');
    expect(projection.canonicalAnchorCount).toBe(1);
    expect(projection.integrityVerified).toBe(true);
  });
});
