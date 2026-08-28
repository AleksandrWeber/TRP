import { beforeEach, describe, expect, it } from 'vitest';
import {
  buildKrakenExchangeConnectivityContinuityProjection,
  evaluateKrakenExchangeConnectivityOperationalState,
  krakenExchangeConnectivityContinuesWhileOthersDegraded,
} from './kraken-exchange-connectivity-operational-continuity';
import {
  getKrakenExchangeConnectivityContinuityRecord,
  recordKrakenExchangeConnectivityIntegrityFailure,
  recordKrakenExchangeConnectivityRecoveryFailure,
  recordKrakenExchangeConnectivityRecoveryStart,
  recordKrakenExchangeConnectivityRecoverySuccess,
  resetKrakenExchangeConnectivityContinuity,
} from './kraken-exchange-connectivity-continuity-status';
import { buildKrakenConnectionManagementAnchorState } from './durable-kraken-exchange-connectivity-state';
import { buildKrakenExchangeConnectivityRecoveryDiagnostics } from './kraken-exchange-connectivity-restart-recovery';

const recordedAt = '2026-08-28T13:00:00.000Z';

function connectionAnchor(workspaceId: string) {
  const outcome = buildKrakenConnectionManagementAnchorState({
    workspaceId,
    connectionId: 'conn-42',
    actorId: 'actor-1',
    recordedAt,
    prior: null,
  });
  if (!outcome.ok) throw new Error('expected connection anchor');
  return outcome.state;
}

describe('kraken-exchange-connectivity-operational-continuity domain — W4-E04-d', () => {
  beforeEach(() => {
    resetKrakenExchangeConnectivityContinuity();
  });

  it('integrity failure → Degraded; recovery failure → Unavailable; healthy recovery → Ready', () => {
    recordKrakenExchangeConnectivityRecoveryStart();
    recordKrakenExchangeConnectivityRecoverySuccess({
      diagnostics: buildKrakenExchangeConnectivityRecoveryDiagnostics([connectionAnchor('ws-1')]),
    });
    recordKrakenExchangeConnectivityIntegrityFailure('integrity-check-failed');
    expect(
      evaluateKrakenExchangeConnectivityOperationalState({
        recovering: false,
        ownerReadiness: 'ready',
        continuity: getKrakenExchangeConnectivityContinuityRecord(),
      }),
    ).toBe('Degraded');

    recordKrakenExchangeConnectivityRecoveryFailure({ reason: 'corrupt' });
    expect(
      evaluateKrakenExchangeConnectivityOperationalState({
        recovering: false,
        ownerReadiness: 'ready',
        continuity: getKrakenExchangeConnectivityContinuityRecord(),
      }),
    ).toBe('Unavailable');

    resetKrakenExchangeConnectivityContinuity();
    recordKrakenExchangeConnectivityRecoveryStart();
    recordKrakenExchangeConnectivityRecoverySuccess({
      diagnostics: buildKrakenExchangeConnectivityRecoveryDiagnostics([]),
    });
    expect(
      evaluateKrakenExchangeConnectivityOperationalState({
        recovering: false,
        ownerReadiness: 'ready',
        continuity: getKrakenExchangeConnectivityContinuityRecord(),
      }),
    ).toBe('Ready');
  });

  it('never fabricates Ready without continuity record', () => {
    expect(
      evaluateKrakenExchangeConnectivityOperationalState({
        recovering: false,
        ownerReadiness: 'ready',
        continuity: null,
      }),
    ).toBe('Unavailable');
  });

  it('graceful degradation: healthy Kraken exchange connectivity continues while other owners degraded', () => {
    expect(
      krakenExchangeConnectivityContinuesWhileOthersDegraded({
        krakenExchangeConnectivityState: 'Ready',
        otherOwnerStates: ['Degraded', 'Unavailable'],
      }),
    ).toBe(true);
    expect(
      krakenExchangeConnectivityContinuesWhileOthersDegraded({
        krakenExchangeConnectivityState: 'Unavailable',
        otherOwnerStates: ['Ready'],
      }),
    ).toBe(false);
  });

  it('projection exposes anchor counts from recovery diagnostics', () => {
    recordKrakenExchangeConnectivityRecoveryStart();
    recordKrakenExchangeConnectivityRecoverySuccess({
      diagnostics: buildKrakenExchangeConnectivityRecoveryDiagnostics([connectionAnchor('ws-1')]),
    });
    const projection = buildKrakenExchangeConnectivityContinuityProjection({
      recovering: false,
      ownerReadiness: 'ready',
      continuity: getKrakenExchangeConnectivityContinuityRecord(),
    });
    expect(projection.operationalState).toBe('Ready');
    expect(projection.connectionAnchorCount).toBe(1);
    expect(projection.integrityVerified).toBe(true);
  });
});
