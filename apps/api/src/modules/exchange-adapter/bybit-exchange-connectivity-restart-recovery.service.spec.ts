import { describe, expect, it, vi } from 'vitest';
import { buildBybitConnectionManagementAnchorState } from './domain/durable-bybit-exchange-connectivity-state';
import type { BybitExchangeConnectivityStateRepository } from './domain/bybit-exchange-connectivity-state.repository';
import type { DurableBybitExchangeConnectivityState } from './domain/durable-bybit-exchange-connectivity-state';
import { BybitExchangeConnectivityRecoveryStore } from './bybit-exchange-connectivity-recovery-store';
import { BybitExchangeConnectivityRestartRecoveryService } from './bybit-exchange-connectivity-restart-recovery.service';
import { BybitExchangeConnectivityPersistenceService } from './bybit-exchange-connectivity-persistence.service';

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

function createRepository(
  initial: DurableBybitExchangeConnectivityState[] = [],
): BybitExchangeConnectivityStateRepository & {
  saved: DurableBybitExchangeConnectivityState[];
} {
  const saved = [...initial];
  const currentByWorkspace = new Map(initial.map((s) => [s.workspaceId, s]));
  return {
    saved,
    saveBybitExchangeConnectivityState: vi.fn(async (state) => {
      currentByWorkspace.set(state.workspaceId, state);
      saved.push(state);
    }),
    loadBybitExchangeConnectivityState: vi.fn(
      async (workspaceId) => currentByWorkspace.get(workspaceId) ?? null,
    ),
    listAllBybitExchangeConnectivityStates: vi.fn(async () => saved),
  };
}

describe('BybitExchangeConnectivityRestartRecoveryService — W4-E02-c', () => {
  it('hydrate restores persisted state into recovery store', async () => {
    const state = connectionAnchor('ws-1');
    const repository = createRepository([state]);
    const recoveryStore = new BybitExchangeConnectivityRecoveryStore();
    const service = new BybitExchangeConnectivityRestartRecoveryService(repository, recoveryStore);

    const diagnostics = await service.hydrate();
    expect(diagnostics.restoredCount).toBe(1);
    expect(diagnostics.connectionAnchorCount).toBe(1);
    expect(service.getRecoveredState('ws-1')?.connectionAnchorConnectionId).toBe('conn-42');
  });

  it('missing persisted state yields empty recovery without fabrication', async () => {
    const service = new BybitExchangeConnectivityRestartRecoveryService(
      createRepository([]),
      new BybitExchangeConnectivityRecoveryStore(),
    );
    const diagnostics = await service.hydrate();
    expect(diagnostics.restoredCount).toBe(0);
    expect(service.getRecoveredState('ws-missing')).toBeNull();
  });

  it('hydrate is idempotent', async () => {
    const state = connectionAnchor('ws-a');
    const service = new BybitExchangeConnectivityRestartRecoveryService(
      createRepository([state]),
      new BybitExchangeConnectivityRecoveryStore(),
    );
    const first = await service.hydrate();
    const second = await service.hydrate();
    expect(first).toEqual(second);
  });
});

describe('BybitExchangeConnectivityPersistenceService — W4-E02-c hydrated reads', () => {
  it('loadState reads from recovery store after hydrate', async () => {
    const state = connectionAnchor('ws-1');
    const repository = createRepository([state]);
    const recoveryStore = new BybitExchangeConnectivityRecoveryStore();
    const recoveryService = new BybitExchangeConnectivityRestartRecoveryService(
      repository,
      recoveryStore,
    );
    await recoveryService.hydrate();

    const persistence = new BybitExchangeConnectivityPersistenceService(repository, recoveryStore);
    expect(await persistence.loadState('ws-1')).toMatchObject({
      connectionAnchorConnectionId: 'conn-42',
    });
  });

  it('persistConnectionManagementAnchor write-through updates recovery store', async () => {
    const repository = createRepository([]);
    const recoveryStore = new BybitExchangeConnectivityRecoveryStore();
    const persistence = new BybitExchangeConnectivityPersistenceService(repository, recoveryStore);

    await persistence.persistConnectionManagementAnchor({
      workspaceId: 'ws-1',
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
