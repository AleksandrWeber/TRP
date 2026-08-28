import { beforeEach, describe, expect, it } from 'vitest';
import { buildSecurityHealthAnchorState } from './durable-monitoring-health-state';
import {
  recordMonitoringHealthIntegrityFailure,
  recordMonitoringHealthRecoveryFailure,
  recordMonitoringHealthRecoveryStart,
  recordMonitoringHealthRecoverySuccess,
  resetMonitoringHealthContinuity,
} from './monitoring-health-continuity-status';
import { buildMonitoringHealthRecoveryDiagnostics } from './monitoring-health-restart-recovery';
import {
  buildMonitoringHealthContinuityProjection,
  evaluateMonitoringHealthOperationalState,
  monitoringHealthContinuesWhileOthersDegraded,
} from './monitoring-health-operational-continuity';

const recordedAt = '2026-08-28T10:00:00.000Z';

function securityAnchor(workspaceId: string) {
  const outcome = buildSecurityHealthAnchorState({
    workspaceId,
    incidentId: 'inc-1',
    actorId: 'actor-1',
    recordedAt,
    prior: null,
  });
  if (!outcome.ok) throw new Error('expected security anchor');
  return outcome.state;
}

describe('monitoring-health-operational-continuity — W3-O05-d', () => {
  beforeEach(() => {
    resetMonitoringHealthContinuity();
  });

  it('derives Recovering / Ready / Degraded / Unavailable only', () => {
    expect(
      evaluateMonitoringHealthOperationalState({
        recovering: true,
        ownerReadiness: 'ready',
        continuity: null,
      }),
    ).toBe('Recovering');

    expect(
      evaluateMonitoringHealthOperationalState({
        recovering: false,
        ownerReadiness: 'unavailable',
        continuity: null,
      }),
    ).toBe('Unavailable');

    expect(
      evaluateMonitoringHealthOperationalState({
        recovering: false,
        ownerReadiness: 'degraded',
        continuity: null,
      }),
    ).toBe('Degraded');

    recordMonitoringHealthRecoveryStart();
    recordMonitoringHealthRecoverySuccess({
      diagnostics: buildMonitoringHealthRecoveryDiagnostics([]),
    });
    expect(
      evaluateMonitoringHealthOperationalState({
        recovering: false,
        ownerReadiness: 'ready',
        continuity: {
          owner: 'security-platform',
          outcome: 'ready',
          ownerReadiness: 'ready',
          integrityVerified: true,
          integrityFailure: false,
          diagnostics: buildMonitoringHealthRecoveryDiagnostics([]),
          recoveryStartedAt: '2026-08-28T10:00:00.000Z',
          recoveryCompletedAt: '2026-08-28T10:00:01.000Z',
          recoveryDurationMs: 1000,
        },
      }),
    ).toBe('Ready');
  });

  it('integrity failure → Degraded; recovery failure → Unavailable', () => {
    recordMonitoringHealthRecoveryStart();
    recordMonitoringHealthRecoverySuccess({
      diagnostics: buildMonitoringHealthRecoveryDiagnostics([securityAnchor('ws-1')]),
    });
    recordMonitoringHealthIntegrityFailure('integrity-check-failed');
    const projection = buildMonitoringHealthContinuityProjection({
      recovering: false,
      ownerReadiness: 'ready',
      continuity: {
        owner: 'security-platform',
        outcome: 'ready',
        ownerReadiness: 'ready',
        integrityVerified: false,
        integrityFailure: true,
        reason: 'integrity-check-failed',
        diagnostics: buildMonitoringHealthRecoveryDiagnostics([securityAnchor('ws-1')]),
        recoveryStartedAt: '2026-08-28T10:00:00.000Z',
        recoveryCompletedAt: '2026-08-28T10:00:01.000Z',
        recoveryDurationMs: 1000,
      },
    });
    expect(projection.operationalState).toBe('Degraded');
    expect(projection.securityHealthAnchorCount).toBe(1);

    recordMonitoringHealthRecoveryFailure({ reason: 'corrupt' });
    expect(
      evaluateMonitoringHealthOperationalState({
        recovering: false,
        ownerReadiness: 'ready',
        continuity: {
          owner: 'security-platform',
          outcome: 'unavailable',
          ownerReadiness: 'unavailable',
          integrityVerified: false,
          integrityFailure: false,
          reason: 'corrupt',
          diagnostics: null,
          recoveryStartedAt: '2026-08-28T10:00:00.000Z',
          recoveryCompletedAt: '2026-08-28T10:00:01.000Z',
          recoveryDurationMs: 1000,
        },
      }),
    ).toBe('Unavailable');
  });

  it('never fabricates Ready without continuity record', () => {
    expect(
      evaluateMonitoringHealthOperationalState({
        recovering: false,
        ownerReadiness: 'ready',
        continuity: null,
      }),
    ).toBe('Unavailable');
  });

  it('healthy monitoring health continues while other owners are degraded', () => {
    expect(
      monitoringHealthContinuesWhileOthersDegraded({
        monitoringHealthState: 'Ready',
        otherOwnerStates: ['Degraded', 'Ready'],
      }),
    ).toBe(true);
    expect(
      monitoringHealthContinuesWhileOthersDegraded({
        monitoringHealthState: 'Unavailable',
        otherOwnerStates: ['Ready'],
      }),
    ).toBe(false);
  });
});
