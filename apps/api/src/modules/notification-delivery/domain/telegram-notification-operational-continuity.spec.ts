import { beforeEach, describe, expect, it } from 'vitest';
import { buildTelegramNotificationAnchorState } from './durable-telegram-notification-anchor';
import {
  getTelegramNotificationContinuityRecord,
  recordTelegramNotificationIntegrityFailure,
  recordTelegramNotificationRecoveryFailure,
  recordTelegramNotificationRecoveryStart,
  recordTelegramNotificationRecoverySuccess,
  resetTelegramNotificationContinuity,
} from './telegram-notification-continuity-status';
import {
  buildTelegramNotificationContinuityProjection,
  evaluateTelegramNotificationOperationalState,
  telegramNotificationContinuesWhileOthersDegraded,
} from './telegram-notification-operational-continuity';
import { buildTelegramNotificationRecoveryDiagnostics } from './telegram-notification-restart-recovery';

const recordedAt = '2026-08-28T16:00:00.000Z';

function canonicalAnchor(workspaceId: string, notificationId: string) {
  const outcome = buildTelegramNotificationAnchorState({
    workspaceId,
    notificationId,
    notificationChannel: 'telegram',
    notificationType: 'report-complete',
    recipientIdentifier: 'chat:123',
    templateIdentifier: 'inline:report-complete',
    correlationId: 'corr-1',
    actorId: 'actor-1',
    recordedAt,
    prior: null,
  });
  if (!outcome.ok) throw new Error('expected canonical anchor');
  return outcome.anchor;
}

describe('telegram-notification-operational-continuity domain — W5-N01-d', () => {
  beforeEach(() => {
    resetTelegramNotificationContinuity();
  });

  it('integrity failure → Degraded; recovery failure → Unavailable; healthy recovery → Ready', () => {
    recordTelegramNotificationRecoveryStart();
    recordTelegramNotificationRecoverySuccess({
      diagnostics: buildTelegramNotificationRecoveryDiagnostics([canonicalAnchor('ws-1', 'ntf-1')]),
    });
    recordTelegramNotificationIntegrityFailure('integrity-check-failed');
    expect(
      evaluateTelegramNotificationOperationalState({
        recovering: false,
        ownerReadiness: 'ready',
        continuity: getTelegramNotificationContinuityRecord(),
      }),
    ).toBe('Degraded');

    recordTelegramNotificationRecoveryFailure({ reason: 'corrupt' });
    expect(
      evaluateTelegramNotificationOperationalState({
        recovering: false,
        ownerReadiness: 'ready',
        continuity: getTelegramNotificationContinuityRecord(),
      }),
    ).toBe('Unavailable');

    resetTelegramNotificationContinuity();
    recordTelegramNotificationRecoveryStart();
    recordTelegramNotificationRecoverySuccess({
      diagnostics: buildTelegramNotificationRecoveryDiagnostics([]),
    });
    expect(
      evaluateTelegramNotificationOperationalState({
        recovering: false,
        ownerReadiness: 'ready',
        continuity: getTelegramNotificationContinuityRecord(),
      }),
    ).toBe('Ready');
  });

  it('never fabricates Ready without continuity record', () => {
    expect(
      evaluateTelegramNotificationOperationalState({
        recovering: false,
        ownerReadiness: 'ready',
        continuity: null,
      }),
    ).toBe('Unavailable');
  });

  it('Degraded never fabricates Ready', () => {
    recordTelegramNotificationRecoveryStart();
    recordTelegramNotificationRecoverySuccess({
      diagnostics: buildTelegramNotificationRecoveryDiagnostics([canonicalAnchor('ws-1', 'ntf-1')]),
    });
    recordTelegramNotificationIntegrityFailure('integrity-check-failed');
    const projection = buildTelegramNotificationContinuityProjection({
      recovering: false,
      ownerReadiness: 'ready',
      continuity: getTelegramNotificationContinuityRecord(),
    });
    expect(projection.operationalState).toBe('Degraded');
    expect(projection.operationalState).not.toBe('Ready');
  });

  it('graceful degradation: healthy telegram notification continues while other owners degraded', () => {
    expect(
      telegramNotificationContinuesWhileOthersDegraded({
        telegramNotificationState: 'Ready',
        otherOwnerStates: ['Degraded', 'Unavailable'],
      }),
    ).toBe(true);
    expect(
      telegramNotificationContinuesWhileOthersDegraded({
        telegramNotificationState: 'Unavailable',
        otherOwnerStates: ['Ready'],
      }),
    ).toBe(false);
  });

  it('projection exposes canonical anchor counts from recovery diagnostics', () => {
    recordTelegramNotificationRecoveryStart();
    recordTelegramNotificationRecoverySuccess({
      diagnostics: buildTelegramNotificationRecoveryDiagnostics([canonicalAnchor('ws-1', 'ntf-1')]),
    });
    const projection = buildTelegramNotificationContinuityProjection({
      recovering: false,
      ownerReadiness: 'ready',
      continuity: getTelegramNotificationContinuityRecord(),
    });
    expect(projection.operationalState).toBe('Ready');
    expect(projection.canonicalAnchorCount).toBe(1);
    expect(projection.integrityVerified).toBe(true);
  });
});
