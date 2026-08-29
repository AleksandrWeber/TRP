import { beforeEach, describe, expect, it } from 'vitest';
import { buildNotificationPlatformQueueAnchorState } from './durable-notification-platform-queue-anchor';
import {
  getNotificationPlatformQueueContinuityRecord,
  recordNotificationPlatformQueueIntegrityFailure,
  recordNotificationPlatformQueueRecoveryFailure,
  recordNotificationPlatformQueueRecoveryStart,
  recordNotificationPlatformQueueRecoverySuccess,
  resetNotificationPlatformQueueContinuity,
} from './notification-platform-queue-continuity-status';
import {
  buildNotificationPlatformQueueContinuityProjection,
  evaluateNotificationPlatformQueueOperationalState,
  notificationPlatformQueueContinuesWhileOthersDegraded,
} from './notification-platform-queue-operational-continuity';
import { buildNotificationPlatformQueueRecoveryDiagnostics } from './notification-platform-queue-restart-recovery';

const recordedAt = '2026-08-29T20:00:00.000Z';

function canonicalAnchor(workspaceId: string, queueAnchorId: string) {
  const outcome = buildNotificationPlatformQueueAnchorState({
    workspaceId,
    queueAnchorId,
    platformQueueType: 'unified-platform-queue',
    correlationId: 'corr-1',
    actorId: 'actor-1',
    recordedAt,
    prior: null,
  });
  if (!outcome.ok) throw new Error('expected canonical anchor');
  return outcome.anchor;
}

describe('notification-platform-queue-operational-continuity domain — W5-N08-d', () => {
  beforeEach(() => {
    resetNotificationPlatformQueueContinuity();
  });

  it('integrity failure → Degraded; recovery failure → Unavailable; healthy recovery → Ready', () => {
    recordNotificationPlatformQueueRecoveryStart();
    recordNotificationPlatformQueueRecoverySuccess({
      diagnostics: buildNotificationPlatformQueueRecoveryDiagnostics([
        canonicalAnchor('ws-1', 'queue-1'),
      ]),
    });
    recordNotificationPlatformQueueIntegrityFailure('integrity-check-failed');
    expect(
      evaluateNotificationPlatformQueueOperationalState({
        recovering: false,
        ownerReadiness: 'ready',
        continuity: getNotificationPlatformQueueContinuityRecord(),
      }),
    ).toBe('Degraded');

    recordNotificationPlatformQueueRecoveryFailure({ reason: 'corrupt' });
    expect(
      evaluateNotificationPlatformQueueOperationalState({
        recovering: false,
        ownerReadiness: 'ready',
        continuity: getNotificationPlatformQueueContinuityRecord(),
      }),
    ).toBe('Unavailable');

    resetNotificationPlatformQueueContinuity();
    recordNotificationPlatformQueueRecoveryStart();
    recordNotificationPlatformQueueRecoverySuccess({
      diagnostics: buildNotificationPlatformQueueRecoveryDiagnostics([]),
    });
    expect(
      evaluateNotificationPlatformQueueOperationalState({
        recovering: false,
        ownerReadiness: 'ready',
        continuity: getNotificationPlatformQueueContinuityRecord(),
      }),
    ).toBe('Ready');
  });

  it('never fabricates Ready without continuity record', () => {
    expect(
      evaluateNotificationPlatformQueueOperationalState({
        recovering: false,
        ownerReadiness: 'ready',
        continuity: null,
      }),
    ).toBe('Unavailable');
  });

  it('Degraded never fabricates Ready', () => {
    recordNotificationPlatformQueueRecoveryStart();
    recordNotificationPlatformQueueRecoverySuccess({
      diagnostics: buildNotificationPlatformQueueRecoveryDiagnostics([
        canonicalAnchor('ws-1', 'queue-1'),
      ]),
    });
    recordNotificationPlatformQueueIntegrityFailure('integrity-check-failed');
    const projection = buildNotificationPlatformQueueContinuityProjection({
      recovering: false,
      ownerReadiness: 'ready',
      continuity: getNotificationPlatformQueueContinuityRecord(),
    });
    expect(projection.operationalState).toBe('Degraded');
    expect(projection.operationalState).not.toBe('Ready');
  });

  it('graceful degradation: healthy platform queue continues while other owners degraded', () => {
    expect(
      notificationPlatformQueueContinuesWhileOthersDegraded({
        notificationPlatformQueueState: 'Ready',
        otherOwnerStates: ['Degraded', 'Unavailable'],
      }),
    ).toBe(true);
    expect(
      notificationPlatformQueueContinuesWhileOthersDegraded({
        notificationPlatformQueueState: 'Unavailable',
        otherOwnerStates: ['Ready'],
      }),
    ).toBe(false);
  });

  it('projection exposes canonical anchor counts from recovery diagnostics', () => {
    recordNotificationPlatformQueueRecoveryStart();
    recordNotificationPlatformQueueRecoverySuccess({
      diagnostics: buildNotificationPlatformQueueRecoveryDiagnostics([
        canonicalAnchor('ws-1', 'queue-1'),
      ]),
    });
    const projection = buildNotificationPlatformQueueContinuityProjection({
      recovering: false,
      ownerReadiness: 'ready',
      continuity: getNotificationPlatformQueueContinuityRecord(),
    });
    expect(projection.operationalState).toBe('Ready');
    expect(projection.canonicalAnchorCount).toBe(1);
    expect(projection.integrityVerified).toBe(true);
  });
});
