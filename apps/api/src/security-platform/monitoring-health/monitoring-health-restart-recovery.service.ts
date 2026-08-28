import { Inject, Injectable, type OnModuleInit } from '@nestjs/common';
import type { DurableMonitoringHealthState } from './domain/durable-monitoring-health-state';
import {
  buildMonitoringHealthRecoveryDiagnostics,
  prepareMonitoringHealthStatesForRecovery,
  type MonitoringHealthRecoveryDiagnostics,
} from './domain/monitoring-health-restart-recovery';
import {
  MONITORING_HEALTH_STATE_REPOSITORY,
  type MonitoringHealthStateRepository,
} from './domain/monitoring-health-state.repository';
import {
  recordMonitoringHealthRecoveryFailure,
  recordMonitoringHealthRecoveryStart,
  recordMonitoringHealthRecoverySuccess,
} from './domain/monitoring-health-continuity-status';
import { MonitoringHealthRecoveryStore } from './monitoring-health-recovery-store';

/**
 * W3-O05-c/d — deterministic restart recovery for durable monitoring health state.
 * Hydrates in-memory runtime cache from persistence and records W3-O05-d continuity outcomes.
 * Does not evaluate monitoring health, metrics, or dashboards.
 */
@Injectable()
export class MonitoringHealthRestartRecoveryService implements OnModuleInit {
  constructor(
    @Inject(MONITORING_HEALTH_STATE_REPOSITORY)
    private readonly repository: MonitoringHealthStateRepository,
    @Inject(MonitoringHealthRecoveryStore)
    private readonly recoveryStore: MonitoringHealthRecoveryStore,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.hydrate();
  }

  /**
   * Integrity-gated hydrate after normal process restart.
   * Missing rows → empty runtime cache (no fabrication). Corrupt rows → throws.
   */
  async hydrate(): Promise<MonitoringHealthRecoveryDiagnostics> {
    recordMonitoringHealthRecoveryStart();
    try {
      const persisted = await this.repository.listAllMonitoringHealthStates();
      const recovered = prepareMonitoringHealthStatesForRecovery(persisted);
      this.recoveryStore.replaceAll(recovered);
      const diagnostics = buildMonitoringHealthRecoveryDiagnostics(recovered);
      recordMonitoringHealthRecoverySuccess({
        diagnostics,
        reason: diagnostics.restoredCount === 0 ? 'missing-rows-empty' : 'hydrate-ok',
      });
      return diagnostics;
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'hydrate-failed';
      recordMonitoringHealthRecoveryFailure({ reason });
      throw error;
    }
  }

  getRecoveredState(workspaceId: string): DurableMonitoringHealthState | null {
    return this.recoveryStore.get(workspaceId);
  }

  getRecoveryDiagnostics(): MonitoringHealthRecoveryDiagnostics {
    return buildMonitoringHealthRecoveryDiagnostics(this.recoveryStore.snapshot());
  }
}
