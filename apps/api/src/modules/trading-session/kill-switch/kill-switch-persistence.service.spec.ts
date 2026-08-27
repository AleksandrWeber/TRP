import { describe, expect, it, vi } from 'vitest';
import { KillSwitchPersistenceService } from './kill-switch-persistence.service';
import { KillSwitchRecoveryStore } from './kill-switch-recovery-store';
import type { KillSwitchStateRepository } from '../domain/kill-switch-state.repository';
import type { DurableKillSwitchState } from '../domain/durable-kill-switch-state';

const recordedAt = '2026-08-27T18:00:00.000Z';

function createRepository(): KillSwitchStateRepository & {
  saved: DurableKillSwitchState[];
} {
  const saved: DurableKillSwitchState[] = [];
  let current: DurableKillSwitchState | null = null;
  return {
    saved,
    saveKillSwitchState: vi.fn(async (state) => {
      current = state;
      saved.push(state);
    }),
    loadKillSwitchState: vi.fn(async () => current),
    listAllKillSwitchStates: vi.fn(async () => saved),
  };
}

function createService(repository: KillSwitchStateRepository) {
  return new KillSwitchPersistenceService(repository, new KillSwitchRecoveryStore());
}

describe('KillSwitchPersistenceService — W3-O04-b storage only', () => {
  it('persistArmed writes durable armed state without executing halt', async () => {
    const repository = createRepository();
    const service = createService(repository);

    const outcome = await service.persistArmed({
      workspaceId: 'ws-1',
      actorId: 'actor-1',
      reason: 'emergency',
      recordedAt,
    });

    expect(outcome.ok).toBe(true);
    expect(repository.saved).toHaveLength(1);
    expect(repository.saved[0]?.armed).toBe(true);
    expect(await service.loadState('ws-1')).toMatchObject({ armed: true });
  });

  it('persistCleared writes cleared state and rejects clear while disarmed', async () => {
    const repository = createRepository();
    const service = createService(repository);

    const clearWithoutArm = await service.persistCleared({
      workspaceId: 'ws-1',
      actorId: 'actor-clear',
      recordedAt: '2026-08-27T18:05:00.000Z',
    });
    expect(clearWithoutArm.ok).toBe(false);

    await service.persistArmed({
      workspaceId: 'ws-1',
      actorId: 'actor-1',
      reason: 'emergency',
      recordedAt,
    });

    const cleared = await service.persistCleared({
      workspaceId: 'ws-1',
      actorId: 'actor-clear',
      recordedAt: '2026-08-27T18:05:00.000Z',
    });
    expect(cleared.ok).toBe(true);
    expect(await service.loadState('ws-1')).toMatchObject({ armed: false });
  });

  it('loadState returns null when workspace has no persisted row', async () => {
    const repository = createRepository();
    const service = createService(repository);
    expect(await service.loadState('ws-missing')).toBeNull();
  });
});
