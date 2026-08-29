import { beforeEach, describe, expect, it } from 'vitest';
import { buildNotificationPlatformDispatchAnchorState } from './durable-notification-platform-dispatch-anchor';
import {
  getNotificationPlatformDispatchContinuityRecord,
  recordNotificationPlatformDispatchIntegrityFailure,
  recordNotificationPlatformDispatchRecoveryFailure,
  recordNotificationPlatformDispatchRecoveryStart,
  recordNotificationPlatformDispatchRecoverySuccess,
  resetNotificationPlatformDispatchContinuity,
} from './notification-platform-dispatch-continuity-status';
import {
  buildNotificationPlatformDispatchContinuityProjection,
  evaluateNotificationPlatformDispatchOperationalState,
  notificationPlatformDispatchContinuesWhileOthersDegraded,
} from './notification-platform-dispatch-operational-continuity';
import { buildNotificationPlatformDispatchRecoveryDiagnostics } from './notification-platform-dispatch-restart-recovery';

const recordedAt = '2026-08-29T19:30:00.000Z';

function canonicalAnchor(workspaceId: string, dispatchAnchorId: string) {
  const outcome = buildNotificationPlatformDispatchAnchorState({
    workspaceId,
    dispatchAnchorId,
    platformDispatchType: 'unified-platform-dispatch',
    correlationId: 'corr-1',
    actorId: 'actor-1',
    recordedAt,
    prior: null,
  });
  if (!outcome.ok) throw new Error('expected canonical anchor');
  return outcome.anchor;
}

describe('notification-platform-dispatch-operational-continuity domain — W5-N07-d', () => {
  beforeEach(() => {
    resetNotificationPlatformDispatchContinuity();
  });

  it('integrity failure → Degraded; recovery failure → Unavailable; healthy recovery → Ready', () => {
    recordNotificationPlatformDispatchRecoveryStart();
    recordNotificationPlatformDispatchRecoverySuccess({
      diagnostics: buildNotificationPlatformDispatchRecoveryDiagnostics([
        canonicalAnchor('ws-1', 'disp-1'),
      ]),
    });
    recordNotificationPlatformDispatchIntegrityFailure('integrity-check-failed');
    expect(
      evaluateNotificationPlatformDispatchOperationalState({
        recovering: false,
        ownerReadiness: 'ready',
        continuity: getNotificationPlatformDispatchContinuityRecord(),
      }),
    ).toBe('Degraded');

    recordNotificationPlatformDispatchRecoveryFailure({ reason: 'corrupt' });
    expect(
      evaluateNotificationPlatformDispatchOperationalState({
        recovering: false,
        ownerReadiness: 'ready',
        continuity: getNotificationPlatformDispatchContinuityRecord(),
      }),
    ).toBe('Unavailable');

    resetNotificationPlatformDispatchContinuity();
    recordNotificationPlatformDispatchRecoveryStart();
    recordNotificationPlatformDispatchRecoverySuccess({
      diagnostics: buildNotificationPlatformDispatchRecoveryDiagnostics([]),
    });
    expect(
      evaluateNotificationPlatformDispatchOperationalState({
        recovering: false,
        ownerReadiness: 'ready',
        continuity: getNotificationPlatformDispatchContinuityRecord(),
      }),
    ).toBe('Ready');
  });

  it('never fabricates Ready without continuity record', () => {
    expect(
      evaluateNotificationPlatformDispatchOperationalState({
        recovering: false,
        ownerReadiness: 'ready',
        continuity: null,
      }),
    ).toBe('Unavailable');
  });

  it('Degraded never fabricates Ready', () => {
    recordNotificationPlatformDispatchRecoveryStart();
    recordNotificationPlatformDispatchRecoverySuccess({
      diagnostics: buildNotificationPlatformDispatchRecoveryDiagnostics([
        canonicalAnchor('ws-1', 'disp-1'),
      ]),
    });
    recordNotificationPlatformDispatchIntegrityFailure('integrity-check-failed');
    const projection = buildNotificationPlatformDispatchContinuityProjection({
      recovering: false,
      ownerReadiness: 'ready',
      continuity: getNotificationPlatformDispatchContinuityRecord(),
    });
    expect(projection.operationalState).toBe('Degraded');
    expect(projection.operationalState).not.toBe('Ready');
  });

  it('graceful degradation: healthy platform dispatch continues while other owners degraded', () => {
    expect(
      notificationPlatformDispatchContinuesWhileOthersDegraded({
        notificationPlatformDispatchState: 'Ready',
        otherOwnerStates: ['Degraded', 'Unavailable'],
      }),
    ).toBe(true);
    expect(
      notificationPlatformDispatchContinuesWhileOthersDegraded({
        notificationPlatformDispatchState: 'Unavailable',
        otherOwnerStates: ['Ready'],
      }),
    ).toBe(false);
  });

  it('projection exposes canonical anchor counts from recovery diagnostics', () => {
    recordNotificationPlatformDispatchRecoveryStart();
    recordNotificationPlatformDispatchRecoverySuccess({
      diagnostics: buildNotificationPlatformDispatchRecoveryDiagnostics([
        canonicalAnchor('ws-1', 'disp-1'),
      ]),
    });
    const projection = buildNotificationPlatformDispatchContinuityProjection({
      recovering: false,
      ownerReadiness: 'ready',
      continuity: getNotificationPlatformDispatchContinuityRecord(),
    });
    expect(projection.operationalState).toBe('Ready');
    expect(projection.canonicalAnchorCount).toBe(1);
    expect(projection.integrityVerified).toBe(true);
  });
});
