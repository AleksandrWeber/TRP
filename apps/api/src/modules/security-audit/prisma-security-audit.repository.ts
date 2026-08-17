import type { Prisma, PrismaClient } from '@prisma/client';
import type { SecurityAuditRecord, SecurityAuditTimelinePage } from './security-audit-record';
import { toSecurityAuditRecord } from './security-audit-record.mapper';
import type { SecurityAuditRepository } from './security-audit.repository';

/** Durable append-only store for Security Audit records (V3-S05-a). */
export class PrismaSecurityAuditRepository implements SecurityAuditRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async append(record: SecurityAuditRecord): Promise<void> {
    await this.prisma.securityAuditRecord.create({
      data: {
        id: record.id,
        eventType: record.eventType,
        eventClass: record.eventClass,
        criticality: record.criticality,
        schemaVersion: record.schemaVersion,
        workspaceId: record.attribution.workspaceId,
        actorId: record.attribution.actorId,
        subjectId: record.attribution.subjectId,
        resourceType: record.attribution.resourceType,
        resourceId: record.attribution.resourceId,
        outcome: record.outcome,
        occurredAt: new Date(record.occurredAt),
        recordedAt: new Date(record.recordedAt),
        correlationId: record.attribution.correlationId,
        source: record.source,
        eventFingerprint: record.eventFingerprint,
        payload: record.payload as Prisma.InputJsonValue,
        integrityVersion: record.integrityVersion,
        integrityHash: record.integrityHash,
      },
    });
  }

  async readAllForIntegrityVerification(): Promise<readonly SecurityAuditRecord[]> {
    const rows = await this.prisma.securityAuditRecord.findMany({
      orderBy: [{ recordedAt: 'asc' }, { id: 'asc' }],
    });
    return rows.map(toSecurityAuditRecord);
  }

  async readTimeline(input: {
    workspaceId: string;
    after?: { occurredAt: string; id: string };
    limit: number;
  }): Promise<SecurityAuditTimelinePage> {
    const rows = await this.prisma.securityAuditRecord.findMany({
      where: {
        workspaceId: input.workspaceId,
        ...(input.after
          ? {
              OR: [
                { occurredAt: { gt: new Date(input.after.occurredAt) } },
                {
                  occurredAt: new Date(input.after.occurredAt),
                  id: { gt: input.after.id },
                },
              ],
            }
          : {}),
      },
      orderBy: [{ occurredAt: 'asc' }, { id: 'asc' }],
      take: input.limit + 1,
    });
    const hasMore = rows.length > input.limit;
    const timelineRows = hasMore ? rows.slice(0, input.limit) : rows;
    const records = timelineRows.map(toSecurityAuditRecord);
    const last = records.at(-1);
    return {
      records,
      ...(hasMore && last ? { nextCursor: { occurredAt: last.occurredAt, id: last.id } } : {}),
    };
  }
}
