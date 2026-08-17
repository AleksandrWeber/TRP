import { Injectable } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { canonicalJson } from './security-audit-integrity';
import type { SecurityAuditInvestigation } from './security-audit-incident';
import { SecurityAuditIncidentService } from './security-audit-incident.service';
import { retentionDispositionFor } from './security-audit-retention';

export type SecurityAuditInvestigationExport = Readonly<{
  contentType: 'application/json';
  contentHash: string;
  content: string;
}>;

/**
 * Internal export foundation. It renders one workspace-scoped investigation,
 * never alters evidence, and has no HTTP/download surface in S05-e.
 */
@Injectable()
export class SecurityAuditExportService {
  constructor(private readonly incidents: SecurityAuditIncidentService) {}

  async exportIncident(incidentId: string): Promise<SecurityAuditInvestigationExport> {
    return renderInvestigationExport(await this.incidents.investigate(incidentId));
  }
}

export function renderInvestigationExport(
  investigation: SecurityAuditInvestigation,
): SecurityAuditInvestigationExport {
  const content = canonicalJson({
    format: 'security-audit-investigation/v1',
    incident: investigation.incident,
    criticality: investigation.criticality,
    securityImpact: investigation.securityImpact,
    financialIntegrityImpact: investigation.financialIntegrityImpact,
    investigationCompleteness: investigation.investigationCompleteness,
    events: investigation.events.map((event) => ({
      id: event.id,
      eventType: event.eventType,
      eventClass: event.eventClass,
      criticality: event.criticality,
      attribution: event.attribution,
      outcome: event.outcome,
      occurredAt: event.occurredAt,
      recordedAt: event.recordedAt,
      source: event.source,
      eventFingerprint: event.eventFingerprint,
      integrityVersion: event.integrityVersion,
      integrityHash: event.integrityHash,
      payload: event.payload,
      retention: retentionDispositionFor(event),
    })),
  });
  return Object.freeze({
    contentType: 'application/json',
    contentHash: createHash('sha256').update(content).digest('hex'),
    content,
  });
}
