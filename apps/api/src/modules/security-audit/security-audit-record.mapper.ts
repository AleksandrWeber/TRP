import type { Prisma } from '@prisma/client';
import type { SecurityAuditRecord } from './security-audit-record';

export function toSecurityAuditRecord(row: {
  id: string;
  eventType: string;
  eventClass: string;
  criticality: string;
  schemaVersion: number;
  workspaceId: string | null;
  actorId: string | null;
  subjectId: string | null;
  resourceType: string | null;
  resourceId: string | null;
  outcome: string;
  occurredAt: Date;
  recordedAt: Date;
  correlationId: string | null;
  source: string;
  eventFingerprint: string;
  payload: Prisma.JsonValue;
  integrityVersion: number;
  integrityHash: string;
}): SecurityAuditRecord {
  if (row.schemaVersion !== 1 || row.integrityVersion !== 1) {
    throw new Error(`Unsupported Security Audit record integrity version: ${row.id}`);
  }
  return Object.freeze({
    id: row.id,
    eventType: row.eventType,
    eventClass: row.eventClass as SecurityAuditRecord['eventClass'],
    criticality: row.criticality as SecurityAuditRecord['criticality'],
    schemaVersion: 1,
    attribution: Object.freeze({
      ...(row.workspaceId ? { workspaceId: row.workspaceId } : {}),
      ...(row.actorId ? { actorId: row.actorId } : {}),
      ...(row.subjectId ? { subjectId: row.subjectId } : {}),
      ...(row.resourceType ? { resourceType: row.resourceType } : {}),
      ...(row.resourceId ? { resourceId: row.resourceId } : {}),
      ...(row.correlationId ? { correlationId: row.correlationId } : {}),
    }),
    outcome: row.outcome,
    occurredAt: row.occurredAt.toISOString(),
    recordedAt: row.recordedAt.toISOString(),
    source: row.source,
    eventFingerprint: row.eventFingerprint,
    payload: row.payload as Readonly<Record<string, unknown>>,
    integrityVersion: 1,
    integrityHash: row.integrityHash,
  });
}
