import type {
  SecurityAuditCriticality,
  SecurityAuditEventClass,
} from './security-audit-classification';

export type SecurityAuditAttribution = Readonly<{
  workspaceId?: string;
  actorId?: string;
  subjectId?: string;
  resourceType?: string;
  resourceId?: string;
  correlationId?: string;
}>;

export type SecurityAuditRecord = Readonly<{
  id: string;
  eventType: string;
  eventClass: SecurityAuditEventClass;
  criticality: SecurityAuditCriticality;
  schemaVersion: 1;
  attribution: SecurityAuditAttribution;
  outcome: string;
  occurredAt: string;
  recordedAt: string;
  source: string;
  eventFingerprint: string;
  payload: Readonly<Record<string, unknown>>;
  integrityVersion: 1;
  integrityHash: string;
}>;

export type SecurityAuditWrite = Readonly<{
  eventType: string;
  attribution?: SecurityAuditAttribution;
  outcome: string;
  occurredAt?: string;
  correlationId?: string;
  source: string;
  payload?: Readonly<Record<string, unknown>>;
}>;

/** Opaque forward-navigation marker for an investigation timeline. */
export type SecurityAuditTimelineCursor = Readonly<{
  occurredAt: string;
  id: string;
}>;

export type SecurityAuditTimelinePage = Readonly<{
  records: readonly SecurityAuditRecord[];
  nextCursor?: SecurityAuditTimelineCursor;
}>;
