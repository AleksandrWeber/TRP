import { createHash } from 'node:crypto';
import type { SecurityAuditRecord } from './security-audit-record';

export const SECURITY_AUDIT_INTEGRITY_VERSION = 1 as const;

/**
 * Canonical, versioned content seal for one immutable Security Audit record.
 * It deliberately has no event-to-event dependency, leaving later Incident
 * containment and independent tamper-evidence mechanisms free to evolve.
 */
export function integrityHashFor(record: Omit<SecurityAuditRecord, 'integrityHash'>): string {
  return createHash('sha256')
    .update(canonicalJson(integrityContentFor(record)))
    .digest('hex');
}

export function integrityContentFor(record: Omit<SecurityAuditRecord, 'integrityHash'>): unknown {
  return {
    integrityVersion: record.integrityVersion,
    id: record.id,
    eventType: record.eventType,
    eventClass: record.eventClass,
    criticality: record.criticality,
    schemaVersion: record.schemaVersion,
    attribution: record.attribution,
    outcome: record.outcome,
    occurredAt: record.occurredAt,
    recordedAt: record.recordedAt,
    source: record.source,
    eventFingerprint: record.eventFingerprint,
    payload: record.payload,
  };
}

export function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, child]) => `${JSON.stringify(key)}:${canonicalJson(child)}`)
      .join(',')}}`;
  }
  return JSON.stringify(value);
}
