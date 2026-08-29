import { beforeEach, describe, expect, it } from 'vitest';
import { buildNotificationPlatformIntegrationAnchorState } from './durable-notification-platform-integration-anchor';
import {
  getNotificationPlatformIntegrationContinuityRecord,
  recordNotificationPlatformIntegrationIntegrityFailure,
  recordNotificationPlatformIntegrationRecoveryFailure,
  recordNotificationPlatformIntegrationRecoveryStart,
  recordNotificationPlatformIntegrationRecoverySuccess,
  resetNotificationPlatformIntegrationContinuity,
} from './notification-platform-integration-continuity-status';
import {
  buildNotificationPlatformIntegrationContinuityProjection,
  evaluateNotificationPlatformIntegrationOperationalState,
  notificationPlatformIntegrationContinuesWhileOthersDegraded,
} from './notification-platform-integration-operational-continuity';
import { buildNotificationPlatformIntegrationRecoveryDiagnostics } from './notification-platform-integration-restart-recovery';

const recordedAt = '2026-08-29T18:00:00.000Z';

function canonicalAnchor(workspaceId: string, integrationAnchorId: string) {
  const outcome = buildNotificationPlatformIntegrationAnchorState({
    workspaceId,
    integrationAnchorId,
    platformIntegrationType: 'unified-platform-integration',
    correlationId: 'corr-1',
    actorId: 'actor-1',
    recordedAt,
    prior: null,
  });
  if (!outcome.ok) throw new Error('expected canonical anchor');
  return outcome.anchor;
}

describe('notification-platform-integration-operational-continuity domain — W5-N05-d', () => {
  beforeEach(() => {
    resetNotificationPlatformIntegrationContinuity();
  });

  it('integrity failure → Degraded; recovery failure → Unavailable; healthy recovery → Ready', () => {
    recordNotificationPlatformIntegrationRecoveryStart();
    recordNotificationPlatformIntegrationRecoverySuccess({
      diagnostics: buildNotificationPlatformIntegrationRecoveryDiagnostics([
        canonicalAnchor('ws-1', 'int-1'),
      ]),
    });
    recordNotificationPlatformIntegrationIntegrityFailure('integrity-check-failed');
    expect(
      evaluateNotificationPlatformIntegrationOperationalState({
        recovering: false,
        ownerReadiness: 'ready',
        continuity: getNotificationPlatformIntegrationContinuityRecord(),
      }),
    ).toBe('Degraded');

    recordNotificationPlatformIntegrationRecoveryFailure({ reason: 'corrupt' });
    expect(
      evaluateNotificationPlatformIntegrationOperationalState({
        recovering: false,
        ownerReadiness: 'ready',
        continuity: getNotificationPlatformIntegrationContinuityRecord(),
      }),
    ).toBe('Unavailable');

    resetNotificationPlatformIntegrationContinuity();
    recordNotificationPlatformIntegrationRecoveryStart();
    recordNotificationPlatformIntegrationRecoverySuccess({
      diagnostics: buildNotificationPlatformIntegrationRecoveryDiagnostics([]),
    });
    expect(
      evaluateNotificationPlatformIntegrationOperationalState({
        recovering: false,
        ownerReadiness: 'ready',
        continuity: getNotificationPlatformIntegrationContinuityRecord(),
      }),
    ).toBe('Ready');
  });

  it('never fabricates Ready without continuity record', () => {
    expect(
      evaluateNotificationPlatformIntegrationOperationalState({
        recovering: false,
        ownerReadiness: 'ready',
        continuity: null,
      }),
    ).toBe('Unavailable');
  });

  it('Degraded never fabricates Ready', () => {
    recordNotificationPlatformIntegrationRecoveryStart();
    recordNotificationPlatformIntegrationRecoverySuccess({
      diagnostics: buildNotificationPlatformIntegrationRecoveryDiagnostics([
        canonicalAnchor('ws-1', 'int-1'),
      ]),
    });
    recordNotificationPlatformIntegrationIntegrityFailure('integrity-check-failed');
    const projection = buildNotificationPlatformIntegrationContinuityProjection({
      recovering: false,
      ownerReadiness: 'ready',
      continuity: getNotificationPlatformIntegrationContinuityRecord(),
    });
    expect(projection.operationalState).toBe('Degraded');
    expect(projection.operationalState).not.toBe('Ready');
  });

  it('graceful degradation: healthy platform integration continues while other owners degraded', () => {
    expect(
      notificationPlatformIntegrationContinuesWhileOthersDegraded({
        notificationPlatformIntegrationState: 'Ready',
        otherOwnerStates: ['Degraded', 'Unavailable'],
      }),
    ).toBe(true);
    expect(
      notificationPlatformIntegrationContinuesWhileOthersDegraded({
        notificationPlatformIntegrationState: 'Unavailable',
        otherOwnerStates: ['Ready'],
      }),
    ).toBe(false);
  });

  it('projection exposes canonical anchor counts from recovery diagnostics', () => {
    recordNotificationPlatformIntegrationRecoveryStart();
    recordNotificationPlatformIntegrationRecoverySuccess({
      diagnostics: buildNotificationPlatformIntegrationRecoveryDiagnostics([
        canonicalAnchor('ws-1', 'int-1'),
      ]),
    });
    const projection = buildNotificationPlatformIntegrationContinuityProjection({
      recovering: false,
      ownerReadiness: 'ready',
      continuity: getNotificationPlatformIntegrationContinuityRecord(),
    });
    expect(projection.operationalState).toBe('Ready');
    expect(projection.canonicalAnchorCount).toBe(1);
    expect(projection.integrityVerified).toBe(true);
  });
});
