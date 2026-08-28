import { describe, expect, it, vi } from 'vitest';
import { BybitExchangeConnectivityPersistenceService } from './bybit-exchange-connectivity-persistence.service';
import { BybitExchangeConnectivityRecoveryStore } from './bybit-exchange-connectivity-recovery-store';
import type { BybitExchangeConnectivityStateRepository } from './domain/bybit-exchange-connectivity-state.repository';
import type { DurableBybitExchangeConnectivityState } from './domain/durable-bybit-exchange-connectivity-state';

const recordedAt = '2026-08-28T13:00:00.000Z';

function createRepository(): BybitExchangeConnectivityStateRepository & {
  saved: DurableBybitExchangeConnectivityState[];
} {
  const saved: DurableBybitExchangeConnectivityState[] = [];
  let current: DurableBybitExchangeConnectivityState | null = null;
  return {
    saved,
    saveBybitExchangeConnectivityState: vi.fn(async (state) => {
      current = state;
      saved.push(state);
    }),
    loadBybitExchangeConnectivityState: vi.fn(async () => current),
    listAllBybitExchangeConnectivityStates: vi.fn(async () => saved),
  };
}

function createService(repository: BybitExchangeConnectivityStateRepository) {
  return new BybitExchangeConnectivityPersistenceService(
    repository,
    new BybitExchangeConnectivityRecoveryStore(),
  );
}

describe('BybitExchangeConnectivityPersistenceService — W4-E02-b storage only', () => {
  it('persistConnectionManagementAnchor writes explicit BYBIT connection anchor without connected flag', async () => {
    const repository = createRepository();
    const service = createService(repository);

    const outcome = await service.persistConnectionManagementAnchor({
      workspaceId: 'ws-1',
      connectionId: 'conn-42',
      actorId: 'actor-1',
      recordedAt,
    });

    expect(outcome.ok).toBe(true);
    expect(repository.saved).toHaveLength(1);
    expect(repository.saved[0]).toMatchObject({
      exchangeIdentifier: 'BYBIT',
      connectionAnchorConnectionId: 'conn-42',
    });
    expect(repository.saved[0]).not.toHaveProperty('connected');
    expect(await service.loadState('ws-1')).toMatchObject({
      connectionAnchorConnectionId: 'conn-42',
    });
  });

  it('persistAdapterLayerAnchor writes explicit BYBIT adapter exchange_connection anchor', async () => {
    const repository = createRepository();
    const service = createService(repository);

    await service.persistConnectionManagementAnchor({
      workspaceId: 'ws-1',
      connectionId: 'conn-42',
      actorId: 'actor-1',
      recordedAt,
    });

    const outcome = await service.persistAdapterLayerAnchor({
      workspaceId: 'ws-1',
      exchangeConnectionId: 'ex-conn-9',
      actorId: 'actor-2',
      recordedAt: '2026-08-28T13:05:00.000Z',
    });

    expect(outcome.ok).toBe(true);
    expect(await service.loadState('ws-1')).toMatchObject({
      exchangeIdentifier: 'BYBIT',
      connectionAnchorConnectionId: 'conn-42',
      adapterAnchorExchangeConnectionId: 'ex-conn-9',
    });
  });

  it('loadState returns null when workspace has no persisted row', async () => {
    const repository = createRepository();
    const service = createService(repository);
    expect(await service.loadState('ws-missing')).toBeNull();
  });
});
