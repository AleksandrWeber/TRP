import { beforeEach, describe, expect, it } from 'vitest';
import { buildNotificationPlatformDeadLetterAnchorState } from './durable-notification-platform-dead-letter-anchor';
import {
  getNotificationPlatformDeadLetterContinuityRecord,
  recordNotificationPlatformDeadLetterIntegrityFailure,
  recordNotificationPlatformDeadLetterRecoveryFailure,
  recordNotificationPlatformDeadLetterRecoveryStart,
  recordNotificationPlatformDeadLetterRecoverySuccess,
  resetNotificationPlatformDeadLetterContinuity,
} from './notification-platform-dead-letter-continuity-status';
import {
  buildNotificationPlatformDeadLetterContinuityProjection,
  evaluateNotificationPlatformDeadLetterOperationalState,
  notificationPlatformDeadLetterContinuesWhileOthersDegraded,
} from './notification-platform-dead-letter-operational-continuity';
import { buildNotificationPlatformDeadLetterRecoveryDiagnostics } from './notification-platform-dead-letter-restart-recovery';

const recordedAt = '2026-09-02T16:00:00.000Z';

function canonicalAnchor(workspaceId: string, deadLetterAnchorId: string) {
  const outcome = buildNotificationPlatformDeadLetterAnchorState({
    workspaceId,
    deadLetterAnchorId,
    platformDeadLetterType: 'unified-platform-dead-letter',
    correlationId: 'corr-1',
    actorId: 'actor-1',
    recordedAt,
    prior: null,
  });
  if (!outcome.ok) throw new Error('expected canonical anchor');
  return outcome.anchor;
}

describe('notification-platform-dead-letter-operational-continuity domain — W5-N14-d', () => {
  beforeEach(() => {
    resetNotificationPlatformDeadLetterContinuity();
  });

  it('integrity failure → Degraded; recovery failure → Unavailable; healthy recovery → Ready', () => {
    recordNotificationPlatformDeadLetterRecoveryStart();
    recordNotificationPlatformDeadLetterRecoverySuccess({
      diagnostics: buildNotificationPlatformDeadLetterRecoveryDiagnostics([
        canonicalAnchor('ws-1', 'dead-letter-1'),
      ]),
    });
    recordNotificationPlatformDeadLetterIntegrityFailure('integrity-check-failed');
    expect(
      evaluateNotificationPlatformDeadLetterOperationalState({
        recovering: false,
        ownerReadiness: 'ready',
        continuity: getNotificationPlatformDeadLetterContinuityRecord(),
      }),
    ).toBe('Degraded');

    recordNotificationPlatformDeadLetterRecoveryFailure({ reason: 'corrupt' });
    expect(
      evaluateNotificationPlatformDeadLetterOperationalState({
        recovering: false,
        ownerReadiness: 'ready',
        continuity: getNotificationPlatformDeadLetterContinuityRecord(),
      }),
    ).toBe('Unavailable');

    resetNotificationPlatformDeadLetterContinuity();
    recordNotificationPlatformDeadLetterRecoveryStart();
    recordNotificationPlatformDeadLetterRecoverySuccess({
      diagnostics: buildNotificationPlatformDeadLetterRecoveryDiagnostics([]),
    });
    expect(
      evaluateNotificationPlatformDeadLetterOperationalState({
        recovering: false,
        ownerReadiness: 'ready',
        continuity: getNotificationPlatformDeadLetterContinuityRecord(),
      }),
    ).toBe('Ready');
  });

  it('never fabricates Ready without continuity record', () => {
    expect(
      evaluateNotificationPlatformDeadLetterOperationalState({
        recovering: false,
        ownerReadiness: 'ready',
        continuity: null,
      }),
    ).toBe('Unavailable');
  });

  it('Degraded never fabricates Ready', () => {
    recordNotificationPlatformDeadLetterRecoveryStart();
    recordNotificationPlatformDeadLetterRecoverySuccess({
      diagnostics: buildNotificationPlatformDeadLetterRecoveryDiagnostics([
        canonicalAnchor('ws-1', 'dead-letter-1'),
      ]),
    });
    recordNotificationPlatformDeadLetterIntegrityFailure('integrity-check-failed');
    const projection = buildNotificationPlatformDeadLetterContinuityProjection({
      recovering: false,
      ownerReadiness: 'ready',
      continuity: getNotificationPlatformDeadLetterContinuityRecord(),
    });
    expect(projection.operationalState).toBe('Degraded');
    expect(projection.operationalState).not.toBe('Ready');
  });

  it('graceful degradation: healthy platform dead letter continues while other owners degraded', () => {
    expect(
      notificationPlatformDeadLetterContinuesWhileOthersDegraded({
        notificationPlatformDeadLetterState: 'Ready',
        otherOwnerStates: ['Degraded', 'Unavailable'],
      }),
    ).toBe(true);
    expect(
      notificationPlatformDeadLetterContinuesWhileOthersDegraded({
        notificationPlatformDeadLetterState: 'Unavailable',
        otherOwnerStates: ['Ready'],
      }),
    ).toBe(false);
  });

  it('projection exposes canonical anchor counts from recovery diagnostics', () => {
    recordNotificationPlatformDeadLetterRecoveryStart();
    recordNotificationPlatformDeadLetterRecoverySuccess({
      diagnostics: buildNotificationPlatformDeadLetterRecoveryDiagnostics([
        canonicalAnchor('ws-1', 'dead-letter-1'),
      ]),
    });
    const projection = buildNotificationPlatformDeadLetterContinuityProjection({
      recovering: false,
      ownerReadiness: 'ready',
      continuity: getNotificationPlatformDeadLetterContinuityRecord(),
    });
    expect(projection.operationalState).toBe('Ready');
    expect(projection.canonicalAnchorCount).toBe(1);
    expect(projection.integrityVerified).toBe(true);
  });
});
