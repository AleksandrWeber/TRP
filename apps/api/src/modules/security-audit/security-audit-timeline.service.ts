import { Inject, Injectable } from '@nestjs/common';
import type { SecurityAuditRecord, SecurityAuditTimelineCursor } from './security-audit-record';
import type { SecurityAuditIncidentRepository } from './security-audit-incident.repository';
import { SECURITY_AUDIT_INCIDENT_REPOSITORY } from './security-audit-incident.repository.token';
import {
  investigationGroupFor,
  investigationStageFor,
  type InvestigationStage,
} from './security-audit-investigation-stage';
import type { SecurityAuditRepository } from './security-audit.repository';
import { SECURITY_AUDIT_REPOSITORY } from './security-audit.repository.token';

const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 100;

export type { InvestigationStage };

export type SecurityAuditTimelineEntry = Readonly<{
  id: string;
  occurredAt: string;
  eventType: string;
  eventClass: SecurityAuditRecord['eventClass'];
  criticality: SecurityAuditRecord['criticality'];
  outcome: string;
  investigationStage: InvestigationStage;
  investigationGroup: string;
  incidentIds?: readonly string[];
  actorId?: string;
  subjectId?: string;
  resourceType?: string;
  resourceId?: string;
}>;

export type SecurityAuditTimeline = Readonly<{
  entries: readonly SecurityAuditTimelineEntry[];
  nextCursor?: string;
}>;

/**
 * Investigation-focused, workspace-scoped chronological read model (V3-S05-b/d).
 * S05-d enrichment adds incident containment references without copying event facts.
 */
@Injectable()
export class SecurityAuditTimelineService {
  constructor(
    @Inject(SECURITY_AUDIT_REPOSITORY)
    private readonly repository: SecurityAuditRepository,
    @Inject(SECURITY_AUDIT_INCIDENT_REPOSITORY)
    private readonly incidentRepository: SecurityAuditIncidentRepository,
  ) {}

  async readWorkspaceTimeline(input: {
    workspaceId: string;
    cursor?: string;
    pageSize?: number;
  }): Promise<SecurityAuditTimeline> {
    const workspaceId = input.workspaceId.trim();
    if (!workspaceId) throw new Error('Security Audit timeline requires a workspace.');
    const page = await this.repository.readTimeline({
      workspaceId,
      after: decodeCursor(input.cursor),
      limit: boundedPageSize(input.pageSize),
    });
    const incidentIdsByEvent = await this.incidentRepository.readIncidentIdsForEventIds(
      page.records.map((record) => record.id),
    );
    return Object.freeze({
      entries: Object.freeze(
        page.records.map((record) => toTimelineEntry(record, incidentIdsByEvent.get(record.id))),
      ),
      ...(page.nextCursor ? { nextCursor: encodeCursor(page.nextCursor) } : {}),
    });
  }
}

function toTimelineEntry(
  record: SecurityAuditRecord,
  incidentIds: readonly string[] | undefined,
): SecurityAuditTimelineEntry {
  return Object.freeze({
    id: record.id,
    occurredAt: record.occurredAt,
    eventType: record.eventType,
    eventClass: record.eventClass,
    criticality: record.criticality,
    outcome: record.outcome,
    investigationStage: investigationStageFor(record),
    investigationGroup: investigationGroupFor(record),
    ...(incidentIds?.length ? { incidentIds: Object.freeze([...incidentIds]) } : {}),
    ...(record.attribution.actorId ? { actorId: record.attribution.actorId } : {}),
    ...(record.attribution.subjectId ? { subjectId: record.attribution.subjectId } : {}),
    ...(record.attribution.resourceType ? { resourceType: record.attribution.resourceType } : {}),
    ...(record.attribution.resourceId ? { resourceId: record.attribution.resourceId } : {}),
  });
}

function boundedPageSize(value: number | undefined): number {
  if (value === undefined) return DEFAULT_PAGE_SIZE;
  if (!Number.isInteger(value) || value < 1 || value > MAX_PAGE_SIZE) {
    throw new Error(`Security Audit timeline pageSize must be between 1 and ${MAX_PAGE_SIZE}.`);
  }
  return value;
}

function encodeCursor(cursor: SecurityAuditTimelineCursor): string {
  return Buffer.from(JSON.stringify(cursor)).toString('base64url');
}

function decodeCursor(value: string | undefined): SecurityAuditTimelineCursor | undefined {
  if (value === undefined) return undefined;
  try {
    const parsed: unknown = JSON.parse(Buffer.from(value, 'base64url').toString('utf8'));
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      'occurredAt' in parsed &&
      'id' in parsed &&
      typeof parsed.occurredAt === 'string' &&
      typeof parsed.id === 'string' &&
      !Number.isNaN(Date.parse(parsed.occurredAt)) &&
      parsed.id.trim() !== ''
    ) {
      return { occurredAt: parsed.occurredAt, id: parsed.id };
    }
  } catch {
    // Invalid cursors never broaden a timeline query.
  }
  throw new Error('Security Audit timeline cursor is invalid.');
}
