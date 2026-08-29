import { beforeEach, describe, expect, it } from 'vitest';
import { buildNotificationPlatformWorkerExecutionAnchorState } from './durable-notification-platform-worker-execution-anchor';
import {
  getNotificationPlatformWorkerExecutionContinuityRecord,
  recordNotificationPlatformWorkerExecutionIntegrityFailure,
  recordNotificationPlatformWorkerExecutionRecoveryFailure,
  recordNotificationPlatformWorkerExecutionRecoveryStart,
  recordNotificationPlatformWorkerExecutionRecoverySuccess,
  resetNotificationPlatformWorkerExecutionContinuity,
} from './notification-platform-worker-execution-continuity-status';
import {
  buildNotificationPlatformWorkerExecutionContinuityProjection,
  evaluateNotificationPlatformWorkerExecutionOperationalState,
  notificationPlatformWorkerExecutionContinuesWhileOthersDegraded,
} from './notification-platform-worker-execution-operational-continuity';
import { buildNotificationPlatformWorkerExecutionRecoveryDiagnostics } from './notification-platform-worker-execution-restart-recovery';

const recordedAt = '2026-08-29T22:00:00.000Z';

function canonicalAnchor(workspaceId: string, workerExecutionAnchorId: string) {
  const outcome = buildNotificationPlatformWorkerExecutionAnchorState({
    workspaceId,
    workerExecutionAnchorId,
    platformWorkerExecutionType: 'unified-platform-worker-execution',
    correlationId: 'corr-1',
    actorId: 'actor-1',
    recordedAt,
    prior: null,
  });
  if (!outcome.ok) throw new Error('expected canonical anchor');
  return outcome.anchor;
}

describe('notification-platform-worker-execution-operational-continuity domain — W5-N10-d', () => {
  beforeEach(() => {
    resetNotificationPlatformWorkerExecutionContinuity();
  });

  it('integrity failure → Degraded; recovery failure → Unavailable; healthy recovery → Ready', () => {
    recordNotificationPlatformWorkerExecutionRecoveryStart();
    recordNotificationPlatformWorkerExecutionRecoverySuccess({
      diagnostics: buildNotificationPlatformWorkerExecutionRecoveryDiagnostics([
        canonicalAnchor('ws-1', 'worker-exec-1'),
      ]),
    });
    recordNotificationPlatformWorkerExecutionIntegrityFailure('integrity-check-failed');
    expect(
      evaluateNotificationPlatformWorkerExecutionOperationalState({
        recovering: false,
        ownerReadiness: 'ready',
        continuity: getNotificationPlatformWorkerExecutionContinuityRecord(),
      }),
    ).toBe('Degraded');

    recordNotificationPlatformWorkerExecutionRecoveryFailure({ reason: 'corrupt' });
    expect(
      evaluateNotificationPlatformWorkerExecutionOperationalState({
        recovering: false,
        ownerReadiness: 'ready',
        continuity: getNotificationPlatformWorkerExecutionContinuityRecord(),
      }),
    ).toBe('Unavailable');

    resetNotificationPlatformWorkerExecutionContinuity();
    recordNotificationPlatformWorkerExecutionRecoveryStart();
    recordNotificationPlatformWorkerExecutionRecoverySuccess({
      diagnostics: buildNotificationPlatformWorkerExecutionRecoveryDiagnostics([]),
    });
    expect(
      evaluateNotificationPlatformWorkerExecutionOperationalState({
        recovering: false,
        ownerReadiness: 'ready',
        continuity: getNotificationPlatformWorkerExecutionContinuityRecord(),
      }),
    ).toBe('Ready');
  });

  it('never fabricates Ready without continuity record', () => {
    expect(
      evaluateNotificationPlatformWorkerExecutionOperationalState({
        recovering: false,
        ownerReadiness: 'ready',
        continuity: null,
      }),
    ).toBe('Unavailable');
  });

  it('Degraded never fabricates Ready', () => {
    recordNotificationPlatformWorkerExecutionRecoveryStart();
    recordNotificationPlatformWorkerExecutionRecoverySuccess({
      diagnostics: buildNotificationPlatformWorkerExecutionRecoveryDiagnostics([
        canonicalAnchor('ws-1', 'worker-exec-1'),
      ]),
    });
    recordNotificationPlatformWorkerExecutionIntegrityFailure('integrity-check-failed');
    const projection = buildNotificationPlatformWorkerExecutionContinuityProjection({
      recovering: false,
      ownerReadiness: 'ready',
      continuity: getNotificationPlatformWorkerExecutionContinuityRecord(),
    });
    expect(projection.operationalState).toBe('Degraded');
    expect(projection.operationalState).not.toBe('Ready');
  });

  it('graceful degradation: healthy platform worker execution continues while other owners degraded', () => {
    expect(
      notificationPlatformWorkerExecutionContinuesWhileOthersDegraded({
        notificationPlatformWorkerExecutionState: 'Ready',
        otherOwnerStates: ['Degraded', 'Unavailable'],
      }),
    ).toBe(true);
    expect(
      notificationPlatformWorkerExecutionContinuesWhileOthersDegraded({
        notificationPlatformWorkerExecutionState: 'Unavailable',
        otherOwnerStates: ['Ready'],
      }),
    ).toBe(false);
  });

  it('projection exposes canonical anchor counts from recovery diagnostics', () => {
    recordNotificationPlatformWorkerExecutionRecoveryStart();
    recordNotificationPlatformWorkerExecutionRecoverySuccess({
      diagnostics: buildNotificationPlatformWorkerExecutionRecoveryDiagnostics([
        canonicalAnchor('ws-1', 'worker-exec-1'),
      ]),
    });
    const projection = buildNotificationPlatformWorkerExecutionContinuityProjection({
      recovering: false,
      ownerReadiness: 'ready',
      continuity: getNotificationPlatformWorkerExecutionContinuityRecord(),
    });
    expect(projection.operationalState).toBe('Ready');
    expect(projection.canonicalAnchorCount).toBe(1);
    expect(projection.integrityVerified).toBe(true);
  });
});
