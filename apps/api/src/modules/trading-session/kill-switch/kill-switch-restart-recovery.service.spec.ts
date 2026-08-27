import { describe, expect, it, vi } from 'vitest';
import { KillSwitchRestartRecoveryService } from './kill-switch-restart-recovery.service';
import { KillSwitchRecoveryStore } from './kill-switch-recovery-store';
import type { KillSwitchStateRepository } from '../domain/kill-switch-state.repository';
import { buildArmedKillSwitchState } from '../domain/durable-kill-switch-state';

const recordedAt = '2026-08-27T18:00:00.000Z';

function armed(workspaceId: string) {
  const outcome = buildArmedKillSwitchState({
    workspaceId,
    actorId: 'actor-1',
    reason: 'halt',
    recordedAt,
    prior: null,
  });
  if (!outcome.ok) throw new Error('expected armed');
  return outcome.state;
}

function createRepository(states: ReturnType<typeof armed>[]): KillSwitchStateRepository {
  return {
    saveKillSwitchState: vi.fn(),
    loadKillSwitchState: vi.fn(),
    listAllKillSwitchStates: vi.fn(async () => states),
  };
}

describe('KillSwitchRestartRecoveryService — W3-O04-c', () => {
  it('hydrate restores persisted armed state after simulated restart', async () => {
    const repository = createRepository([armed('ws-1')]);
    const recoveryStore = new KillSwitchRecoveryStore();
    const service = new KillSwitchRestartRecoveryService(repository, recoveryStore);

    const diagnostics = await service.hydrate();
    expect(diagnostics.restoredCount).toBe(1);
    expect(diagnostics.armedCount).toBe(1);
    expect(service.getRecoveredState('ws-1')?.armed).toBe(true);
    expect(service.getRecoveredState('ws-missing')).toBeNull();
  });

  it('hydrate is idempotent', async () => {
    const repository = createRepository([armed('ws-b'), armed('ws-a')]);
    const recoveryStore = new KillSwitchRecoveryStore();
    const service = new KillSwitchRestartRecoveryService(repository, recoveryStore);

    const first = await service.hydrate();
    const second = await service.hydrate();
    expect(first).toEqual(second);
    expect(service.getRecoveryDiagnostics().recoveryOrder).toEqual(['ws-a', 'ws-b']);
  });

  it('hydrate with no persisted rows leaves runtime empty', async () => {
    const repository = createRepository([]);
    const recoveryStore = new KillSwitchRecoveryStore();
    const service = new KillSwitchRestartRecoveryService(repository, recoveryStore);

    const diagnostics = await service.hydrate();
    expect(diagnostics.restoredCount).toBe(0);
    expect(recoveryStore.hasHydrated()).toBe(true);
    expect(service.getRecoveredState('ws-1')).toBeNull();
  });
});
