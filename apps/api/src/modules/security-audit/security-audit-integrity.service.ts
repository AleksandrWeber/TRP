import { Inject, Injectable } from '@nestjs/common';
import { integrityHashFor } from './security-audit-integrity';
import type { SecurityAuditRepository } from './security-audit.repository';
import { SECURITY_AUDIT_REPOSITORY } from './security-audit.repository.token';

export type SecurityAuditIntegrityFailure = Readonly<{
  recordId: string;
  reason: 'hash-mismatch';
}>;

export type SecurityAuditIntegrityVerification = Readonly<{
  verified: boolean;
  recordCount: number;
  failures: readonly SecurityAuditIntegrityFailure[];
}>;

/**
 * Internal verification API. It is deliberately not an HTTP endpoint or
 * operator product surface; monitoring and external attestation arrive later.
 */
@Injectable()
export class SecurityAuditIntegrityService {
  constructor(
    @Inject(SECURITY_AUDIT_REPOSITORY)
    private readonly repository: SecurityAuditRepository,
  ) {}

  async verify(): Promise<SecurityAuditIntegrityVerification> {
    const records = await this.repository.readAllForIntegrityVerification();
    const failures = records.flatMap((record) => {
      const { integrityHash, ...content } = record;
      return integrityHashFor(content) === integrityHash
        ? []
        : [{ recordId: record.id, reason: 'hash-mismatch' as const }];
    });
    return Object.freeze({
      verified: failures.length === 0,
      recordCount: records.length,
      failures: Object.freeze(failures),
    });
  }
}
