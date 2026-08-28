import { beforeEach, describe, expect, it } from 'vitest';
import {
  buildExchangeConnectivityContinuityProjection,
  evaluateExchangeConnectivityOperationalState,
  exchangeConnectivityContinuesWhileOthersDegraded,
} from './exchange-connectivity-operational-continuity';
import {
  getExchangeConnectivityContinuityRecord,
  recordExchangeConnectivityIntegrityFailure,
  recordExchangeConnectivityRecoveryFailure,
  recordExchangeConnectivityRecoveryStart,
  recordExchangeConnectivityRecoverySuccess,
  resetExchangeConnectivityContinuity,
} from './exchange-connectivity-continuity-status';
import { buildConnectionManagementAnchorState } from './durable-exchange-connectivity-state';
import { buildExchangeConnectivityRecoveryDiagnostics } from './exchange-connectivity-restart-recovery';

const recordedAt = '2026-08-28T12:00:00.000Z';

function connectionAnchor(workspaceId: string) {
  const outcome = buildConnectionManagementAnchorState({
    workspaceId,
    provider: 'BINANCE',
    connectionId: 'conn-42',
    actorId: 'actor-1',
    recordedAt,
    prior: null,
  });
  if (!outcome.ok) throw new Error('expected connection anchor');
  return outcome.state;
}

describe('exchange-connectivity-operational-continuity domain — W4-E01-d', () => {
  beforeEach(() => {
    resetExchangeConnectivityContinuity();
  });

  it('integrity failure → Degraded; recovery failure → Unavailable; healthy recovery → Ready', () => {
    recordExchangeConnectivityRecoveryStart();
    recordExchangeConnectivityRecoverySuccess({
      diagnostics: buildExchangeConnectivityRecoveryDiagnostics([connectionAnchor('ws-1')]),
    });
    recordExchangeConnectivityIntegrityFailure('integrity-check-failed');
    expect(
      evaluateExchangeConnectivityOperationalState({
        recovering: false,
        ownerReadiness: 'ready',
        continuity: getExchangeConnectivityContinuityRecord(),
      }),
    ).toBe('Degraded');

    recordExchangeConnectivityRecoveryFailure({ reason: 'corrupt' });
    expect(
      evaluateExchangeConnectivityOperationalState({
        recovering: false,
        ownerReadiness: 'ready',
        continuity: getExchangeConnectivityContinuityRecord(),
      }),
    ).toBe('Unavailable');

    resetExchangeConnectivityContinuity();
    recordExchangeConnectivityRecoveryStart();
    recordExchangeConnectivityRecoverySuccess({
      diagnostics: buildExchangeConnectivityRecoveryDiagnostics([]),
    });
    expect(
      evaluateExchangeConnectivityOperationalState({
        recovering: false,
        ownerReadiness: 'ready',
        continuity: getExchangeConnectivityContinuityRecord(),
      }),
    ).toBe('Ready');
  });

  it('never fabricates Ready without continuity record', () => {
    expect(
      evaluateExchangeConnectivityOperationalState({
        recovering: false,
        ownerReadiness: 'ready',
        continuity: null,
      }),
    ).toBe('Unavailable');
  });

  it('graceful degradation: healthy exchange connectivity continues while other owners degraded', () => {
    expect(
      exchangeConnectivityContinuesWhileOthersDegraded({
        exchangeConnectivityState: 'Ready',
        otherOwnerStates: ['Degraded', 'Unavailable'],
      }),
    ).toBe(true);
    expect(
      exchangeConnectivityContinuesWhileOthersDegraded({
        exchangeConnectivityState: 'Unavailable',
        otherOwnerStates: ['Ready'],
      }),
    ).toBe(false);
  });

  it('projection exposes anchor counts from recovery diagnostics', () => {
    recordExchangeConnectivityRecoveryStart();
    recordExchangeConnectivityRecoverySuccess({
      diagnostics: buildExchangeConnectivityRecoveryDiagnostics([connectionAnchor('ws-1')]),
    });
    const projection = buildExchangeConnectivityContinuityProjection({
      recovering: false,
      ownerReadiness: 'ready',
      continuity: getExchangeConnectivityContinuityRecord(),
    });
    expect(projection.operationalState).toBe('Ready');
    expect(projection.connectionAnchorCount).toBe(1);
    expect(projection.integrityVerified).toBe(true);
  });
});
