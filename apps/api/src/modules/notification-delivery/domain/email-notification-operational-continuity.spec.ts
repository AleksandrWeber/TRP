import { beforeEach, describe, expect, it } from 'vitest';
import { buildEmailNotificationAnchorState } from './durable-email-notification-anchor';
import {
  getEmailNotificationContinuityRecord,
  recordEmailNotificationIntegrityFailure,
  recordEmailNotificationRecoveryFailure,
  recordEmailNotificationRecoveryStart,
  recordEmailNotificationRecoverySuccess,
  resetEmailNotificationContinuity,
} from './email-notification-continuity-status';
import {
  buildEmailNotificationContinuityProjection,
  evaluateEmailNotificationOperationalState,
  emailNotificationContinuesWhileOthersDegraded,
} from './email-notification-operational-continuity';
import { buildEmailNotificationRecoveryDiagnostics } from './email-notification-restart-recovery';

const recordedAt = '2026-08-28T17:00:00.000Z';

function canonicalAnchor(workspaceId: string, notificationId: string) {
  const outcome = buildEmailNotificationAnchorState({
    workspaceId,
    notificationId,
    notificationChannel: 'email',
    notificationType: 'report-complete',
    recipientIdentifier: 'user@example.com',
    templateIdentifier: 'inline:report-complete',
    correlationId: 'corr-1',
    actorId: 'actor-1',
    recordedAt,
    prior: null,
  });
  if (!outcome.ok) throw new Error('expected canonical anchor');
  return outcome.anchor;
}

describe('email-notification-operational-continuity domain — W5-N02-d', () => {
  beforeEach(() => {
    resetEmailNotificationContinuity();
  });

  it('integrity failure → Degraded; recovery failure → Unavailable; healthy recovery → Ready', () => {
    recordEmailNotificationRecoveryStart();
    recordEmailNotificationRecoverySuccess({
      diagnostics: buildEmailNotificationRecoveryDiagnostics([canonicalAnchor('ws-1', 'ntf-1')]),
    });
    recordEmailNotificationIntegrityFailure('integrity-check-failed');
    expect(
      evaluateEmailNotificationOperationalState({
        recovering: false,
        ownerReadiness: 'ready',
        continuity: getEmailNotificationContinuityRecord(),
      }),
    ).toBe('Degraded');

    recordEmailNotificationRecoveryFailure({ reason: 'corrupt' });
    expect(
      evaluateEmailNotificationOperationalState({
        recovering: false,
        ownerReadiness: 'ready',
        continuity: getEmailNotificationContinuityRecord(),
      }),
    ).toBe('Unavailable');

    resetEmailNotificationContinuity();
    recordEmailNotificationRecoveryStart();
    recordEmailNotificationRecoverySuccess({
      diagnostics: buildEmailNotificationRecoveryDiagnostics([]),
    });
    expect(
      evaluateEmailNotificationOperationalState({
        recovering: false,
        ownerReadiness: 'ready',
        continuity: getEmailNotificationContinuityRecord(),
      }),
    ).toBe('Ready');
  });

  it('never fabricates Ready without continuity record', () => {
    expect(
      evaluateEmailNotificationOperationalState({
        recovering: false,
        ownerReadiness: 'ready',
        continuity: null,
      }),
    ).toBe('Unavailable');
  });

  it('Degraded never fabricates Ready', () => {
    recordEmailNotificationRecoveryStart();
    recordEmailNotificationRecoverySuccess({
      diagnostics: buildEmailNotificationRecoveryDiagnostics([canonicalAnchor('ws-1', 'ntf-1')]),
    });
    recordEmailNotificationIntegrityFailure('integrity-check-failed');
    const projection = buildEmailNotificationContinuityProjection({
      recovering: false,
      ownerReadiness: 'ready',
      continuity: getEmailNotificationContinuityRecord(),
    });
    expect(projection.operationalState).toBe('Degraded');
    expect(projection.operationalState).not.toBe('Ready');
  });

  it('graceful degradation: healthy email notification continues while other owners degraded', () => {
    expect(
      emailNotificationContinuesWhileOthersDegraded({
        emailNotificationState: 'Ready',
        otherOwnerStates: ['Degraded', 'Unavailable'],
      }),
    ).toBe(true);
    expect(
      emailNotificationContinuesWhileOthersDegraded({
        emailNotificationState: 'Unavailable',
        otherOwnerStates: ['Ready'],
      }),
    ).toBe(false);
  });

  it('projection exposes canonical anchor counts from recovery diagnostics', () => {
    recordEmailNotificationRecoveryStart();
    recordEmailNotificationRecoverySuccess({
      diagnostics: buildEmailNotificationRecoveryDiagnostics([canonicalAnchor('ws-1', 'ntf-1')]),
    });
    const projection = buildEmailNotificationContinuityProjection({
      recovering: false,
      ownerReadiness: 'ready',
      continuity: getEmailNotificationContinuityRecord(),
    });
    expect(projection.operationalState).toBe('Ready');
    expect(projection.canonicalAnchorCount).toBe(1);
    expect(projection.integrityVerified).toBe(true);
  });
});
