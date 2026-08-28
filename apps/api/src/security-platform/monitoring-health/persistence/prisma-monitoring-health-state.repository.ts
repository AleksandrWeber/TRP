import type { Prisma, PrismaClient } from '@prisma/client';
import {
  prismaClientForTransaction,
  type TransactionContext,
} from '../../../storage/prisma/prisma-transaction.service';
import {
  MONITORING_HEALTH_STATE_SCHEMA_VERSION,
  type DurableMonitoringHealthState,
} from '../domain/durable-monitoring-health-state';
import { assertRecoverableMonitoringHealthState } from '../domain/monitoring-health-restart-recovery';
import type { MonitoringHealthStateRepository } from '../domain/monitoring-health-state.repository';

type MonitoringHealthStateRow = Prisma.WorkspaceMonitoringHealthStateGetPayload<
  Record<string, never>
>;

export class PrismaMonitoringHealthStateRepository implements MonitoringHealthStateRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async saveMonitoringHealthState(
    state: DurableMonitoringHealthState,
    transaction?: TransactionContext,
  ): Promise<void> {
    const client = transaction ? prismaClientForTransaction(transaction) : this.prisma;
    const data = toRow(state);
    await client.workspaceMonitoringHealthState.upsert({
      where: { workspaceId: state.workspaceId },
      create: data,
      update: data,
    });
  }

  async loadMonitoringHealthState(
    workspaceId: string,
  ): Promise<DurableMonitoringHealthState | null> {
    const row = await this.prisma.workspaceMonitoringHealthState.findUnique({
      where: { workspaceId },
    });
    return row ? toDomain(row) : null;
  }

  async listAllMonitoringHealthStates(): Promise<readonly DurableMonitoringHealthState[]> {
    const rows = await this.prisma.workspaceMonitoringHealthState.findMany({
      orderBy: { workspaceId: 'asc' },
    });
    return Object.freeze(
      rows.map((row, index) => assertRecoverableMonitoringHealthState(toDomain(row), index)),
    );
  }
}

function toRow(
  state: DurableMonitoringHealthState,
): Prisma.WorkspaceMonitoringHealthStateUncheckedCreateInput {
  return {
    workspaceId: state.workspaceId,
    schemaVersion: state.schemaVersion,
    securityHealthAnchorIncidentId: state.securityHealthAnchorIncidentId,
    securityHealthAnchorRecordedAt:
      state.securityHealthAnchorRecordedAt !== null
        ? new Date(state.securityHealthAnchorRecordedAt)
        : null,
    securityHealthAnchorRecordedByActorId: state.securityHealthAnchorRecordedByActorId,
    connectionHealthAnchorSessionId: state.connectionHealthAnchorSessionId,
    connectionHealthAnchorRecordedAt:
      state.connectionHealthAnchorRecordedAt !== null
        ? new Date(state.connectionHealthAnchorRecordedAt)
        : null,
    connectionHealthAnchorRecordedByActorId: state.connectionHealthAnchorRecordedByActorId,
    correlationId: state.correlationId,
    updatedAt: new Date(state.updatedAt),
  };
}

function toDomain(row: MonitoringHealthStateRow): DurableMonitoringHealthState {
  if (row.schemaVersion !== MONITORING_HEALTH_STATE_SCHEMA_VERSION) {
    throw new Error(`Unsupported monitoring health schema version: ${row.schemaVersion}`);
  }

  return Object.freeze({
    workspaceId: row.workspaceId,
    schemaVersion: row.schemaVersion,
    securityHealthAnchorIncidentId: row.securityHealthAnchorIncidentId,
    securityHealthAnchorRecordedAt: row.securityHealthAnchorRecordedAt?.toISOString() ?? null,
    securityHealthAnchorRecordedByActorId: row.securityHealthAnchorRecordedByActorId,
    connectionHealthAnchorSessionId: row.connectionHealthAnchorSessionId,
    connectionHealthAnchorRecordedAt: row.connectionHealthAnchorRecordedAt?.toISOString() ?? null,
    connectionHealthAnchorRecordedByActorId: row.connectionHealthAnchorRecordedByActorId,
    correlationId: row.correlationId,
    updatedAt: row.updatedAt.toISOString(),
  });
}
