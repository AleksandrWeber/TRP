import { describe, expect, it } from 'vitest';
import {
  KRAKEN_EXCHANGE_CONNECTIVITY_EXCHANGE_IDENTIFIER,
  buildKrakenAdapterLayerAnchorState,
  buildKrakenConnectionManagementAnchorState,
} from './durable-kraken-exchange-connectivity-state';

const recordedAt = '2026-08-28T16:00:00.000Z';

describe('durable-kraken-exchange-connectivity-state — W4-E04-b', () => {
  it('buildKrakenConnectionManagementAnchorState stores explicit connection anchor only', () => {
    const outcome = buildKrakenConnectionManagementAnchorState({
      workspaceId: 'ws-kraken',
      connectionId: 'conn-kraken-1',
      actorId: 'actor-1',
      recordedAt,
      prior: null,
    });

    expect(outcome.ok).toBe(true);
    if (!outcome.ok) {
      return;
    }

    expect(outcome.state).toMatchObject({
      workspaceId: 'ws-kraken',
      exchangeIdentifier: KRAKEN_EXCHANGE_CONNECTIVITY_EXCHANGE_IDENTIFIER,
      connectionAnchorConnectionId: 'conn-kraken-1',
    });
    expect(outcome.state).not.toHaveProperty('connected');
  });

  it('buildKrakenAdapterLayerAnchorState stores explicit adapter anchor only', () => {
    const connectionOutcome = buildKrakenConnectionManagementAnchorState({
      workspaceId: 'ws-kraken',
      connectionId: 'conn-kraken-1',
      actorId: 'actor-1',
      recordedAt,
      prior: null,
    });
    expect(connectionOutcome.ok).toBe(true);
    if (!connectionOutcome.ok) {
      return;
    }

    const outcome = buildKrakenAdapterLayerAnchorState({
      workspaceId: 'ws-kraken',
      exchangeConnectionId: 'ex-conn-kraken-1',
      actorId: 'actor-2',
      recordedAt: '2026-08-28T16:05:00.000Z',
      prior: connectionOutcome.state,
    });

    expect(outcome.ok).toBe(true);
    if (!outcome.ok) {
      return;
    }

    expect(outcome.state).toMatchObject({
      connectionAnchorConnectionId: 'conn-kraken-1',
      adapterAnchorExchangeConnectionId: 'ex-conn-kraken-1',
      exchangeIdentifier: KRAKEN_EXCHANGE_CONNECTIVITY_EXCHANGE_IDENTIFIER,
    });
  });

  it('rejects workspace mismatch', () => {
    const priorOutcome = buildKrakenConnectionManagementAnchorState({
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

    const outcome = buildKrakenAdapterLayerAnchorState({
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
