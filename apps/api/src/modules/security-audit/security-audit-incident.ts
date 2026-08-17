import type { SecurityAuditCriticality } from './security-audit-classification';
import type { InvestigationStage } from './security-audit-investigation-stage';
import type { SecurityAuditRecord } from './security-audit-record';

export type SecurityAuditIncidentStatus = 'open' | 'closed';
export type SecurityAuditImpact = 'critical' | 'high' | 'medium';

export type SecurityAuditIncidentRecord = Readonly<{
  id: string;
  workspaceId: string;
  openedAt: string;
  openedByActorId?: string;
}>;

export type SecurityAuditIncident = Readonly<{
  id: string;
  workspaceId: string;
  openedAt: string;
  openedByActorId?: string;
  status: SecurityAuditIncidentStatus;
  closedAt?: string;
  closedByActorId?: string;
}>;

/** Immutable evidence reference. Event facts always stay on SecurityAuditRecord. */
export type SecurityAuditIncidentEvent = Readonly<{
  incidentId: string;
  eventId: string;
  linkedAt: string;
}>;

export type SecurityAuditIncidentLifecycleEntry = Readonly<{
  incidentId: string;
  status: SecurityAuditIncidentStatus;
  occurredAt: string;
  actorId?: string;
}>;

export type SecurityAuditInvestigationCompleteness = Readonly<{
  presentStages: readonly InvestigationStage[];
  absentStages: readonly InvestigationStage[];
}>;

export type SecurityAuditInvestigation = Readonly<{
  incident: SecurityAuditIncident;
  events: readonly SecurityAuditRecord[];
  criticality: SecurityAuditCriticality;
  securityImpact: SecurityAuditImpact;
  financialIntegrityImpact: SecurityAuditImpact;
  investigationCompleteness: SecurityAuditInvestigationCompleteness;
}>;
