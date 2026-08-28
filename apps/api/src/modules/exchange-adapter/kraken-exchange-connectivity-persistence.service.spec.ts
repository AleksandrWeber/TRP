import { describe, expect, it, vi } from 'vitest';
import { KrakenExchangeConnectivityPersistenceService } from './kraken-exchange-connectivity-persistence.service';
import type { KrakenExchangeConnectivityStateRepository } from './domain/kraken-exchange-connectivity-state.repository';
import type { DurableKrakenExchangeConnectivityState } from './domain/durable-kraken-exchange-connectivity-state';

const recordedAt = '2026-08-28T16:00:00.000Z';

function createRepository(): KrakenExchangeConnectivityStateRepository & {
  saved: DurableKrakenExchangeConnectivityState[];
} {
  const saved: DurableKrakenExchangeConnectivityState[] = [];
  let current: DurableKrakenExchangeConnectivityState | null = null;
  return {
    saved,
    saveKrakenExchangeConnectivityState: vi.fn(async (state) => {
      current = state;
      saved.push(state);
    }),
    loadKrakenExchangeConnectivityState: vi.fn(async () => current),
    listAllKrakenExchangeConnectivityStates: vi.fn(async () => saved),
  };
}

describe('KrakenExchangeConnectivityPersistenceService — W4-E04-b storage only', () => {
  it('persistConnectionManagementAnchor writes explicit KRAKEN connection anchor without connected flag', async () => {
    const repository = createRepository();
    const service = new KrakenExchangeConnectivityPersistenceService(repository);

    const outcome = await service.persistConnectionManagementAnchor({
      workspaceId: 'ws-1',
      connectionId: 'conn-42',
      actorId: 'actor-1',
      recordedAt,
    });

    expect(outcome.ok).toBe(true);
    expect(repository.saved).toHaveLength(1);
    expect(repository.saved[0]).toMatchObject({
      exchangeIdentifier: 'KRAKEN',
      connectionAnchorConnectionId: 'conn-42',
    });
    expect(repository.saved[0]).not.toHaveProperty('connected');
    expect(await service.loadState('ws-1')).toMatchObject({
      connectionAnchorConnectionId: 'conn-42',
    });
  });

  it('persistAdapterLayerAnchor writes explicit KRAKEN adapter exchange_connection anchor', async () => {
    const repository = createRepository();
    const service = new KrakenExchangeConnectivityPersistenceService(repository);

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
      recordedAt: '2026-08-28T16:05:00.000Z',
    });

    expect(outcome.ok).toBe(true);
    expect(await service.loadState('ws-1')).toMatchObject({
      exchangeIdentifier: 'KRAKEN',
      connectionAnchorConnectionId: 'conn-42',
      adapterAnchorExchangeConnectionId: 'ex-conn-9',
    });
  });

  it('loadState returns null when workspace has no persisted row', async () => {
    const repository = createRepository();
    const service = new KrakenExchangeConnectivityPersistenceService(repository);
    expect(await service.loadState('ws-missing')).toBeNull();
  });
});
