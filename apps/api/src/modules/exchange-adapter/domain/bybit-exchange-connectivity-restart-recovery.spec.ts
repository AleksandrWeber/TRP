import { describe, expect, it } from 'vitest';
import {
  buildBybitConnectionManagementAnchorState,
  BYBIT_EXCHANGE_CONNECTIVITY_STATE_SCHEMA_VERSION,
} from './durable-bybit-exchange-connectivity-state';
import {
  BybitExchangeConnectivityRestartRecoveryError,
  prepareBybitExchangeConnectivityStatesForRecovery,
  sortBybitExchangeConnectivityStatesDeterministically,
} from './bybit-exchange-connectivity-restart-recovery';

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

describe('bybit-exchange-connectivity-restart-recovery domain — W4-E02-c', () => {
  it('sortBybitExchangeConnectivityStatesDeterministically orders by workspaceId ascending', () => {
    const wsB = connectionAnchor('ws-b');
    const wsA = connectionAnchor('ws-a');
    const ordered = sortBybitExchangeConnectivityStatesDeterministically([wsB, wsA]);
    expect(ordered.map((s) => s.workspaceId)).toEqual(['ws-a', 'ws-b']);
  });

  it('prepareBybitExchangeConnectivityStatesForRecovery rejects partial connection anchor', () => {
    const bad = Object.freeze({
      ...connectionAnchor('ws-1'),
      connectionAnchorRecordedAt: null,
    });
    expect(() => prepareBybitExchangeConnectivityStatesForRecovery([bad])).toThrow(
      BybitExchangeConnectivityRestartRecoveryError,
    );
  });

  it('prepareBybitExchangeConnectivityStatesForRecovery rejects duplicate workspaceId', () => {
    const state = connectionAnchor('ws-1');
    expect(() => prepareBybitExchangeConnectivityStatesForRecovery([state, state])).toThrow(
      BybitExchangeConnectivityRestartRecoveryError,
    );
  });

  it('prepareBybitExchangeConnectivityStatesForRecovery rejects unsupported schema version', () => {
    const bad = Object.freeze({
      ...connectionAnchor('ws-1'),
      schemaVersion: BYBIT_EXCHANGE_CONNECTIVITY_STATE_SCHEMA_VERSION + 1,
    });
    expect(() => prepareBybitExchangeConnectivityStatesForRecovery([bad])).toThrow(
      BybitExchangeConnectivityRestartRecoveryError,
    );
  });

  it('prepareBybitExchangeConnectivityStatesForRecovery returns empty for empty input', () => {
    expect(prepareBybitExchangeConnectivityStatesForRecovery([])).toEqual([]);
  });
});
