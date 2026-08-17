import { Inject, Injectable } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { securityAuditClassificationFor } from './security-audit-classification';
import { deriveIncidentFromLifecycle } from './security-audit-incident-lifecycle';
import type {
  SecurityAuditIncident,
  SecurityAuditIncidentLifecycleEntry,
  SecurityAuditInvestigation,
  SecurityAuditInvestigationCompleteness,
} from './security-audit-incident';
import type { SecurityAuditIncidentRepository } from './security-audit-incident.repository';
import { SECURITY_AUDIT_INCIDENT_REPOSITORY } from './security-audit-incident.repository.token';
import type { SecurityAuditRecord } from './security-audit-record';
import { INVESTIGATION_STAGES, investigationStageFor } from './security-audit-investigation-stage';

/**
 * Internal investigation API (V3-S05-d). It links immutable audit evidence;
 * it never copies, rewrites, or enriches an audit event's facts.
 */
@Injectable()
export class SecurityAuditIncidentService {
  constructor(
    @Inject(SECURITY_AUDIT_INCIDENT_REPOSITORY)
    private readonly repository: SecurityAuditIncidentRepository,
  ) {}

  async open(input: {
    workspaceId: string;
    eventIds: readonly string[];
    openedByActorId?: string;
    openedAt?: string;
  }): Promise<SecurityAuditInvestigation> {
    const workspaceId = required(input.workspaceId, 'Incident requires a workspace.');
    const eventIds = normalizedEventIds(input.eventIds);
    const events = await this.requireWorkspaceEvidence(workspaceId, eventIds);
    const id = deterministicIncidentId(workspaceId, eventIds);
    const existing = await this.repository.readIncident(id);
    if (existing) return this.investigate(id);
    const openedAt = validTimestamp(input.openedAt ?? new Date().toISOString());
    const incident: SecurityAuditIncident = Object.freeze({
      id,
      workspaceId,
      openedAt,
      ...(input.openedByActorId?.trim() ? { openedByActorId: input.openedByActorId.trim() } : {}),
      status: 'open',
    });
    await this.repository.createIncident(incident);
    for (const event of events) {
      await this.repository.appendEventLink({
        incidentId: incident.id,
        eventId: event.id,
        linkedAt: openedAt,
      });
    }
    await this.repository.appendLifecycle({
      incidentId: incident.id,
      status: 'open',
      occurredAt: openedAt,
    });
    return toInvestigation(incident, events);
  }

  async attachEvidence(input: {
    incidentId: string;
    workspaceId: string;
    eventIds: readonly string[];
    linkedAt?: string;
  }): Promise<void> {
    const incident = await this.requireIncident(input.incidentId);
    if (
      incident.status !== 'open' ||
      incident.workspaceId !== required(input.workspaceId, 'Incident requires a workspace.')
    ) {
      throw new Error('Security Audit refuses evidence outside an open incident workspace.');
    }
    const events = await this.requireWorkspaceEvidence(incident.workspaceId, input.eventIds);
    const linkedAt = validTimestamp(input.linkedAt ?? new Date().toISOString());
    for (const event of events) {
      await this.repository.appendEventLink({
        incidentId: incident.id,
        eventId: event.id,
        linkedAt,
      });
    }
  }

  async close(input: { incidentId: string; actorId?: string; occurredAt?: string }): Promise<void> {
    const incident = await this.requireIncident(input.incidentId);
    if (incident.status === 'closed') throw new Error('Security Audit incident is already closed.');
    const entry: SecurityAuditIncidentLifecycleEntry = {
      incidentId: incident.id,
      status: 'closed',
      occurredAt: validTimestamp(input.occurredAt ?? new Date().toISOString()),
      ...(input.actorId?.trim() ? { actorId: input.actorId.trim() } : {}),
    };
    await this.repository.appendLifecycle(entry);
  }

