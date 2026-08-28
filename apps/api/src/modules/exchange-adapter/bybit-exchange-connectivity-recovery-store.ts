import { Injectable } from '@nestjs/common';
import type { DurableBybitExchangeConnectivityState } from './domain/durable-bybit-exchange-connectivity-state';
import { sortBybitExchangeConnectivityStatesDeterministically } from './domain/bybit-exchange-connectivity-restart-recovery';

/**
 * In-memory runtime cache for recovered Bybit exchange connectivity state (W4-E02-c).
 * Not a second Source of Truth — hydrated from W4-E02-b persistence on restart.
 */
@Injectable()
export class BybitExchangeConnectivityRecoveryStore {
  private hydrated = false;
  private readonly byWorkspace = new Map<string, DurableBybitExchangeConnectivityState>();

  replaceAll(states: readonly DurableBybitExchangeConnectivityState[]): void {
    this.byWorkspace.clear();
    for (const state of states) {
      this.byWorkspace.set(state.workspaceId, state);
    }
    this.hydrated = true;
  }

  set(state: DurableBybitExchangeConnectivityState): void {
    this.byWorkspace.set(state.workspaceId, state);
    this.hydrated = true;
  }

  get(workspaceId: string): DurableBybitExchangeConnectivityState | null {
    return this.byWorkspace.get(workspaceId) ?? null;
  }

  hasHydrated(): boolean {
    return this.hydrated;
  }

  snapshot(): readonly DurableBybitExchangeConnectivityState[] {
    return sortBybitExchangeConnectivityStatesDeterministically([...this.byWorkspace.values()]);
  }
}
