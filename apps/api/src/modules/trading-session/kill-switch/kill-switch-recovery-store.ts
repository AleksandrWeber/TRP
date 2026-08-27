import type { DurableKillSwitchState } from '../domain/durable-kill-switch-state';
import { sortKillSwitchStatesDeterministically } from '../domain/kill-switch-restart-recovery';

/**
 * In-memory runtime cache for recovered Kill Switch state (W3-O04-c).
 * Not a second Source of Truth — hydrated from W3-O04-b persistence on restart.
 */
export class KillSwitchRecoveryStore {
  private hydrated = false;
  private readonly byWorkspace = new Map<string, DurableKillSwitchState>();

  replaceAll(states: readonly DurableKillSwitchState[]): void {
    this.byWorkspace.clear();
    for (const state of states) {
      this.byWorkspace.set(state.workspaceId, state);
    }
    this.hydrated = true;
  }

  set(state: DurableKillSwitchState): void {
    this.byWorkspace.set(state.workspaceId, state);
    this.hydrated = true;
  }

  get(workspaceId: string): DurableKillSwitchState | null {
    return this.byWorkspace.get(workspaceId) ?? null;
  }

  hasHydrated(): boolean {
    return this.hydrated;
  }

  snapshot(): readonly DurableKillSwitchState[] {
    return sortKillSwitchStatesDeterministically([...this.byWorkspace.values()]);
  }
}
