import { beforeEach, describe, expect, it } from 'vitest';
import { buildPushNotificationAnchorState } from './durable-push-notification-anchor';
import {
  getPushNotificationContinuityRecord,
  recordPushNotificationIntegrityFailure,
  recordPushNotificationRecoveryFailure,
  recordPushNotificationRecoveryStart,
  recordPushNotificationRecoverySuccess,
  resetPushNotificationContinuity,
} from './push-notification-continuity-status';
import {
  buildPushNotificationContinuityProjection,
  evaluatePushNotificationOperationalState,
  pushNotificationContinuesWhileOthersDegraded,
} from './push-notification-operational-continuity';
import { buildPushNotificationRecoveryDiagnostics } from './push-notification-restart-recovery';

const recordedAt = '2026-08-29T17:00:00.000Z';

function canonicalAnchor(workspaceId: string, notificationId: string) {
  const outcome = buildPushNotificationAnchorState({
    workspaceId,
    notificationId,
    notificationChannel: 'push',
    notificationType: 'report-complete',
    recipientIdentifier: 'device-ref-1',
    templateIdentifier: 'inline:report-complete',
    correlationId: 'corr-1',
    actorId: 'actor-1',
    recordedAt,
    prior: null,
  });
  if (!outcome.ok) throw new Error('expected canonical anchor');
  return outcome.anchor;
}

describe('push-notification-operational-continuity domain — W5-N04-d', () => {
  beforeEach(() => {
    resetPushNotificationContinuity();
  });

  it('integrity failure → Degraded; recovery failure → Unavailable; healthy recovery → Ready', () => {
    recordPushNotificationRecoveryStart();
    recordPushNotificationRecoverySuccess({
      diagnostics: buildPushNotificationRecoveryDiagnostics([canonicalAnchor('ws-1', 'ntf-1')]),
    });
    recordPushNotificationIntegrityFailure('integrity-check-failed');
    expect(
      evaluatePushNotificationOperationalState({
        recovering: false,
        ownerReadiness: 'ready',
        continuity: getPushNotificationContinuityRecord(),
      }),
    ).toBe('Degraded');

    recordPushNotificationRecoveryFailure({ reason: 'corrupt' });
    expect(
      evaluatePushNotificationOperationalState({
        recovering: false,
        ownerReadiness: 'ready',
        continuity: getPushNotificationContinuityRecord(),
      }),
    ).toBe('Unavailable');

    resetPushNotificationContinuity();
    recordPushNotificationRecoveryStart();
    recordPushNotificationRecoverySuccess({
      diagnostics: buildPushNotificationRecoveryDiagnostics([]),
    });
    expect(
      evaluatePushNotificationOperationalState({
        recovering: false,
        ownerReadiness: 'ready',
        continuity: getPushNotificationContinuityRecord(),
      }),
    ).toBe('Ready');
  });

  it('never fabricates Ready without continuity record', () => {
    expect(
      evaluatePushNotificationOperationalState({
        recovering: false,
        ownerReadiness: 'ready',
        continuity: null,
      }),
    ).toBe('Unavailable');
  });

  it('Degraded never fabricates Ready', () => {
    recordPushNotificationRecoveryStart();
    recordPushNotificationRecoverySuccess({
      diagnostics: buildPushNotificationRecoveryDiagnostics([canonicalAnchor('ws-1', 'ntf-1')]),
    });
    recordPushNotificationIntegrityFailure('integrity-check-failed');
    const projection = buildPushNotificationContinuityProjection({
      recovering: false,
      ownerReadiness: 'ready',
      continuity: getPushNotificationContinuityRecord(),
    });
    expect(projection.operationalState).toBe('Degraded');
    expect(projection.operationalState).not.toBe('Ready');
  });

  it('graceful degradation: healthy Push notification continues while other owners degraded', () => {
    expect(
      pushNotificationContinuesWhileOthersDegraded({
        pushNotificationState: 'Ready',
        otherOwnerStates: ['Degraded', 'Unavailable'],
      }),
    ).toBe(true);
    expect(
      pushNotificationContinuesWhileOthersDegraded({
        pushNotificationState: 'Unavailable',
        otherOwnerStates: ['Ready'],
      }),
    ).toBe(false);
  });

  it('projection exposes canonical anchor counts from recovery diagnostics', () => {
    recordPushNotificationRecoveryStart();
    recordPushNotificationRecoverySuccess({
      diagnostics: buildPushNotificationRecoveryDiagnostics([canonicalAnchor('ws-1', 'ntf-1')]),
    });
    const projection = buildPushNotificationContinuityProjection({
      recovering: false,
      ownerReadiness: 'ready',
      continuity: getPushNotificationContinuityRecord(),
    });
    expect(projection.operationalState).toBe('Ready');
    expect(projection.canonicalAnchorCount).toBe(1);
    expect(projection.integrityVerified).toBe(true);
  });
});
