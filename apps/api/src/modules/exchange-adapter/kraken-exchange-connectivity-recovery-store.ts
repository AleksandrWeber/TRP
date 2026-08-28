import { Injectable } from '@nestjs/common';
import type { DurableKrakenExchangeConnectivityState } from './domain/durable-kraken-exchange-connectivity-state';
import { sortKrakenExchangeConnectivityStatesDeterministically } from './domain/kraken-exchange-connectivity-restart-recovery';

/**
 * In-memory runtime cache for recovered Kraken exchange connectivity state (W4-E04-c).
 * Not a second Source of Truth — hydrated from W4-E04-b persistence on restart.
 */
@Injectable()
export class KrakenExchangeConnectivityRecoveryStore {
  private hydrated = false;
  private readonly byWorkspace = new Map<string, DurableKrakenExchangeConnectivityState>();

  replaceAll(states: readonly DurableKrakenExchangeConnectivityState[]): void {
    this.byWorkspace.clear();
    for (const state of states) {
      this.byWorkspace.set(state.workspaceId, state);
    }
    this.hydrated = true;
  }

  set(state: DurableKrakenExchangeConnectivityState): void {
    this.byWorkspace.set(state.workspaceId, state);
    this.hydrated = true;
  }

  get(workspaceId: string): DurableKrakenExchangeConnectivityState | null {
    return this.byWorkspace.get(workspaceId) ?? null;
  }

  hasHydrated(): boolean {
    return this.hydrated;
  }

  snapshot(): readonly DurableKrakenExchangeConnectivityState[] {
    return sortKrakenExchangeConnectivityStatesDeterministically([...this.byWorkspace.values()]);
  }
}
