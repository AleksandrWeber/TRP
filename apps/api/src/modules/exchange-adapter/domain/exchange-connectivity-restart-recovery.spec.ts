import { describe, expect, it } from 'vitest';
import {
  buildConnectionManagementAnchorState,
  EXCHANGE_CONNECTIVITY_STATE_SCHEMA_VERSION,
} from './durable-exchange-connectivity-state';
import {
  ExchangeConnectivityRestartRecoveryError,
  prepareExchangeConnectivityStatesForRecovery,
  sortExchangeConnectivityStatesDeterministically,
} from './exchange-connectivity-restart-recovery';

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

describe('exchange-connectivity-restart-recovery domain — W4-E01-c', () => {
  it('sortExchangeConnectivityStatesDeterministically orders by workspaceId ascending', () => {
    const wsB = connectionAnchor('ws-b');
    const wsA = connectionAnchor('ws-a');
    const ordered = sortExchangeConnectivityStatesDeterministically([wsB, wsA]);
    expect(ordered.map((s) => s.workspaceId)).toEqual(['ws-a', 'ws-b']);
  });

  it('prepareExchangeConnectivityStatesForRecovery rejects partial connection anchor', () => {
    const bad = Object.freeze({
      ...connectionAnchor('ws-1'),
      connectionAnchorRecordedAt: null,
    });
    expect(() => prepareExchangeConnectivityStatesForRecovery([bad])).toThrow(
      ExchangeConnectivityRestartRecoveryError,
    );
  });

  it('prepareExchangeConnectivityStatesForRecovery rejects duplicate workspaceId', () => {
    const state = connectionAnchor('ws-1');
    expect(() => prepareExchangeConnectivityStatesForRecovery([state, state])).toThrow(
      ExchangeConnectivityRestartRecoveryError,
    );
  });

  it('prepareExchangeConnectivityStatesForRecovery rejects unsupported schema version', () => {
    const bad = Object.freeze({
      ...connectionAnchor('ws-1'),
      schemaVersion: EXCHANGE_CONNECTIVITY_STATE_SCHEMA_VERSION + 1,
    });
    expect(() => prepareExchangeConnectivityStatesForRecovery([bad])).toThrow(
      ExchangeConnectivityRestartRecoveryError,
    );
  });

  it('prepareExchangeConnectivityStatesForRecovery returns empty for empty input', () => {
    expect(prepareExchangeConnectivityStatesForRecovery([])).toEqual([]);
  });
});
