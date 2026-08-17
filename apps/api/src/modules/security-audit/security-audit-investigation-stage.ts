import type { SecurityAuditRecord } from './security-audit-record';

export type InvestigationStage =
  'entry' | 'persistence' | 'escalation' | 'credential-impact' | 'pressure';

export const INVESTIGATION_STAGES: readonly InvestigationStage[] = Object.freeze([
  'entry',
  'persistence',
  'escalation',
  'credential-impact',
  'pressure',
]);

export function investigationStageFor(record: SecurityAuditRecord): InvestigationStage {
  switch (record.eventClass) {
    case 'authentication':
    case 'recovery':
      return 'entry';
    case 'session':
      return 'persistence';
    case 'authorization':
    case 'privilege':
      return 'escalation';
    case 'vault':
    case 'connection':
      return 'credential-impact';
    case 'security-platform':
      return 'pressure';
  }
}

export function investigationGroupFor(record: SecurityAuditRecord): string {
  const correlationId = record.attribution.correlationId;
  if (correlationId) return `correlation:${correlationId}`;
  const subjectId = record.attribution.subjectId;
  if (subjectId) return `subject:${subjectId}`;
  const actorId = record.attribution.actorId;
  if (actorId) return `actor:${actorId}`;
  return `workspace:${record.attribution.workspaceId ?? 'unscoped'}`;
}
