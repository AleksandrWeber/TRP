import { describe, expect, it } from 'vitest';
import type {
  SecurityAuditRecord,
  SecurityAuditTimelineCursor,
  SecurityAuditTimelinePage,
} from './security-audit-record';
import { SecurityAuditIntegrityService } from './security-audit-integrity.service';
import type { SecurityAuditRepository } from './security-audit.repository';
import { SecurityAuditService } from './security-audit.service';

class InMemorySecurityAuditRepository implements SecurityAuditRepository {
  readonly records: SecurityAuditRecord[] = [];

  async append(record: SecurityAuditRecord): Promise<void> {
    this.records.push(record);
  }

  async readAllForIntegrityVerification(): Promise<readonly SecurityAuditRecord[]> {
    return this.records;
  }

  async readTimeline(_input: {
    workspaceId: string;
    after?: SecurityAuditTimelineCursor;
    limit: number;
  }): Promise<SecurityAuditTimelinePage> {
    return { records: [] };
  }
}

describe('SecurityAuditIntegrityService', () => {
  it('deterministically verifies an append-only audit record', async () => {
    const repository = new InMemorySecurityAuditRepository();
    const audit = new SecurityAuditService(repository);
    const integrity = new SecurityAuditIntegrityService(repository);

    await audit.record({
      eventType: 'auth.login',
      source: 'authentication',
      outcome: 'failure',
      occurredAt: '2026-08-17T12:00:00.000Z',
      payload: { ip: '127.0.0.1' },
    });

    await expect(integrity.verify()).resolves.toEqual({
      verified: true,
      recordCount: 1,
      failures: [],
    });
  });

  it('fails closed when stored audit content no longer matches its integrity metadata', async () => {
    const repository = new InMemorySecurityAuditRepository();
    const audit = new SecurityAuditService(repository);
    const integrity = new SecurityAuditIntegrityService(repository);
    const record = await audit.record({
      eventType: 'authz.role-change',
      source: 'identity',
      outcome: 'assigned',
      occurredAt: '2026-08-17T12:00:00.000Z',
      attribution: {
        workspaceId: 'workspace-a',
        actorId: 'admin-1',
        subjectId: 'user-2',
        resourceType: 'user-role',
      },
      payload: { fromRole: 'RESEARCHER', toRole: 'TRADER' },
    });
    repository.records[0] = { ...record, outcome: 'refused' };

    await expect(integrity.verify()).resolves.toEqual({
      verified: false,
      recordCount: 1,
      failures: [{ recordId: record.id, reason: 'hash-mismatch' }],
    });
  });
});
