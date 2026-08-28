import { beforeEach, describe, expect, it } from 'vitest';
import {
  buildBybitExchangeConnectivityContinuityProjection,
  evaluateBybitExchangeConnectivityOperationalState,
  bybitExchangeConnectivityContinuesWhileOthersDegraded,
} from './bybit-exchange-connectivity-operational-continuity';
import {
  getBybitExchangeConnectivityContinuityRecord,
  recordBybitExchangeConnectivityIntegrityFailure,
  recordBybitExchangeConnectivityRecoveryFailure,
  recordBybitExchangeConnectivityRecoveryStart,
  recordBybitExchangeConnectivityRecoverySuccess,
  resetBybitExchangeConnectivityContinuity,
} from './bybit-exchange-connectivity-continuity-status';
import { buildBybitConnectionManagementAnchorState } from './durable-bybit-exchange-connectivity-state';
import { buildBybitExchangeConnectivityRecoveryDiagnostics } from './bybit-exchange-connectivity-restart-recovery';

const recordedAt = '2026-08-28T13:00:00.000Z';

function connectionAnchor(workspaceId: string) {
  const outcome = buildBybitConnectionManagementAnchorState({
    workspaceId,
    connectionId: 'conn-42',
    actorId: 'actor-1',
    recordedAt,
    prior: null,
  });
  if (!outcome.ok) throw new Error('expected connection anchor');
  return outcome.state;
}

describe('bybit-exchange-connectivity-operational-continuity domain — W4-E02-d', () => {
  beforeEach(() => {
    resetBybitExchangeConnectivityContinuity();
  });

  it('integrity failure → Degraded; recovery failure → Unavailable; healthy recovery → Ready', () => {
    recordBybitExchangeConnectivityRecoveryStart();
    recordBybitExchangeConnectivityRecoverySuccess({
      diagnostics: buildBybitExchangeConnectivityRecoveryDiagnostics([connectionAnchor('ws-1')]),
    });
    recordBybitExchangeConnectivityIntegrityFailure('integrity-check-failed');
    expect(
      evaluateBybitExchangeConnectivityOperationalState({
        recovering: false,
        ownerReadiness: 'ready',
        continuity: getBybitExchangeConnectivityContinuityRecord(),
      }),
    ).toBe('Degraded');

    recordBybitExchangeConnectivityRecoveryFailure({ reason: 'corrupt' });
    expect(
      evaluateBybitExchangeConnectivityOperationalState({
        recovering: false,
        ownerReadiness: 'ready',
        continuity: getBybitExchangeConnectivityContinuityRecord(),
      }),
    ).toBe('Unavailable');

    resetBybitExchangeConnectivityContinuity();
    recordBybitExchangeConnectivityRecoveryStart();
    recordBybitExchangeConnectivityRecoverySuccess({
      diagnostics: buildBybitExchangeConnectivityRecoveryDiagnostics([]),
    });
    expect(
      evaluateBybitExchangeConnectivityOperationalState({
        recovering: false,
        ownerReadiness: 'ready',
        continuity: getBybitExchangeConnectivityContinuityRecord(),
      }),
    ).toBe('Ready');
  });

  it('never fabricates Ready without continuity record', () => {
    expect(
      evaluateBybitExchangeConnectivityOperationalState({
        recovering: false,
        ownerReadiness: 'ready',
        continuity: null,
      }),
    ).toBe('Unavailable');
  });

  it('graceful degradation: healthy Bybit exchange connectivity continues while other owners degraded', () => {
    expect(
      bybitExchangeConnectivityContinuesWhileOthersDegraded({
        bybitExchangeConnectivityState: 'Ready',
        otherOwnerStates: ['Degraded', 'Unavailable'],
      }),
    ).toBe(true);
    expect(
      bybitExchangeConnectivityContinuesWhileOthersDegraded({
        bybitExchangeConnectivityState: 'Unavailable',
        otherOwnerStates: ['Ready'],
      }),
    ).toBe(false);
  });

  it('projection exposes anchor counts from recovery diagnostics', () => {
    recordBybitExchangeConnectivityRecoveryStart();
    recordBybitExchangeConnectivityRecoverySuccess({
      diagnostics: buildBybitExchangeConnectivityRecoveryDiagnostics([connectionAnchor('ws-1')]),
    });
    const projection = buildBybitExchangeConnectivityContinuityProjection({
      recovering: false,
      ownerReadiness: 'ready',
      continuity: getBybitExchangeConnectivityContinuityRecord(),
    });
    expect(projection.operationalState).toBe('Ready');
    expect(projection.connectionAnchorCount).toBe(1);
    expect(projection.integrityVerified).toBe(true);
  });
});
