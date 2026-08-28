import { beforeEach, describe, expect, it } from 'vitest';
import {
  buildOkxExchangeConnectivityContinuityProjection,
  evaluateOkxExchangeConnectivityOperationalState,
  okxExchangeConnectivityContinuesWhileOthersDegraded,
} from './okx-exchange-connectivity-operational-continuity';
import {
  getOkxExchangeConnectivityContinuityRecord,
  recordOkxExchangeConnectivityIntegrityFailure,
  recordOkxExchangeConnectivityRecoveryFailure,
  recordOkxExchangeConnectivityRecoveryStart,
  recordOkxExchangeConnectivityRecoverySuccess,
  resetOkxExchangeConnectivityContinuity,
} from './okx-exchange-connectivity-continuity-status';
import { buildOkxConnectionManagementAnchorState } from './durable-okx-exchange-connectivity-state';
import { buildOkxExchangeConnectivityRecoveryDiagnostics } from './okx-exchange-connectivity-restart-recovery';

const recordedAt = '2026-08-28T13:00:00.000Z';

function connectionAnchor(workspaceId: string) {
  const outcome = buildOkxConnectionManagementAnchorState({
    workspaceId,
    connectionId: 'conn-42',
    actorId: 'actor-1',
    recordedAt,
    prior: null,
  });
  if (!outcome.ok) throw new Error('expected connection anchor');
  return outcome.state;
}

describe('okx-exchange-connectivity-operational-continuity domain — W4-E03-d', () => {
  beforeEach(() => {
    resetOkxExchangeConnectivityContinuity();
  });

  it('integrity failure → Degraded; recovery failure → Unavailable; healthy recovery → Ready', () => {
    recordOkxExchangeConnectivityRecoveryStart();
    recordOkxExchangeConnectivityRecoverySuccess({
      diagnostics: buildOkxExchangeConnectivityRecoveryDiagnostics([connectionAnchor('ws-1')]),
    });
    recordOkxExchangeConnectivityIntegrityFailure('integrity-check-failed');
    expect(
      evaluateOkxExchangeConnectivityOperationalState({
        recovering: false,
        ownerReadiness: 'ready',
        continuity: getOkxExchangeConnectivityContinuityRecord(),
      }),
    ).toBe('Degraded');

    recordOkxExchangeConnectivityRecoveryFailure({ reason: 'corrupt' });
    expect(
      evaluateOkxExchangeConnectivityOperationalState({
        recovering: false,
        ownerReadiness: 'ready',
        continuity: getOkxExchangeConnectivityContinuityRecord(),
      }),
    ).toBe('Unavailable');

    resetOkxExchangeConnectivityContinuity();
    recordOkxExchangeConnectivityRecoveryStart();
    recordOkxExchangeConnectivityRecoverySuccess({
      diagnostics: buildOkxExchangeConnectivityRecoveryDiagnostics([]),
    });
    expect(
      evaluateOkxExchangeConnectivityOperationalState({
        recovering: false,
        ownerReadiness: 'ready',
        continuity: getOkxExchangeConnectivityContinuityRecord(),
      }),
    ).toBe('Ready');
  });

  it('never fabricates Ready without continuity record', () => {
    expect(
      evaluateOkxExchangeConnectivityOperationalState({
        recovering: false,
        ownerReadiness: 'ready',
        continuity: null,
      }),
    ).toBe('Unavailable');
  });

  it('graceful degradation: healthy OKX exchange connectivity continues while other owners degraded', () => {
    expect(
      okxExchangeConnectivityContinuesWhileOthersDegraded({
        okxExchangeConnectivityState: 'Ready',
        otherOwnerStates: ['Degraded', 'Unavailable'],
      }),
    ).toBe(true);
    expect(
      okxExchangeConnectivityContinuesWhileOthersDegraded({
        okxExchangeConnectivityState: 'Unavailable',
        otherOwnerStates: ['Ready'],
      }),
    ).toBe(false);
  });

  it('projection exposes anchor counts from recovery diagnostics', () => {
    recordOkxExchangeConnectivityRecoveryStart();
    recordOkxExchangeConnectivityRecoverySuccess({
      diagnostics: buildOkxExchangeConnectivityRecoveryDiagnostics([connectionAnchor('ws-1')]),
    });
    const projection = buildOkxExchangeConnectivityContinuityProjection({
      recovering: false,
      ownerReadiness: 'ready',
      continuity: getOkxExchangeConnectivityContinuityRecord(),
    });
    expect(projection.operationalState).toBe('Ready');
    expect(projection.connectionAnchorCount).toBe(1);
    expect(projection.integrityVerified).toBe(true);
  });
});
