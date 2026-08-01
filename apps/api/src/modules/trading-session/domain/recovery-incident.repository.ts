import type { TransactionContext } from '../../../storage/prisma/prisma-transaction.service';
import type { RecoveryIncident } from './recovery-incident';

/**
 * Persistence port for minimal durable Recovery Incident (US293).
 * Implementations belong to trading-session infrastructure.
 */
export interface RecoveryIncidentRepository {
  saveIncident(incident: RecoveryIncident, transaction?: TransactionContext): Promise<void>;

  loadIncident(incidentId: string): Promise<RecoveryIncident | null>;

  /** Latest open Incident for a Session (re-entry / idempotency). */
  loadOpenIncidentBySession(sessionId: string): Promise<RecoveryIncident | null>;
}

export const RECOVERY_INCIDENT_REPOSITORY = Symbol('RECOVERY_INCIDENT_REPOSITORY');
