import { Inject, Injectable } from '@nestjs/common';
import {
  buildArmedKillSwitchState,
  buildClearedKillSwitchState,
  type DurableKillSwitchState,
  type KillSwitchPersistenceOutcome,
} from '../domain/durable-kill-switch-state';
import {
  KILL_SWITCH_STATE_REPOSITORY,
  type KillSwitchStateRepository,
} from '../domain/kill-switch-state.repository';
import { KillSwitchRecoveryStore } from './kill-switch-recovery-store';

export type PersistArmedKillSwitchCommand = Readonly<{
  workspaceId: string;
  actorId: string;
  reason: string;
  recordedAt: string;
  correlationId?: string | null;
}>;

export type PersistClearedKillSwitchCommand = Readonly<{
  workspaceId: string;
  actorId: string;
  recordedAt: string;
  correlationId?: string | null;
}>;

/**
 * W3-O04-b — durable Kill Switch persistence on Trading Session owner.
 * W3-O04-c — write-through to recovery store after hydrate.
 * Does not execute halt or wire admission.
 */
@Injectable()
export class KillSwitchPersistenceService {
  constructor(
    @Inject(KILL_SWITCH_STATE_REPOSITORY)
    private readonly repository: KillSwitchStateRepository,
    private readonly recoveryStore: KillSwitchRecoveryStore,
  ) {}

  async loadState(workspaceId: string): Promise<DurableKillSwitchState | null> {
    if (this.recoveryStore.hasHydrated()) {
      return this.recoveryStore.get(workspaceId);
    }
    return this.repository.loadKillSwitchState(workspaceId);
  }

  async persistArmed(
    command: PersistArmedKillSwitchCommand,
  ): Promise<KillSwitchPersistenceOutcome> {
    const prior = await this.loadState(command.workspaceId);
    const outcome = buildArmedKillSwitchState({ ...command, prior });
    if (!outcome.ok) {
      return outcome;
    }
    await this.repository.saveKillSwitchState(outcome.state);
    this.recoveryStore.set(outcome.state);
    return outcome;
  }

  async persistCleared(
    command: PersistClearedKillSwitchCommand,
  ): Promise<KillSwitchPersistenceOutcome> {
    const prior = await this.loadState(command.workspaceId);
    const outcome = buildClearedKillSwitchState({ ...command, prior });
    if (!outcome.ok) {
      return outcome;
    }
    await this.repository.saveKillSwitchState(outcome.state);
    this.recoveryStore.set(outcome.state);
    return outcome;
  }
}
