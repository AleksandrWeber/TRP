import { beforeEach, describe, expect, it } from 'vitest';
import {
  recordKillSwitchIntegrityFailure,
  recordKillSwitchRecoveryFailure,
  recordKillSwitchRecoveryStart,
  recordKillSwitchRecoverySuccess,
  resetKillSwitchContinuity,
} from './kill-switch-continuity-status';
import { buildArmedKillSwitchState } from './durable-kill-switch-state';
import { buildKillSwitchRecoveryDiagnostics } from './kill-switch-restart-recovery';
import {
  buildKillSwitchContinuityProjection,
  evaluateKillSwitchOperationalState,
  killSwitchContinuesWhileOthersDegraded,
} from './kill-switch-operational-continuity';

const recordedAt = '2026-08-27T18:00:00.000Z';

function armed(workspaceId: string) {
  const outcome = buildArmedKillSwitchState({
    workspaceId,
    actorId: 'actor-1',
    reason: 'halt',
    recordedAt,
    prior: null,
  });
  if (!outcome.ok) throw new Error('expected armed');
  return outcome.state;
}

describe('kill-switch-operational-continuity — W3-O04-d', () => {
  beforeEach(() => {
    resetKillSwitchContinuity();
  });

  it('derives Recovering / Ready / Degraded / Unavailable only', () => {
    expect(
      evaluateKillSwitchOperationalState({
        recovering: true,
        ownerReadiness: 'ready',
        continuity: null,
      }),
    ).toBe('Recovering');

    expect(
      evaluateKillSwitchOperationalState({
        recovering: false,
        ownerReadiness: 'unavailable',
        continuity: null,
      }),
    ).toBe('Unavailable');

    expect(
      evaluateKillSwitchOperationalState({
        recovering: false,
        ownerReadiness: 'degraded',
        continuity: null,
      }),
    ).toBe('Degraded');

    recordKillSwitchRecoveryStart();
    recordKillSwitchRecoverySuccess({
      diagnostics: buildKillSwitchRecoveryDiagnostics([]),
    });
    expect(
      evaluateKillSwitchOperationalState({
        recovering: false,
        ownerReadiness: 'ready',
        continuity: {
          owner: 'trading-session',
          outcome: 'ready',
          ownerReadiness: 'ready',
          integrityVerified: true,
          integrityFailure: false,
          diagnostics: buildKillSwitchRecoveryDiagnostics([]),
          recoveryStartedAt: '2026-08-27T19:00:00.000Z',
          recoveryCompletedAt: '2026-08-27T19:00:01.000Z',
          recoveryDurationMs: 1000,
        },
      }),
    ).toBe('Ready');
  });

  it('integrity failure → Degraded; recovery failure → Unavailable', () => {
    recordKillSwitchRecoveryStart();
    recordKillSwitchRecoverySuccess({
      diagnostics: buildKillSwitchRecoveryDiagnostics([armed('ws-1')]),
    });
    recordKillSwitchIntegrityFailure('integrity-check-failed');
    const projection = buildKillSwitchContinuityProjection({
      recovering: false,
      ownerReadiness: 'ready',
      continuity: {
        owner: 'trading-session',
        outcome: 'ready',
        ownerReadiness: 'ready',
        integrityVerified: false,
        integrityFailure: true,
        reason: 'integrity-check-failed',
        diagnostics: buildKillSwitchRecoveryDiagnostics([armed('ws-1')]),
        recoveryStartedAt: '2026-08-27T19:00:00.000Z',
        recoveryCompletedAt: '2026-08-27T19:00:01.000Z',
        recoveryDurationMs: 1000,
      },
    });
    expect(projection.operationalState).toBe('Degraded');
    expect(projection.armedCount).toBe(1);

    recordKillSwitchRecoveryFailure({ reason: 'corrupt' });
    expect(
      evaluateKillSwitchOperationalState({
        recovering: false,
        ownerReadiness: 'ready',
        continuity: {
          owner: 'trading-session',
          outcome: 'unavailable',
          ownerReadiness: 'unavailable',
          integrityVerified: false,
          integrityFailure: false,
          reason: 'corrupt',
          diagnostics: null,
          recoveryStartedAt: '2026-08-27T19:00:00.000Z',
          recoveryCompletedAt: '2026-08-27T19:00:01.000Z',
          recoveryDurationMs: 1000,
        },
      }),
    ).toBe('Unavailable');
  });

  it('never fabricates Ready without continuity record', () => {
    expect(
      evaluateKillSwitchOperationalState({
        recovering: false,
        ownerReadiness: 'ready',
        continuity: null,
      }),
    ).toBe('Unavailable');
  });

  it('healthy kill switch continues while other owners are degraded', () => {
    expect(
      killSwitchContinuesWhileOthersDegraded({
        killSwitchState: 'Ready',
        otherOwnerStates: ['Degraded', 'Ready'],
      }),
    ).toBe(true);
    expect(
      killSwitchContinuesWhileOthersDegraded({
        killSwitchState: 'Unavailable',
        otherOwnerStates: ['Ready'],
      }),
    ).toBe(false);
  });
});
