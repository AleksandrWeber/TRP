import { describe, expect, it } from 'vitest';
import {
  BYBIT_EXCHANGE_CONNECTIVITY_EXCHANGE_IDENTIFIER,
  buildBybitAdapterLayerAnchorState,
  buildBybitConnectionManagementAnchorState,
} from './durable-bybit-exchange-connectivity-state';

const recordedAt = '2026-08-28T13:00:00.000Z';

describe('durable-bybit-exchange-connectivity-state — W4-E02-b', () => {
  it('buildBybitConnectionManagementAnchorState stores explicit connection anchor only', () => {
    const outcome = buildBybitConnectionManagementAnchorState({
      workspaceId: 'ws-bybit',
      connectionId: 'conn-bybit-1',
      actorId: 'actor-1',
      recordedAt,
      prior: null,
    });

    expect(outcome.ok).toBe(true);
    if (!outcome.ok) {
      return;
    }

    expect(outcome.state).toMatchObject({
      workspaceId: 'ws-bybit',
      exchangeIdentifier: BYBIT_EXCHANGE_CONNECTIVITY_EXCHANGE_IDENTIFIER,
      connectionAnchorConnectionId: 'conn-bybit-1',
    });
    expect(outcome.state).not.toHaveProperty('connected');
  });

  it('buildBybitAdapterLayerAnchorState stores explicit adapter anchor only', () => {
    const connectionOutcome = buildBybitConnectionManagementAnchorState({
      workspaceId: 'ws-bybit',
      connectionId: 'conn-bybit-1',
      actorId: 'actor-1',
      recordedAt,
      prior: null,
    });
    expect(connectionOutcome.ok).toBe(true);
    if (!connectionOutcome.ok) {
      return;
    }

    const outcome = buildBybitAdapterLayerAnchorState({
      workspaceId: 'ws-bybit',
      exchangeConnectionId: 'ex-conn-bybit-1',
      actorId: 'actor-2',
      recordedAt: '2026-08-28T13:05:00.000Z',
      prior: connectionOutcome.state,
    });

    expect(outcome.ok).toBe(true);
    if (!outcome.ok) {
      return;
    }

    expect(outcome.state).toMatchObject({
      connectionAnchorConnectionId: 'conn-bybit-1',
      adapterAnchorExchangeConnectionId: 'ex-conn-bybit-1',
      exchangeIdentifier: BYBIT_EXCHANGE_CONNECTIVITY_EXCHANGE_IDENTIFIER,
    });
  });

  it('rejects workspace mismatch', () => {
    const priorOutcome = buildBybitConnectionManagementAnchorState({
      workspaceId: 'ws-a',
      connectionId: 'conn-1',
      actorId: 'actor-1',
      recordedAt,
      prior: null,
    });
    expect(priorOutcome.ok).toBe(true);
    if (!priorOutcome.ok) {
      return;
    }

    const outcome = buildBybitAdapterLayerAnchorState({
      workspaceId: 'ws-b',
      exchangeConnectionId: 'ex-conn-1',
      actorId: 'actor-2',
      recordedAt,
      prior: priorOutcome.state,
    });

    expect(outcome.ok).toBe(false);
    if (outcome.ok) {
      return;
    }
    expect(outcome.reason).toBe('workspace_mismatch');
  });
});
