import { describe, expect, it, vi } from 'vitest';
import { buildConnectionManagementAnchorState } from './domain/durable-exchange-connectivity-state';
import type { ExchangeConnectivityStateRepository } from './domain/exchange-connectivity-state.repository';
import type { DurableExchangeConnectivityState } from './domain/durable-exchange-connectivity-state';
import { ExchangeConnectivityRecoveryStore } from './exchange-connectivity-recovery-store';
import { ExchangeConnectivityRestartRecoveryService } from './exchange-connectivity-restart-recovery.service';
import { ExchangeConnectivityPersistenceService } from './exchange-connectivity-persistence.service';

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

function createRepository(
  initial: DurableExchangeConnectivityState[] = [],
): ExchangeConnectivityStateRepository & {
  saved: DurableExchangeConnectivityState[];
} {
  const saved = [...initial];
  const currentByWorkspace = new Map(initial.map((s) => [s.workspaceId, s]));
  return {
    saved,
    saveExchangeConnectivityState: vi.fn(async (state) => {
      currentByWorkspace.set(state.workspaceId, state);
      saved.push(state);
    }),
    loadExchangeConnectivityState: vi.fn(
      async (workspaceId) => currentByWorkspace.get(workspaceId) ?? null,
    ),
    listAllExchangeConnectivityStates: vi.fn(async () => saved),
  };
}

describe('ExchangeConnectivityRestartRecoveryService — W4-E01-c', () => {
  it('hydrate restores persisted state into recovery store', async () => {
    const state = connectionAnchor('ws-1');
    const repository = createRepository([state]);
    const recoveryStore = new ExchangeConnectivityRecoveryStore();
    const service = new ExchangeConnectivityRestartRecoveryService(repository, recoveryStore);

    const diagnostics = await service.hydrate();
    expect(diagnostics.restoredCount).toBe(1);
    expect(diagnostics.connectionAnchorCount).toBe(1);
    expect(service.getRecoveredState('ws-1')?.connectionAnchorConnectionId).toBe('conn-42');
  });

  it('missing persisted state yields empty recovery without fabrication', async () => {
    const service = new ExchangeConnectivityRestartRecoveryService(
      createRepository([]),
      new ExchangeConnectivityRecoveryStore(),
    );
    const diagnostics = await service.hydrate();
    expect(diagnostics.restoredCount).toBe(0);
    expect(service.getRecoveredState('ws-missing')).toBeNull();
  });

  it('hydrate is idempotent', async () => {
    const state = connectionAnchor('ws-a');
    const service = new ExchangeConnectivityRestartRecoveryService(
      createRepository([state]),
      new ExchangeConnectivityRecoveryStore(),
    );
    const first = await service.hydrate();
    const second = await service.hydrate();
    expect(first).toEqual(second);
  });
});

describe('ExchangeConnectivityPersistenceService — W4-E01-c hydrated reads', () => {
  it('loadState reads from recovery store after hydrate', async () => {
    const state = connectionAnchor('ws-1');
    const repository = createRepository([state]);
    const recoveryStore = new ExchangeConnectivityRecoveryStore();
    const recoveryService = new ExchangeConnectivityRestartRecoveryService(
      repository,
      recoveryStore,
    );
    await recoveryService.hydrate();

    const persistence = new ExchangeConnectivityPersistenceService(repository, recoveryStore);
    expect(await persistence.loadState('ws-1')).toMatchObject({
      connectionAnchorConnectionId: 'conn-42',
    });
  });

  it('persistConnectionManagementAnchor write-through updates recovery store', async () => {
    const repository = createRepository([]);
    const recoveryStore = new ExchangeConnectivityRecoveryStore();
    const persistence = new ExchangeConnectivityPersistenceService(repository, recoveryStore);

    await persistence.persistConnectionManagementAnchor({
      workspaceId: 'ws-1',
      provider: 'BINANCE',
      connectionId: 'conn-99',
      actorId: 'actor-1',
      recordedAt,
    });

    expect(recoveryStore.get('ws-1')?.connectionAnchorConnectionId).toBe('conn-99');
    expect(await persistence.loadState('ws-1')).toMatchObject({
      connectionAnchorConnectionId: 'conn-99',
    });
  });
});
