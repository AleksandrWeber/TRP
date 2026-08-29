import { beforeEach, describe, expect, it } from 'vitest';
import { buildNotificationPlatformDeliveryAnchorState } from './durable-notification-platform-delivery-anchor';
import {
  getNotificationPlatformDeliveryContinuityRecord,
  recordNotificationPlatformDeliveryIntegrityFailure,
  recordNotificationPlatformDeliveryRecoveryFailure,
  recordNotificationPlatformDeliveryRecoveryStart,
  recordNotificationPlatformDeliveryRecoverySuccess,
  resetNotificationPlatformDeliveryContinuity,
} from './notification-platform-delivery-continuity-status';
import {
  buildNotificationPlatformDeliveryContinuityProjection,
  evaluateNotificationPlatformDeliveryOperationalState,
  notificationPlatformDeliveryContinuesWhileOthersDegraded,
} from './notification-platform-delivery-operational-continuity';
import { buildNotificationPlatformDeliveryRecoveryDiagnostics } from './notification-platform-delivery-restart-recovery';

const recordedAt = '2026-08-29T19:00:00.000Z';

function canonicalAnchor(workspaceId: string, deliveryAnchorId: string) {
  const outcome = buildNotificationPlatformDeliveryAnchorState({
    workspaceId,
    deliveryAnchorId,
    platformDeliveryType: 'unified-platform-delivery',
    correlationId: 'corr-1',
    actorId: 'actor-1',
    recordedAt,
    prior: null,
  });
  if (!outcome.ok) throw new Error('expected canonical anchor');
  return outcome.anchor;
}

describe('notification-platform-delivery-operational-continuity domain — W5-N06-d', () => {
  beforeEach(() => {
    resetNotificationPlatformDeliveryContinuity();
  });

  it('integrity failure → Degraded; recovery failure → Unavailable; healthy recovery → Ready', () => {
    recordNotificationPlatformDeliveryRecoveryStart();
    recordNotificationPlatformDeliveryRecoverySuccess({
      diagnostics: buildNotificationPlatformDeliveryRecoveryDiagnostics([
        canonicalAnchor('ws-1', 'del-1'),
      ]),
    });
    recordNotificationPlatformDeliveryIntegrityFailure('integrity-check-failed');
    expect(
      evaluateNotificationPlatformDeliveryOperationalState({
        recovering: false,
        ownerReadiness: 'ready',
        continuity: getNotificationPlatformDeliveryContinuityRecord(),
      }),
    ).toBe('Degraded');

    recordNotificationPlatformDeliveryRecoveryFailure({ reason: 'corrupt' });
    expect(
      evaluateNotificationPlatformDeliveryOperationalState({
        recovering: false,
        ownerReadiness: 'ready',
        continuity: getNotificationPlatformDeliveryContinuityRecord(),
      }),
    ).toBe('Unavailable');

    resetNotificationPlatformDeliveryContinuity();
    recordNotificationPlatformDeliveryRecoveryStart();
    recordNotificationPlatformDeliveryRecoverySuccess({
      diagnostics: buildNotificationPlatformDeliveryRecoveryDiagnostics([]),
    });
    expect(
      evaluateNotificationPlatformDeliveryOperationalState({
        recovering: false,
        ownerReadiness: 'ready',
        continuity: getNotificationPlatformDeliveryContinuityRecord(),
      }),
    ).toBe('Ready');
  });

  it('never fabricates Ready without continuity record', () => {
    expect(
      evaluateNotificationPlatformDeliveryOperationalState({
        recovering: false,
        ownerReadiness: 'ready',
        continuity: null,
      }),
    ).toBe('Unavailable');
  });

  it('Degraded never fabricates Ready', () => {
    recordNotificationPlatformDeliveryRecoveryStart();
    recordNotificationPlatformDeliveryRecoverySuccess({
      diagnostics: buildNotificationPlatformDeliveryRecoveryDiagnostics([
        canonicalAnchor('ws-1', 'del-1'),
      ]),
    });
    recordNotificationPlatformDeliveryIntegrityFailure('integrity-check-failed');
    const projection = buildNotificationPlatformDeliveryContinuityProjection({
      recovering: false,
      ownerReadiness: 'ready',
      continuity: getNotificationPlatformDeliveryContinuityRecord(),
    });
    expect(projection.operationalState).toBe('Degraded');
    expect(projection.operationalState).not.toBe('Ready');
  });

  it('graceful degradation: healthy platform delivery continues while other owners degraded', () => {
    expect(
      notificationPlatformDeliveryContinuesWhileOthersDegraded({
        notificationPlatformDeliveryState: 'Ready',
        otherOwnerStates: ['Degraded', 'Unavailable'],
      }),
    ).toBe(true);
    expect(
      notificationPlatformDeliveryContinuesWhileOthersDegraded({
        notificationPlatformDeliveryState: 'Unavailable',
        otherOwnerStates: ['Ready'],
      }),
    ).toBe(false);
  });

  it('projection exposes canonical anchor counts from recovery diagnostics', () => {
    recordNotificationPlatformDeliveryRecoveryStart();
    recordNotificationPlatformDeliveryRecoverySuccess({
      diagnostics: buildNotificationPlatformDeliveryRecoveryDiagnostics([
        canonicalAnchor('ws-1', 'del-1'),
      ]),
    });
    const projection = buildNotificationPlatformDeliveryContinuityProjection({
      recovering: false,
      ownerReadiness: 'ready',
      continuity: getNotificationPlatformDeliveryContinuityRecord(),
    });
    expect(projection.operationalState).toBe('Ready');
    expect(projection.canonicalAnchorCount).toBe(1);
    expect(projection.integrityVerified).toBe(true);
  });
});
