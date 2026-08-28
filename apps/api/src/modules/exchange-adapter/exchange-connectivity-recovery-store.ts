import { Injectable } from '@nestjs/common';
import type { DurableExchangeConnectivityState } from './domain/durable-exchange-connectivity-state';
import { sortExchangeConnectivityStatesDeterministically } from './domain/exchange-connectivity-restart-recovery';

/**
 * In-memory runtime cache for recovered exchange connectivity state (W4-E01-c).
 * Not a second Source of Truth — hydrated from W4-E01-b persistence on restart.
 */
@Injectable()
export class ExchangeConnectivityRecoveryStore {
  private hydrated = false;
  private readonly byWorkspace = new Map<string, DurableExchangeConnectivityState>();

  replaceAll(states: readonly DurableExchangeConnectivityState[]): void {
    this.byWorkspace.clear();
    for (const state of states) {
      this.byWorkspace.set(state.workspaceId, state);
    }
    this.hydrated = true;
  }

  set(state: DurableExchangeConnectivityState): void {
    this.byWorkspace.set(state.workspaceId, state);
    this.hydrated = true;
  }

  get(workspaceId: string): DurableExchangeConnectivityState | null {
    return this.byWorkspace.get(workspaceId) ?? null;
  }

  hasHydrated(): boolean {
    return this.hydrated;
  }

  snapshot(): readonly DurableExchangeConnectivityState[] {
    return sortExchangeConnectivityStatesDeterministically([...this.byWorkspace.values()]);
  }
}
