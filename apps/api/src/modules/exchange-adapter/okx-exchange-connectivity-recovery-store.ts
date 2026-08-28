import { Injectable } from '@nestjs/common';
import type { DurableOkxExchangeConnectivityState } from './domain/durable-okx-exchange-connectivity-state';
import { sortOkxExchangeConnectivityStatesDeterministically } from './domain/okx-exchange-connectivity-restart-recovery';

/**
 * In-memory runtime cache for recovered Okx exchange connectivity state (W4-E03-c).
 * Not a second Source of Truth — hydrated from W4-E03-b persistence on restart.
 */
@Injectable()
export class OkxExchangeConnectivityRecoveryStore {
  private hydrated = false;
  private readonly byWorkspace = new Map<string, DurableOkxExchangeConnectivityState>();

  replaceAll(states: readonly DurableOkxExchangeConnectivityState[]): void {
    this.byWorkspace.clear();
    for (const state of states) {
      this.byWorkspace.set(state.workspaceId, state);
    }
    this.hydrated = true;
  }

  set(state: DurableOkxExchangeConnectivityState): void {
    this.byWorkspace.set(state.workspaceId, state);
    this.hydrated = true;
  }

  get(workspaceId: string): DurableOkxExchangeConnectivityState | null {
    return this.byWorkspace.get(workspaceId) ?? null;
  }

  hasHydrated(): boolean {
    return this.hydrated;
  }

  snapshot(): readonly DurableOkxExchangeConnectivityState[] {
    return sortOkxExchangeConnectivityStatesDeterministically([...this.byWorkspace.values()]);
  }
}
