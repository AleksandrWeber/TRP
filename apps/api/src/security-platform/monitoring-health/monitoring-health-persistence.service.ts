import { Inject, Injectable } from '@nestjs/common';
import {
  buildConnectionHealthAnchorState,
  buildSecurityHealthAnchorState,
  type DurableMonitoringHealthState,
  type MonitoringHealthPersistenceOutcome,
} from './domain/durable-monitoring-health-state';
import {
  MONITORING_HEALTH_STATE_REPOSITORY,
  type MonitoringHealthStateRepository,
} from './domain/monitoring-health-state.repository';

export type PersistSecurityHealthAnchorCommand = Readonly<{
  workspaceId: string;
  incidentId: string;
  actorId: string;
  recordedAt: string;
  correlationId?: string | null;
}>;

export type PersistConnectionHealthAnchorCommand = Readonly<{
  workspaceId: string;
  sessionId: string;
  actorId: string;
  recordedAt: string;
  correlationId?: string | null;
}>;

/**
 * W3-O05-b — durable monitoring health persistence on Security Platform owner.
 * Storage only — no health evaluation, restart recovery, or dashboard wiring.
 */
@Injectable()
export class MonitoringHealthPersistenceService {
  constructor(
    @Inject(MONITORING_HEALTH_STATE_REPOSITORY)
    private readonly repository: MonitoringHealthStateRepository,
  ) {}

  async loadState(workspaceId: string): Promise<DurableMonitoringHealthState | null> {
    return this.repository.loadMonitoringHealthState(workspaceId);
  }

  async persistSecurityHealthAnchor(
    command: PersistSecurityHealthAnchorCommand,
  ): Promise<MonitoringHealthPersistenceOutcome> {
    const prior = await this.loadState(command.workspaceId);
    const outcome = buildSecurityHealthAnchorState({ ...command, prior });
    if (!outcome.ok) {
      return outcome;
    }
    await this.repository.saveMonitoringHealthState(outcome.state);
    return outcome;
  }

  async persistConnectionHealthAnchor(
    command: PersistConnectionHealthAnchorCommand,
  ): Promise<MonitoringHealthPersistenceOutcome> {
    const prior = await this.loadState(command.workspaceId);
    const outcome = buildConnectionHealthAnchorState({ ...command, prior });
    if (!outcome.ok) {
      return outcome;
    }
    await this.repository.saveMonitoringHealthState(outcome.state);
    return outcome;
  }
}
