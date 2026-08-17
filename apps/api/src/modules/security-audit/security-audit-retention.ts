import { securityAuditClassificationFor } from './security-audit-classification';
import type { SecurityAuditRecord } from './security-audit-record';

export type SecurityAuditRetentionDisposition = Readonly<{
  expiresAt: string;
  retention: 'long' | 'longest' | 'medium-long';
}>;

const RETENTION_DAYS = Object.freeze({
  'medium-long': 180,
  long: 365,
  longest: 730,
});

/**
 * Interim retention policy (V3-S05-e). Disposition follows the approved event
 * classification catalogue only. Deletion or archiving is not part of this slice.
 */
export function retentionDispositionFor(
  record: Pick<SecurityAuditRecord, 'occurredAt' | 'eventType'>,
): SecurityAuditRetentionDisposition {
  const classification = securityAuditClassificationFor(record.eventType);
  if (!classification) {
    throw new Error(
      `Security Audit retention requires a classified event type: ${record.eventType}`,
    );
  }
  const occurredAt = new Date(record.occurredAt);
  if (Number.isNaN(occurredAt.getTime())) {
    throw new Error('Security Audit retention requires a valid occurredAt timestamp.');
  }
  occurredAt.setUTCDate(occurredAt.getUTCDate() + RETENTION_DAYS[classification.retention]);
  return Object.freeze({
    retention: classification.retention,
    expiresAt: occurredAt.toISOString(),
  });
}
