import { describe, expect, it } from 'vitest';
import {
  buildKrakenConnectionManagementAnchorState,
  KRAKEN_EXCHANGE_CONNECTIVITY_STATE_SCHEMA_VERSION,
} from './durable-kraken-exchange-connectivity-state';
import {
  KrakenExchangeConnectivityRestartRecoveryError,
  prepareKrakenExchangeConnectivityStatesForRecovery,
  sortKrakenExchangeConnectivityStatesDeterministically,
} from './kraken-exchange-connectivity-restart-recovery';

const recordedAt = '2026-08-28T16:00:00.000Z';

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

describe('kraken-exchange-connectivity-restart-recovery domain — W4-E04-c', () => {
  it('sortKrakenExchangeConnectivityStatesDeterministically orders by workspaceId ascending', () => {
    const wsB = connectionAnchor('ws-b');
    const wsA = connectionAnchor('ws-a');
    const ordered = sortKrakenExchangeConnectivityStatesDeterministically([wsB, wsA]);
    expect(ordered.map((s) => s.workspaceId)).toEqual(['ws-a', 'ws-b']);
  });

  it('prepareKrakenExchangeConnectivityStatesForRecovery rejects partial connection anchor', () => {
    const bad = Object.freeze({
      ...connectionAnchor('ws-1'),
      connectionAnchorRecordedAt: null,
    });
    expect(() => prepareKrakenExchangeConnectivityStatesForRecovery([bad])).toThrow(
      KrakenExchangeConnectivityRestartRecoveryError,
    );
  });

  it('prepareKrakenExchangeConnectivityStatesForRecovery rejects duplicate workspaceId', () => {
    const state = connectionAnchor('ws-1');
    expect(() => prepareKrakenExchangeConnectivityStatesForRecovery([state, state])).toThrow(
      KrakenExchangeConnectivityRestartRecoveryError,
    );
  });

  it('prepareKrakenExchangeConnectivityStatesForRecovery rejects unsupported schema version', () => {
    const bad = Object.freeze({
      ...connectionAnchor('ws-1'),
      schemaVersion: KRAKEN_EXCHANGE_CONNECTIVITY_STATE_SCHEMA_VERSION + 1,
    });
    expect(() => prepareKrakenExchangeConnectivityStatesForRecovery([bad])).toThrow(
      KrakenExchangeConnectivityRestartRecoveryError,
    );
  });

  it('prepareKrakenExchangeConnectivityStatesForRecovery returns empty for empty input', () => {
    expect(prepareKrakenExchangeConnectivityStatesForRecovery([])).toEqual([]);
  });
});
