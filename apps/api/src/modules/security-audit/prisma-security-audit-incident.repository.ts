import type { PrismaClient } from '@prisma/client';
import type {
  SecurityAuditIncident,
  SecurityAuditIncidentLifecycleEntry,
  SecurityAuditIncidentRecord,
} from './security-audit-incident';
import type { SecurityAuditIncidentRepository } from './security-audit-incident.repository';
import type { SecurityAuditRecord } from './security-audit-record';
import { toSecurityAuditRecord } from './security-audit-record.mapper';

export class PrismaSecurityAuditIncidentRepository implements SecurityAuditIncidentRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async createIncident(incident: SecurityAuditIncident): Promise<void> {
    await this.prisma.securityAuditIncident.create({
      data: {
        id: incident.id,
        workspaceId: incident.workspaceId,
        openedAt: new Date(incident.openedAt),
        openedByActorId: incident.openedByActorId,
      },
    });
  }

  async appendEventLink(link: {
    incidentId: string;
    eventId: string;
    linkedAt: string;
  }): Promise<void> {
    await this.prisma.securityAuditIncidentEvent.create({
      data: {
        incidentId: link.incidentId,
        eventId: link.eventId,
        linkedAt: new Date(link.linkedAt),
      },
    });
  }

  async appendLifecycle(entry: SecurityAuditIncidentLifecycleEntry): Promise<void> {
    await this.prisma.securityAuditIncidentLifecycleEntry.create({
      data: {
        incidentId: entry.incidentId,
        status: entry.status,
        occurredAt: new Date(entry.occurredAt),
        actorId: entry.actorId,
      },
    });
  }

  async readRecordsByIds(ids: readonly string[]): Promise<readonly SecurityAuditRecord[]> {
    const rows = await this.prisma.securityAuditRecord.findMany({
      where: { id: { in: [...ids] } },
    });
    return rows.map(toSecurityAuditRecord);
  }

  async readIncident(id: string): Promise<SecurityAuditIncidentRecord | undefined> {
    const row = await this.prisma.securityAuditIncident.findUnique({ where: { id } });
    if (!row) return undefined;
    return {
      id: row.id,
      workspaceId: row.workspaceId,
      openedAt: row.openedAt.toISOString(),
      ...(row.openedByActorId ? { openedByActorId: row.openedByActorId } : {}),
    };
  }

  async readIncidentEvents(id: string): Promise<readonly SecurityAuditRecord[]> {
    const links = await this.prisma.securityAuditIncidentEvent.findMany({
      where: { incidentId: id },
      include: { event: true },
    });
    return links.map((link) => toSecurityAuditRecord(link.event));
  }

  async readLifecycle(id: string): Promise<readonly SecurityAuditIncidentLifecycleEntry[]> {
    const rows = await this.prisma.securityAuditIncidentLifecycleEntry.findMany({
      where: { incidentId: id },
      orderBy: { occurredAt: 'asc' },
    });
    return rows.map((row) => ({
      incidentId: row.incidentId,
      status: row.status as SecurityAuditIncidentLifecycleEntry['status'],
      occurredAt: row.occurredAt.toISOString(),
      ...(row.actorId ? { actorId: row.actorId } : {}),
    }));
  }

  async readIncidentIdsForEventIds(
    eventIds: readonly string[],
  ): Promise<ReadonlyMap<string, readonly string[]>> {
    if (eventIds.length === 0) return new Map();
    const links = await this.prisma.securityAuditIncidentEvent.findMany({
      where: { eventId: { in: [...eventIds] } },
      select: { eventId: true, incidentId: true },
    });
    const grouped = new Map<string, string[]>();
    for (const link of links) {
      const current = grouped.get(link.eventId) ?? [];
      current.push(link.incidentId);
      grouped.set(link.eventId, current);
    }
    return grouped;
  }
}
