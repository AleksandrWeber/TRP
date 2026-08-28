import { describe, expect, it, vi, beforeEach } from 'vitest';
import { buildOkxConnectionManagementAnchorState } from './domain/durable-okx-exchange-connectivity-state';
import type { OkxExchangeConnectivityStateRepository } from './domain/okx-exchange-connectivity-state.repository';
import type { DurableOkxExchangeConnectivityState } from './domain/durable-okx-exchange-connectivity-state';
import {
  getOkxExchangeConnectivityContinuityRecord,
  resetOkxExchangeConnectivityContinuity,
} from './domain/okx-exchange-connectivity-continuity-status';
import { OkxExchangeConnectivityRecoveryStore } from './okx-exchange-connectivity-recovery-store';
import { OkxExchangeConnectivityRestartRecoveryService } from './okx-exchange-connectivity-restart-recovery.service';
import { OkxExchangeConnectivityPersistenceService } from './okx-exchange-connectivity-persistence.service';

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

function createRepository(
  initial: DurableOkxExchangeConnectivityState[] = [],
): OkxExchangeConnectivityStateRepository & {
  saved: DurableOkxExchangeConnectivityState[];
} {
  const saved = [...initial];
  const currentByWorkspace = new Map(initial.map((s) => [s.workspaceId, s]));
  return {
    saved,
    saveOkxExchangeConnectivityState: vi.fn(async (state) => {
      currentByWorkspace.set(state.workspaceId, state);
      saved.push(state);
    }),
    loadOkxExchangeConnectivityState: vi.fn(
      async (workspaceId) => currentByWorkspace.get(workspaceId) ?? null,
    ),
    listAllOkxExchangeConnectivityStates: vi.fn(async () => saved),
  };
}

describe('OkxExchangeConnectivityRestartRecoveryService — W4-E03-c', () => {
  beforeEach(() => {
    resetOkxExchangeConnectivityContinuity();
  });

  it('hydrate restores persisted state into recovery store', async () => {
    const state = connectionAnchor('ws-1');
    const repository = createRepository([state]);
    const recoveryStore = new OkxExchangeConnectivityRecoveryStore();
    const service = new OkxExchangeConnectivityRestartRecoveryService(repository, recoveryStore);

    const diagnostics = await service.hydrate();
    expect(diagnostics.restoredCount).toBe(1);
    expect(diagnostics.connectionAnchorCount).toBe(1);
    expect(service.getRecoveredState('ws-1')?.connectionAnchorConnectionId).toBe('conn-42');
  });

  it('missing persisted state yields empty recovery without fabrication', async () => {
    const service = new OkxExchangeConnectivityRestartRecoveryService(
      createRepository([]),
      new OkxExchangeConnectivityRecoveryStore(),
    );
    const diagnostics = await service.hydrate();
    expect(diagnostics.restoredCount).toBe(0);
    expect(service.getRecoveredState('ws-missing')).toBeNull();
  });

  it('hydrate is idempotent', async () => {
    const state = connectionAnchor('ws-a');
    const service = new OkxExchangeConnectivityRestartRecoveryService(
      createRepository([state]),
      new OkxExchangeConnectivityRecoveryStore(),
    );
    const first = await service.hydrate();
    const second = await service.hydrate();
    expect(first).toEqual(second);
  });

  it('hydrate records continuity success (W4-E03-d)', async () => {
    const state = connectionAnchor('ws-1');
    const service = new OkxExchangeConnectivityRestartRecoveryService(
      createRepository([state]),
      new OkxExchangeConnectivityRecoveryStore(),
    );
    await service.hydrate();
    const continuity = getOkxExchangeConnectivityContinuityRecord();
    expect(continuity?.integrityVerified).toBe(true);
    expect(continuity?.diagnostics?.restoredCount).toBe(1);
  });
});

describe('OkxExchangeConnectivityPersistenceService — W4-E03-c hydrated reads', () => {
  it('loadState reads from recovery store after hydrate', async () => {
    const state = connectionAnchor('ws-1');
    const repository = createRepository([state]);
    const recoveryStore = new OkxExchangeConnectivityRecoveryStore();
    const recoveryService = new OkxExchangeConnectivityRestartRecoveryService(
      repository,
      recoveryStore,
    );
    await recoveryService.hydrate();

    const persistence = new OkxExchangeConnectivityPersistenceService(repository, recoveryStore);
    expect(await persistence.loadState('ws-1')).toMatchObject({
      connectionAnchorConnectionId: 'conn-42',
    });
  });

  it('persistConnectionManagementAnchor write-through updates recovery store', async () => {
    const repository = createRepository([]);
    const recoveryStore = new OkxExchangeConnectivityRecoveryStore();
    const persistence = new OkxExchangeConnectivityPersistenceService(repository, recoveryStore);

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
