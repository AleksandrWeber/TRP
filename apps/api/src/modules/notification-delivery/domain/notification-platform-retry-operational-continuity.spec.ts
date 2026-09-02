import { beforeEach, describe, expect, it } from 'vitest';
import { buildNotificationPlatformRetryAnchorState } from './durable-notification-platform-retry-anchor';
import {
  getNotificationPlatformRetryContinuityRecord,
  recordNotificationPlatformRetryIntegrityFailure,
  recordNotificationPlatformRetryRecoveryFailure,
  recordNotificationPlatformRetryRecoveryStart,
  recordNotificationPlatformRetryRecoverySuccess,
  resetNotificationPlatformRetryContinuity,
} from './notification-platform-retry-continuity-status';
import {
  buildNotificationPlatformRetryContinuityProjection,
  evaluateNotificationPlatformRetryOperationalState,
  notificationPlatformRetryContinuesWhileOthersDegraded,
} from './notification-platform-retry-operational-continuity';
import { buildNotificationPlatformRetryRecoveryDiagnostics } from './notification-platform-retry-restart-recovery';

const recordedAt = '2026-09-02T16:00:00.000Z';

function canonicalAnchor(workspaceId: string, retryAnchorId: string) {
  const outcome = buildNotificationPlatformRetryAnchorState({
    workspaceId,
    retryAnchorId,
    platformRetryType: 'unified-platform-retry',
    correlationId: 'corr-1',
    actorId: 'actor-1',
    recordedAt,
    prior: null,
  });
  if (!outcome.ok) throw new Error('expected canonical anchor');
  return outcome.anchor;
}

describe('notification-platform-retry-operational-continuity domain — W5-N13-d', () => {
  beforeEach(() => {
    resetNotificationPlatformRetryContinuity();
  });

  it('integrity failure → Degraded; recovery failure → Unavailable; healthy recovery → Ready', () => {
    recordNotificationPlatformRetryRecoveryStart();
    recordNotificationPlatformRetryRecoverySuccess({
      diagnostics: buildNotificationPlatformRetryRecoveryDiagnostics([
        canonicalAnchor('ws-1', 'retry-1'),
      ]),
    });
    recordNotificationPlatformRetryIntegrityFailure('integrity-check-failed');
    expect(
      evaluateNotificationPlatformRetryOperationalState({
        recovering: false,
        ownerReadiness: 'ready',
        continuity: getNotificationPlatformRetryContinuityRecord(),
      }),
    ).toBe('Degraded');

    recordNotificationPlatformRetryRecoveryFailure({ reason: 'corrupt' });
    expect(
      evaluateNotificationPlatformRetryOperationalState({
        recovering: false,
        ownerReadiness: 'ready',
        continuity: getNotificationPlatformRetryContinuityRecord(),
      }),
    ).toBe('Unavailable');

    resetNotificationPlatformRetryContinuity();
    recordNotificationPlatformRetryRecoveryStart();
    recordNotificationPlatformRetryRecoverySuccess({
      diagnostics: buildNotificationPlatformRetryRecoveryDiagnostics([]),
    });
    expect(
      evaluateNotificationPlatformRetryOperationalState({
        recovering: false,
        ownerReadiness: 'ready',
        continuity: getNotificationPlatformRetryContinuityRecord(),
      }),
    ).toBe('Ready');
  });

  it('never fabricates Ready without continuity record', () => {
    expect(
      evaluateNotificationPlatformRetryOperationalState({
        recovering: false,
        ownerReadiness: 'ready',
        continuity: null,
      }),
    ).toBe('Unavailable');
  });

  it('Degraded never fabricates Ready', () => {
    recordNotificationPlatformRetryRecoveryStart();
    recordNotificationPlatformRetryRecoverySuccess({
      diagnostics: buildNotificationPlatformRetryRecoveryDiagnostics([
        canonicalAnchor('ws-1', 'retry-1'),
      ]),
    });
    recordNotificationPlatformRetryIntegrityFailure('integrity-check-failed');
    const projection = buildNotificationPlatformRetryContinuityProjection({
      recovering: false,
      ownerReadiness: 'ready',
      continuity: getNotificationPlatformRetryContinuityRecord(),
    });
    expect(projection.operationalState).toBe('Degraded');
    expect(projection.operationalState).not.toBe('Ready');
  });

  it('graceful degradation: healthy platform retry continues while other owners degraded', () => {
    expect(
      notificationPlatformRetryContinuesWhileOthersDegraded({
        notificationPlatformRetryState: 'Ready',
        otherOwnerStates: ['Degraded', 'Unavailable'],
      }),
    ).toBe(true);
    expect(
      notificationPlatformRetryContinuesWhileOthersDegraded({
        notificationPlatformRetryState: 'Unavailable',
        otherOwnerStates: ['Ready'],
      }),
    ).toBe(false);
  });

  it('projection exposes canonical anchor counts from recovery diagnostics', () => {
    recordNotificationPlatformRetryRecoveryStart();
    recordNotificationPlatformRetryRecoverySuccess({
      diagnostics: buildNotificationPlatformRetryRecoveryDiagnostics([
        canonicalAnchor('ws-1', 'retry-1'),
      ]),
    });
    const projection = buildNotificationPlatformRetryContinuityProjection({
      recovering: false,
      ownerReadiness: 'ready',
      continuity: getNotificationPlatformRetryContinuityRecord(),
    });
    expect(projection.operationalState).toBe('Ready');
    expect(projection.canonicalAnchorCount).toBe(1);
    expect(projection.integrityVerified).toBe(true);
  });
});
