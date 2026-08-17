import { describe, expect, it } from 'vitest';
import type {
  SecurityAuditRecord,
  SecurityAuditTimelineCursor,
  SecurityAuditTimelinePage,
} from './security-audit-record';
import { integrityHashFor } from './security-audit-integrity';
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

describe('SecurityAuditService', () => {
  it('persists one immutable, classified security fact', async () => {
    const repository = new InMemorySecurityAuditRepository();
    const service = new SecurityAuditService(repository);

    const record = await service.record({
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

    expect(record).toMatchObject({
      eventClass: 'privilege',
      criticality: 'critical',
      schemaVersion: 1,
      outcome: 'assigned',
      integrityVersion: 1,
    });
    expect(record.integrityHash).toMatch(/^[0-9a-f]{64}$/);
    const { integrityHash, ...content } = record;
    expect(integrityHashFor(content)).toBe(integrityHash);
    expect(repository.records).toEqual([record]);
    expect(Object.isFrozen(record)).toBe(true);
    expect(Object.isFrozen(record.payload)).toBe(true);
  });

  it('gives equivalent security facts the same deterministic fingerprint', async () => {
    const service = new SecurityAuditService(new InMemorySecurityAuditRepository());
    const first = await service.record({
      eventType: 'auth.login',
      source: 'authentication',
      outcome: 'failure',
      payload: { ip: '127.0.0.1', userAgent: 'test' },
    });
    const second = await service.record({
      eventType: 'auth.login',
      source: 'authentication',
      outcome: 'failure',
      payload: { userAgent: 'test', ip: '127.0.0.1' },
    });

    expect(second.eventFingerprint).toBe(first.eventFingerprint);
  });

  it('refuses unclassified events and secret-shaped payloads', async () => {
    const service = new SecurityAuditService(new InMemorySecurityAuditRepository());

    await expect(
      service.record({ eventType: 'technical.retry', source: 'worker', outcome: 'retry' }),
    ).rejects.toThrow('unclassified');
    await expect(
      service.record({
        eventType: 'auth.login',
        source: 'authentication',
        outcome: 'success',
        payload: { sessionToken: 'never-persist' },
      }),
    ).rejects.toThrow('sensitive field');
  });

  it('persists Identity-global role attribution without a workspace', async () => {
    const service = new SecurityAuditService(new InMemorySecurityAuditRepository());

    await expect(
      service.record({
        eventType: 'authz.role-change',
        source: 'identity',
        outcome: 'assigned',
        attribution: {
          actorId: 'admin-1',
          subjectId: 'user-2',
          resourceType: 'user-role',
          resourceId: 'user-2',
        },
      }),
    ).resolves.toMatchObject({
      eventType: 'authz.role-change',
      attribution: {
        actorId: 'admin-1',
        subjectId: 'user-2',
        resourceType: 'user-role',
        resourceId: 'user-2',
      },
    });
  });
});
