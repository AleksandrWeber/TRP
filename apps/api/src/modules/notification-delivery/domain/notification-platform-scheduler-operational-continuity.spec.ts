import { beforeEach, describe, expect, it } from 'vitest';
import { buildNotificationPlatformSchedulerAnchorState } from './durable-notification-platform-scheduler-anchor';
import {
  getNotificationPlatformSchedulerContinuityRecord,
  recordNotificationPlatformSchedulerIntegrityFailure,
  recordNotificationPlatformSchedulerRecoveryFailure,
  recordNotificationPlatformSchedulerRecoveryStart,
  recordNotificationPlatformSchedulerRecoverySuccess,
  resetNotificationPlatformSchedulerContinuity,
} from './notification-platform-scheduler-continuity-status';
import {
  buildNotificationPlatformSchedulerContinuityProjection,
  evaluateNotificationPlatformSchedulerOperationalState,
  notificationPlatformSchedulerContinuesWhileOthersDegraded,
} from './notification-platform-scheduler-operational-continuity';
import { buildNotificationPlatformSchedulerRecoveryDiagnostics } from './notification-platform-scheduler-restart-recovery';

const recordedAt = '2026-09-02T14:00:00.000Z';

function canonicalAnchor(workspaceId: string, schedulerAnchorId: string) {
  const outcome = buildNotificationPlatformSchedulerAnchorState({
    workspaceId,
    schedulerAnchorId,
    platformSchedulerType: 'unified-platform-scheduler',
    correlationId: 'corr-1',
    actorId: 'actor-1',
    recordedAt,
    prior: null,
  });
  if (!outcome.ok) throw new Error('expected canonical anchor');
  return outcome.anchor;
}

describe('notification-platform-scheduler-operational-continuity domain — W5-N12-d', () => {
  beforeEach(() => {
    resetNotificationPlatformSchedulerContinuity();
  });

  it('integrity failure → Degraded; recovery failure → Unavailable; healthy recovery → Ready', () => {
    recordNotificationPlatformSchedulerRecoveryStart();
    recordNotificationPlatformSchedulerRecoverySuccess({
      diagnostics: buildNotificationPlatformSchedulerRecoveryDiagnostics([
        canonicalAnchor('ws-1', 'scheduler-1'),
      ]),
    });
    recordNotificationPlatformSchedulerIntegrityFailure('integrity-check-failed');
    expect(
      evaluateNotificationPlatformSchedulerOperationalState({
        recovering: false,
        ownerReadiness: 'ready',
        continuity: getNotificationPlatformSchedulerContinuityRecord(),
      }),
    ).toBe('Degraded');

    recordNotificationPlatformSchedulerRecoveryFailure({ reason: 'corrupt' });
    expect(
      evaluateNotificationPlatformSchedulerOperationalState({
        recovering: false,
        ownerReadiness: 'ready',
        continuity: getNotificationPlatformSchedulerContinuityRecord(),
      }),
    ).toBe('Unavailable');

    resetNotificationPlatformSchedulerContinuity();
    recordNotificationPlatformSchedulerRecoveryStart();
    recordNotificationPlatformSchedulerRecoverySuccess({
      diagnostics: buildNotificationPlatformSchedulerRecoveryDiagnostics([]),
    });
    expect(
      evaluateNotificationPlatformSchedulerOperationalState({
        recovering: false,
        ownerReadiness: 'ready',
        continuity: getNotificationPlatformSchedulerContinuityRecord(),
      }),
    ).toBe('Ready');
  });

  it('never fabricates Ready without continuity record', () => {
    expect(
      evaluateNotificationPlatformSchedulerOperationalState({
        recovering: false,
        ownerReadiness: 'ready',
        continuity: null,
      }),
    ).toBe('Unavailable');
  });

  it('Degraded never fabricates Ready', () => {
    recordNotificationPlatformSchedulerRecoveryStart();
    recordNotificationPlatformSchedulerRecoverySuccess({
      diagnostics: buildNotificationPlatformSchedulerRecoveryDiagnostics([
        canonicalAnchor('ws-1', 'scheduler-1'),
      ]),
    });
    recordNotificationPlatformSchedulerIntegrityFailure('integrity-check-failed');
    const projection = buildNotificationPlatformSchedulerContinuityProjection({
      recovering: false,
      ownerReadiness: 'ready',
      continuity: getNotificationPlatformSchedulerContinuityRecord(),
    });
    expect(projection.operationalState).toBe('Degraded');
    expect(projection.operationalState).not.toBe('Ready');
  });

  it('graceful degradation: healthy platform scheduler continues while other owners degraded', () => {
    expect(
      notificationPlatformSchedulerContinuesWhileOthersDegraded({
        notificationPlatformSchedulerState: 'Ready',
        otherOwnerStates: ['Degraded', 'Unavailable'],
      }),
    ).toBe(true);
    expect(
      notificationPlatformSchedulerContinuesWhileOthersDegraded({
        notificationPlatformSchedulerState: 'Unavailable',
        otherOwnerStates: ['Ready'],
      }),
    ).toBe(false);
  });

  it('projection exposes canonical anchor counts from recovery diagnostics', () => {
    recordNotificationPlatformSchedulerRecoveryStart();
    recordNotificationPlatformSchedulerRecoverySuccess({
      diagnostics: buildNotificationPlatformSchedulerRecoveryDiagnostics([
        canonicalAnchor('ws-1', 'scheduler-1'),
      ]),
    });
    const projection = buildNotificationPlatformSchedulerContinuityProjection({
      recovering: false,
      ownerReadiness: 'ready',
      continuity: getNotificationPlatformSchedulerContinuityRecord(),
    });
    expect(projection.operationalState).toBe('Ready');
    expect(projection.canonicalAnchorCount).toBe(1);
    expect(projection.integrityVerified).toBe(true);
  });
});
