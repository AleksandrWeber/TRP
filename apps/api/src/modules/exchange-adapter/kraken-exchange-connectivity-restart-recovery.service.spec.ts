import { describe, expect, it, vi, beforeEach } from 'vitest';
import { buildKrakenConnectionManagementAnchorState } from './domain/durable-kraken-exchange-connectivity-state';
import type { KrakenExchangeConnectivityStateRepository } from './domain/kraken-exchange-connectivity-state.repository';
import type { DurableKrakenExchangeConnectivityState } from './domain/durable-kraken-exchange-connectivity-state';
import {
  getKrakenExchangeConnectivityContinuityRecord,
  resetKrakenExchangeConnectivityContinuity,
} from './domain/kraken-exchange-connectivity-continuity-status';
import { KrakenExchangeConnectivityRecoveryStore } from './kraken-exchange-connectivity-recovery-store';
import { KrakenExchangeConnectivityRestartRecoveryService } from './kraken-exchange-connectivity-restart-recovery.service';
import { KrakenExchangeConnectivityPersistenceService } from './kraken-exchange-connectivity-persistence.service';

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

function createRepository(
  initial: DurableKrakenExchangeConnectivityState[] = [],
): KrakenExchangeConnectivityStateRepository & {
  saved: DurableKrakenExchangeConnectivityState[];
} {
  const saved = [...initial];
  const currentByWorkspace = new Map(initial.map((s) => [s.workspaceId, s]));
  return {
    saved,
    saveKrakenExchangeConnectivityState: vi.fn(async (state) => {
      currentByWorkspace.set(state.workspaceId, state);
      saved.push(state);
    }),
    loadKrakenExchangeConnectivityState: vi.fn(
      async (workspaceId) => currentByWorkspace.get(workspaceId) ?? null,
    ),
    listAllKrakenExchangeConnectivityStates: vi.fn(async () => saved),
  };
}

describe('KrakenExchangeConnectivityRestartRecoveryService — W4-E04-c', () => {
  beforeEach(() => {
    resetKrakenExchangeConnectivityContinuity();
  });

  it('hydrate restores persisted state into recovery store', async () => {
    const state = connectionAnchor('ws-1');
    const repository = createRepository([state]);
    const recoveryStore = new KrakenExchangeConnectivityRecoveryStore();
    const service = new KrakenExchangeConnectivityRestartRecoveryService(repository, recoveryStore);

    const diagnostics = await service.hydrate();
    expect(diagnostics.restoredCount).toBe(1);
    expect(diagnostics.connectionAnchorCount).toBe(1);
    expect(service.getRecoveredState('ws-1')?.connectionAnchorConnectionId).toBe('conn-42');
  });

  it('missing persisted state yields empty recovery without fabrication', async () => {
    const service = new KrakenExchangeConnectivityRestartRecoveryService(
      createRepository([]),
      new KrakenExchangeConnectivityRecoveryStore(),
    );
    const diagnostics = await service.hydrate();
    expect(diagnostics.restoredCount).toBe(0);
    expect(service.getRecoveredState('ws-missing')).toBeNull();
  });

  it('hydrate is idempotent', async () => {
    const state = connectionAnchor('ws-a');
    const service = new KrakenExchangeConnectivityRestartRecoveryService(
      createRepository([state]),
      new KrakenExchangeConnectivityRecoveryStore(),
    );
    const first = await service.hydrate();
    const second = await service.hydrate();
    expect(first).toEqual(second);
  });

  it('hydrate records continuity success (W4-E04-d)', async () => {
    const state = connectionAnchor('ws-1');
    const service = new KrakenExchangeConnectivityRestartRecoveryService(
      createRepository([state]),
      new KrakenExchangeConnectivityRecoveryStore(),
    );
    await service.hydrate();
    const continuity = getKrakenExchangeConnectivityContinuityRecord();
    expect(continuity?.integrityVerified).toBe(true);
    expect(continuity?.diagnostics?.restoredCount).toBe(1);
  });
});

describe('KrakenExchangeConnectivityPersistenceService — W4-E04-c hydrated reads', () => {
  it('loadState reads from recovery store after hydrate', async () => {
    const state = connectionAnchor('ws-1');
    const repository = createRepository([state]);
    const recoveryStore = new KrakenExchangeConnectivityRecoveryStore();
    const recoveryService = new KrakenExchangeConnectivityRestartRecoveryService(
      repository,
      recoveryStore,
    );
    await recoveryService.hydrate();

    const persistence = new KrakenExchangeConnectivityPersistenceService(repository, recoveryStore);
    expect(await persistence.loadState('ws-1')).toMatchObject({
      connectionAnchorConnectionId: 'conn-42',
    });
  });

  it('persistConnectionManagementAnchor write-through updates recovery store', async () => {
    const repository = createRepository([]);
    const recoveryStore = new KrakenExchangeConnectivityRecoveryStore();
    const persistence = new KrakenExchangeConnectivityPersistenceService(repository, recoveryStore);

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
