import type { TransactionContext } from '../../../storage/prisma/prisma-transaction.service';
import type { DurableKillSwitchState } from './durable-kill-switch-state';

/**
 * Persistence port for durable paper Kill Switch state (W3-O04-b).
 * Implementations belong to trading-session infrastructure.
 */
export interface KillSwitchStateRepository {
  saveKillSwitchState(
    state: DurableKillSwitchState,
    transaction?: TransactionContext,
  ): Promise<void>;

  loadKillSwitchState(workspaceId: string): Promise<DurableKillSwitchState | null>;

  /** Deterministic recovery load — workspaceId ascending (W3-O04-c). */
  listAllKillSwitchStates(): Promise<readonly DurableKillSwitchState[]>;
}

export const KILL_SWITCH_STATE_REPOSITORY = Symbol('KILL_SWITCH_STATE_REPOSITORY');
