import { describe, expect, it } from 'vitest';
import {
  buildOkxConnectionManagementAnchorState,
  OKX_EXCHANGE_CONNECTIVITY_STATE_SCHEMA_VERSION,
} from './durable-okx-exchange-connectivity-state';
import {
  OkxExchangeConnectivityRestartRecoveryError,
  prepareOkxExchangeConnectivityStatesForRecovery,
  sortOkxExchangeConnectivityStatesDeterministically,
} from './okx-exchange-connectivity-restart-recovery';

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

describe('okx-exchange-connectivity-restart-recovery domain — W4-E03-c', () => {
  it('sortOkxExchangeConnectivityStatesDeterministically orders by workspaceId ascending', () => {
    const wsB = connectionAnchor('ws-b');
    const wsA = connectionAnchor('ws-a');
    const ordered = sortOkxExchangeConnectivityStatesDeterministically([wsB, wsA]);
    expect(ordered.map((s) => s.workspaceId)).toEqual(['ws-a', 'ws-b']);
  });

  it('prepareOkxExchangeConnectivityStatesForRecovery rejects partial connection anchor', () => {
    const bad = Object.freeze({
      ...connectionAnchor('ws-1'),
      connectionAnchorRecordedAt: null,
    });
    expect(() => prepareOkxExchangeConnectivityStatesForRecovery([bad])).toThrow(
      OkxExchangeConnectivityRestartRecoveryError,
    );
  });

  it('prepareOkxExchangeConnectivityStatesForRecovery rejects duplicate workspaceId', () => {
    const state = connectionAnchor('ws-1');
    expect(() => prepareOkxExchangeConnectivityStatesForRecovery([state, state])).toThrow(
      OkxExchangeConnectivityRestartRecoveryError,
    );
  });

  it('prepareOkxExchangeConnectivityStatesForRecovery rejects unsupported schema version', () => {
    const bad = Object.freeze({
      ...connectionAnchor('ws-1'),
      schemaVersion: OKX_EXCHANGE_CONNECTIVITY_STATE_SCHEMA_VERSION + 1,
    });
    expect(() => prepareOkxExchangeConnectivityStatesForRecovery([bad])).toThrow(
      OkxExchangeConnectivityRestartRecoveryError,
    );
  });

  it('prepareOkxExchangeConnectivityStatesForRecovery returns empty for empty input', () => {
    expect(prepareOkxExchangeConnectivityStatesForRecovery([])).toEqual([]);
  });
});
