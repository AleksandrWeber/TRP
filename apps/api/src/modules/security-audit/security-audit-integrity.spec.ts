import { describe, expect, it } from 'vitest';
import {
  canonicalJson,
  integrityContentFor,
  integrityHashFor,
  SECURITY_AUDIT_INTEGRITY_VERSION,
} from './security-audit-integrity';
import type { SecurityAuditRecord } from './security-audit-record';

function sampleRecord(
  input: Partial<Omit<SecurityAuditRecord, 'integrityHash'>> = {},
): Omit<SecurityAuditRecord, 'integrityHash'> {
  return {
    id: 'record-1',
    eventType: 'auth.login',
    eventClass: 'authentication',
    criticality: 'critical',
    schemaVersion: 1,
    attribution: Object.freeze({ workspaceId: 'workspace-a', actorId: 'operator-a' }),
    outcome: 'failure',
    occurredAt: '2026-08-17T12:00:00.000Z',
    recordedAt: '2026-08-17T12:00:01.000Z',
    source: 'authentication',
    eventFingerprint: 'fingerprint',
    payload: Object.freeze({ ip: '127.0.0.1' }),
    integrityVersion: SECURITY_AUDIT_INTEGRITY_VERSION,
    ...input,
  };
}

describe('security-audit-integrity', () => {
  it('canonicalizes object key order deterministically', () => {
    expect(canonicalJson({ b: 1, a: 2 })).toBe(canonicalJson({ a: 2, b: 1 }));
  });

  it('seals all persisted audit content except the stored hash', () => {
    const record = sampleRecord();
    expect(integrityContentFor(record)).toEqual({
      integrityVersion: 1,
      id: 'record-1',
      eventType: 'auth.login',
      eventClass: 'authentication',
      criticality: 'critical',
      schemaVersion: 1,
      attribution: record.attribution,
      outcome: 'failure',
      occurredAt: '2026-08-17T12:00:00.000Z',
      recordedAt: '2026-08-17T12:00:01.000Z',
      source: 'authentication',
      eventFingerprint: 'fingerprint',
      payload: record.payload,
    });
  });

  it('produces a stable 64-character hex integrity hash', () => {
    const record = sampleRecord();
    const hash = integrityHashFor(record);
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
    expect(integrityHashFor(record)).toBe(hash);
    expect(integrityHashFor({ ...record, outcome: 'success' })).not.toBe(hash);
  });
});
