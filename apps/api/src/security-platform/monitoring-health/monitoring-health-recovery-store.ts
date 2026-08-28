import { Injectable } from '@nestjs/common';
import type { DurableMonitoringHealthState } from './domain/durable-monitoring-health-state';
import { sortMonitoringHealthStatesDeterministically } from './domain/monitoring-health-restart-recovery';

/**
 * In-memory runtime cache for recovered monitoring health state (W3-O05-c).
 * Not a second Source of Truth — hydrated from W3-O05-b persistence on restart.
 */
@Injectable()
export class MonitoringHealthRecoveryStore {
  private hydrated = false;
  private readonly byWorkspace = new Map<string, DurableMonitoringHealthState>();

  replaceAll(states: readonly DurableMonitoringHealthState[]): void {
    this.byWorkspace.clear();
    for (const state of states) {
      this.byWorkspace.set(state.workspaceId, state);
    }
    this.hydrated = true;
  }

  set(state: DurableMonitoringHealthState): void {
    this.byWorkspace.set(state.workspaceId, state);
    this.hydrated = true;
  }

  get(workspaceId: string): DurableMonitoringHealthState | null {
    return this.byWorkspace.get(workspaceId) ?? null;
  }

  hasHydrated(): boolean {
    return this.hydrated;
  }

  snapshot(): readonly DurableMonitoringHealthState[] {
    return sortMonitoringHealthStatesDeterministically([...this.byWorkspace.values()]);
  }
}
