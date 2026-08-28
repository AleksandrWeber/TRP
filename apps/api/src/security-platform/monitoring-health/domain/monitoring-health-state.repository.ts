import type { TransactionContext } from '../../../storage/prisma/prisma-transaction.service';
import type { DurableMonitoringHealthState } from './durable-monitoring-health-state';

/**
 * Persistence port for durable monitoring health state (W3-O05-b).
 * Implementations belong to Security Platform infrastructure.
 */
export interface MonitoringHealthStateRepository {
  saveMonitoringHealthState(
    state: DurableMonitoringHealthState,
    transaction?: TransactionContext,
  ): Promise<void>;

  loadMonitoringHealthState(workspaceId: string): Promise<DurableMonitoringHealthState | null>;

  /** Deterministic recovery load — workspaceId ascending (W3-O05-c). */
  listAllMonitoringHealthStates(): Promise<readonly DurableMonitoringHealthState[]>;
}

export const MONITORING_HEALTH_STATE_REPOSITORY = Symbol('MONITORING_HEALTH_STATE_REPOSITORY');
