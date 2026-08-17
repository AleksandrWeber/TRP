import type {
  SecurityAuditIncident,
  SecurityAuditIncidentEvent,
  SecurityAuditIncidentLifecycleEntry,
  SecurityAuditIncidentRecord,
} from './security-audit-incident';
import type { SecurityAuditRecord } from './security-audit-record';

/** Persistence boundary for the Incident → contains → Events model. */
export interface SecurityAuditIncidentRepository {
  createIncident(incident: SecurityAuditIncident): Promise<void>;
  appendEventLink(link: SecurityAuditIncidentEvent): Promise<void>;
  appendLifecycle(entry: SecurityAuditIncidentLifecycleEntry): Promise<void>;
  readRecordsByIds(ids: readonly string[]): Promise<readonly SecurityAuditRecord[]>;
  readIncident(id: string): Promise<SecurityAuditIncidentRecord | undefined>;
  readIncidentEvents(id: string): Promise<readonly SecurityAuditRecord[]>;
  readLifecycle(id: string): Promise<readonly SecurityAuditIncidentLifecycleEntry[]>;
  readIncidentIdsForEventIds(
    eventIds: readonly string[],
  ): Promise<ReadonlyMap<string, readonly string[]>>;
}
