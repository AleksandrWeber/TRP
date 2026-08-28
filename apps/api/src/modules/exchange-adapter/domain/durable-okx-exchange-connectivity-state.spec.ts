import { describe, expect, it } from 'vitest';
import {
  OKX_EXCHANGE_CONNECTIVITY_EXCHANGE_IDENTIFIER,
  buildOkxAdapterLayerAnchorState,
  buildOkxConnectionManagementAnchorState,
} from './durable-okx-exchange-connectivity-state';

const recordedAt = '2026-08-28T13:00:00.000Z';

describe('durable-okx-exchange-connectivity-state — W4-E03-b', () => {
  it('buildOkxConnectionManagementAnchorState stores explicit connection anchor only', () => {
    const outcome = buildOkxConnectionManagementAnchorState({
      workspaceId: 'ws-okx',
      connectionId: 'conn-okx-1',
      actorId: 'actor-1',
      recordedAt,
      prior: null,
    });

    expect(outcome.ok).toBe(true);
    if (!outcome.ok) {
      return;
    }

    expect(outcome.state).toMatchObject({
      workspaceId: 'ws-okx',
      exchangeIdentifier: OKX_EXCHANGE_CONNECTIVITY_EXCHANGE_IDENTIFIER,
      connectionAnchorConnectionId: 'conn-okx-1',
    });
    expect(outcome.state).not.toHaveProperty('connected');
  });

  it('buildOkxAdapterLayerAnchorState stores explicit adapter anchor only', () => {
    const connectionOutcome = buildOkxConnectionManagementAnchorState({
      workspaceId: 'ws-okx',
      connectionId: 'conn-okx-1',
      actorId: 'actor-1',
      recordedAt,
      prior: null,
    });
    expect(connectionOutcome.ok).toBe(true);
    if (!connectionOutcome.ok) {
      return;
    }

    const outcome = buildOkxAdapterLayerAnchorState({
      workspaceId: 'ws-okx',
      exchangeConnectionId: 'ex-conn-okx-1',
      actorId: 'actor-2',
      recordedAt: '2026-08-28T13:05:00.000Z',
      prior: connectionOutcome.state,
    });

    expect(outcome.ok).toBe(true);
    if (!outcome.ok) {
      return;
    }

    expect(outcome.state).toMatchObject({
      connectionAnchorConnectionId: 'conn-okx-1',
      adapterAnchorExchangeConnectionId: 'ex-conn-okx-1',
      exchangeIdentifier: OKX_EXCHANGE_CONNECTIVITY_EXCHANGE_IDENTIFIER,
    });
  });

  it('rejects workspace mismatch', () => {
    const priorOutcome = buildOkxConnectionManagementAnchorState({
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

    const outcome = buildOkxAdapterLayerAnchorState({
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