  async investigate(incidentId: string): Promise<SecurityAuditInvestigation> {
    const incident = await this.requireIncident(incidentId);
    const events = await this.repository.readIncidentEvents(incident.id);
    if (events.length === 0) throw new Error('Security Audit incident has no linked evidence.');
    return toInvestigation(incident, events);
  }

  private async requireIncident(id: string): Promise<SecurityAuditIncident> {
    const row = await this.repository.readIncident(required(id, 'Incident id is required.'));
    if (!row) throw new Error('Security Audit incident was not found.');
    return deriveIncidentFromLifecycle(row, await this.repository.readLifecycle(row.id));
  }

  private async requireWorkspaceEvidence(
    workspaceId: string,
    ids: readonly string[],
  ): Promise<readonly SecurityAuditRecord[]> {
    const uniqueIds = normalizedEventIds(ids);
    if (uniqueIds.length === 0)
      throw new Error('Security Audit incident requires linked evidence.');
    const records = await this.repository.readRecordsByIds(uniqueIds);
    if (
      records.length !== uniqueIds.length ||
      records.some((record) => record.attribution.workspaceId !== workspaceId)
    ) {
      throw new Error('Security Audit incident evidence must exist in the incident workspace.');
    }
    return records;
  }
}

function normalizedEventIds(ids: readonly string[]): readonly string[] {
  const uniqueIds = [...new Set(ids.map((id) => id.trim()).filter(Boolean))].sort();
  if (uniqueIds.length === 0) throw new Error('Security Audit incident requires linked evidence.');
  return uniqueIds;
}

function deterministicIncidentId(workspaceId: string, eventIds: readonly string[]): string {
  return `security-audit-incident:v1:${createHash('sha256')
    .update(canonicalIncidentIdentity(workspaceId, eventIds))
    .digest('hex')}`;
}

function canonicalIncidentIdentity(workspaceId: string, eventIds: readonly string[]): string {
  return `${workspaceId}\u0000${eventIds.join('\u0000')}`;
}

function toInvestigation(
  incident: SecurityAuditIncident,
  records: readonly SecurityAuditRecord[],
): SecurityAuditInvestigation {
  const events = [...records].sort(
    (left, right) =>
      Date.parse(left.occurredAt) - Date.parse(right.occurredAt) || left.id.localeCompare(right.id),
  );
  const classifications = events.map((event) => securityAuditClassificationFor(event.eventType));
  if (classifications.some((classification) => !classification)) {
    throw new Error('Security Audit incident contains an unclassified event.');
  }
  return Object.freeze({
    incident,
    events: Object.freeze(events),
    criticality: highest(classifications.map((classification) => classification!.criticality)),
    securityImpact: highest(
      classifications.map((classification) => classification!.securityImpact),
    ),
    financialIntegrityImpact: highest(
      classifications.map((classification) => classification!.financialIntegrityValue),
    ),
    investigationCompleteness: investigationCompletenessFor(events),
  });
}

function investigationCompletenessFor(
  events: readonly SecurityAuditRecord[],
): SecurityAuditInvestigationCompleteness {
  const present = new Set(events.map((event) => investigationStageFor(event)));
  const presentStages = INVESTIGATION_STAGES.filter((stage) => present.has(stage));
  const absentStages = INVESTIGATION_STAGES.filter((stage) => !present.has(stage));
  return Object.freeze({
    presentStages: Object.freeze(presentStages),
    absentStages: Object.freeze(absentStages),
  });
}

function highest<T extends 'critical' | 'high' | 'medium'>(values: readonly T[]): T {
  const rank = { critical: 3, high: 2, medium: 1 };
  return values.reduce((highestValue, value) =>
    rank[value] > rank[highestValue] ? value : highestValue,
  );
}

function required(value: string, message: string): string {
  const normalized = value.trim();
  if (!normalized) throw new Error(message);
  return normalized;
}

function validTimestamp(value: string): string {
  if (Number.isNaN(Date.parse(value)))
    throw new Error('Security Audit requires a valid timestamp.');
  return value;
}
