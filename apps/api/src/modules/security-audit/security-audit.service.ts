import { Inject, Injectable } from '@nestjs/common';
import { createHash, randomUUID } from 'node:crypto';
import type { TransactionContext } from '../../storage/prisma/prisma-transaction.service';
import { normalizeSecurityAuditAttribution } from './security-audit-attribution';
import { securityAuditClassificationFor } from './security-audit-classification';
import {
  canonicalJson,
  integrityHashFor,
  SECURITY_AUDIT_INTEGRITY_VERSION,
} from './security-audit-integrity';
import type { SecurityAuditRecord, SecurityAuditWrite } from './security-audit-record';
import type { SecurityAuditRepository } from './security-audit.repository';
import { SECURITY_AUDIT_REPOSITORY } from './security-audit.repository.token';

const SENSITIVE_KEY = /password|passwd|token|hash|secret|cookie|authorization|credential|wrapping/i;

/**
 * Internal write API for the Security Audit Product (V3-S05-a).
 * Emitters retain their domain ownership; this service only accepts classified,
 * non-secret security facts and persists a single immutable audit story.
 */
@Injectable()
export class SecurityAuditService {
  constructor(
    @Inject(SECURITY_AUDIT_REPOSITORY)
    private readonly repository: SecurityAuditRepository,
  ) {}

  async record(
    write: SecurityAuditWrite,
    transaction?: TransactionContext,
  ): Promise<SecurityAuditRecord> {
    const classification = securityAuditClassificationFor(write.eventType);
    if (!classification) {
      throw new Error(`Security Audit refuses unclassified event type: ${write.eventType}`);
    }
    if (!write.outcome.trim() || !write.source.trim()) {
      throw new Error('Security Audit requires an outcome and source.');
    }

    const payload = freezeSafePayload(write.payload ?? {});
    const occurredAt = write.occurredAt ?? new Date().toISOString();
    if (Number.isNaN(Date.parse(occurredAt))) {
      throw new Error('Security Audit requires a valid occurredAt timestamp.');
    }
    const attribution = normalizeSecurityAuditAttribution(
      write.eventType,
      write.attribution,
      write.correlationId,
    );
    const fingerprint = fingerprintFor({
      eventType: write.eventType,
      outcome: write.outcome,
      source: write.source,
      attribution,
      payload,
    });
    const recordWithoutIntegrity = {
      id: randomUUID(),
      eventType: write.eventType,
      eventClass: classification.eventClass,
      criticality: classification.criticality,
      schemaVersion: 1,
      attribution,
      outcome: write.outcome,
      occurredAt,
      recordedAt: new Date().toISOString(),
      source: write.source,
      eventFingerprint: fingerprint,
      payload,
      integrityVersion: SECURITY_AUDIT_INTEGRITY_VERSION,
    } as const;
    const record: SecurityAuditRecord = Object.freeze({
      ...recordWithoutIntegrity,
      integrityHash: integrityHashFor(recordWithoutIntegrity),
    });
    await this.repository.append(record, transaction);
    return record;
  }
}

function freezeSafePayload(
  value: Readonly<Record<string, unknown>>,
): Readonly<Record<string, unknown>> {
  assertSafeValue(value);
  return Object.freeze(structuredClone(value));
}

function assertSafeValue(value: unknown): void {
  if (Array.isArray(value)) {
    value.forEach(assertSafeValue);
    return;
  }
  if (value && typeof value === 'object') {
    for (const [key, child] of Object.entries(value)) {
      if (SENSITIVE_KEY.test(key)) {
        throw new Error(`Security Audit refuses sensitive field: ${key}`);
      }
      assertSafeValue(child);
    }
  }
}

function fingerprintFor(value: unknown): string {
  return createHash('sha256').update(canonicalJson(value)).digest('hex');
}
