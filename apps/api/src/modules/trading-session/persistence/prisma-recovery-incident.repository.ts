import type { Prisma, PrismaClient } from '@prisma/client';
import {
  prismaClientForTransaction,
  type TransactionContext,
} from '../../../storage/prisma/prisma-transaction.service';
import {
  RECOVERY_INCIDENT_STATUS_OPEN,
  type RecoveryIncident,
  type RecoveryIncidentReasonClass,
  type RecoveryIncidentStatus,
} from '../domain/recovery-incident';
import type { RecoveryIncidentRepository } from '../domain/recovery-incident.repository';

type IncidentRow = Prisma.SessionRecoveryIncidentGetPayload<Record<string, never>>;

export class PrismaRecoveryIncidentRepository implements RecoveryIncidentRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async saveIncident(incident: RecoveryIncident, transaction?: TransactionContext): Promise<void> {
    const client = transaction ? prismaClientForTransaction(transaction) : this.prisma;
    const data = toRow(incident);
    await client.sessionRecoveryIncident.upsert({
      where: { incidentId: incident.incidentId },
      create: data,
      update: data,
    });
  }

  async loadIncident(incidentId: string): Promise<RecoveryIncident | null> {
    const row = await this.prisma.sessionRecoveryIncident.findUnique({
      where: { incidentId },
    });
    return row ? toDomain(row) : null;
  }

  async loadOpenIncidentBySession(sessionId: string): Promise<RecoveryIncident | null> {
    const row = await this.prisma.sessionRecoveryIncident.findFirst({
      where: { sessionId, status: RECOVERY_INCIDENT_STATUS_OPEN },
      orderBy: { createdAt: 'desc' },
    });
    return row ? toDomain(row) : null;
  }
}

function toRow(incident: RecoveryIncident): Prisma.SessionRecoveryIncidentUncheckedCreateInput {
  return {
    incidentId: incident.incidentId,
    workspaceId: incident.workspaceId,
    sessionId: incident.sessionId,
    recoveryId: incident.recoveryId,
    recoveryAttempt: incident.recoveryAttempt,
    reasonClass: incident.reasonClass,
    failureReason: incident.failureReason,
    status: incident.status,
    blocking: incident.blocking,
    createdAt: new Date(incident.createdAt),
    schemaVersion: incident.schemaVersion,
  };
}

function toDomain(row: IncidentRow): RecoveryIncident {
  return Object.freeze({
    incidentId: row.incidentId,
    workspaceId: row.workspaceId,
    sessionId: row.sessionId,
    recoveryId: row.recoveryId,
    recoveryAttempt: row.recoveryAttempt,
    reasonClass: row.reasonClass as RecoveryIncidentReasonClass,
    failureReason: row.failureReason,
    status: row.status as RecoveryIncidentStatus,
    blocking: true as const,
    createdAt: row.createdAt.toISOString(),
    schemaVersion: row.schemaVersion,
  });
}
