import { describe, expect, it } from 'vitest';
import type {
  SecurityAuditRecord,
  SecurityAuditTimelineCursor,
  SecurityAuditTimelinePage,
} from './security-audit-record';
import type { SecurityAuditIncidentRepository } from './security-audit-incident.repository';
import type { SecurityAuditRepository } from './security-audit.repository';
import { SecurityAuditTimelineService } from './security-audit-timeline.service';

class InMemoryIncidentRepository implements SecurityAuditIncidentRepository {
  constructor(private readonly links: ReadonlyMap<string, readonly string[]>) {}

  async createIncident(): Promise<void> {}
  async appendEventLink(): Promise<void> {}
  async appendLifecycle(): Promise<void> {}
  async readRecordsByIds(): Promise<readonly SecurityAuditRecord[]> {
    return [];
  }
  async readIncident(): Promise<undefined> {
    return undefined;
  }
  async readIncidentEvents(): Promise<readonly SecurityAuditRecord[]> {
    return [];
  }
  async readLifecycle(): Promise<[]> {
    return [];
  }
  async readIncidentIdsForEventIds(
    eventIds: readonly string[],
  ): Promise<ReadonlyMap<string, readonly string[]>> {
    const grouped = new Map<string, string[]>();
    for (const eventId of eventIds) {
      const incidentIds = this.links.get(eventId);
      if (incidentIds?.length) grouped.set(eventId, [...incidentIds]);
    }
    return grouped;
  }
}

class InMemorySecurityAuditRepository implements SecurityAuditRepository {
  constructor(private readonly records: readonly SecurityAuditRecord[]) {}

  async append(): Promise<void> {}

  async readAllForIntegrityVerification(): Promise<readonly SecurityAuditRecord[]> {
    return this.records;
  }

  async readTimeline(input: {
    workspaceId: string;
    after?: SecurityAuditTimelineCursor;
    limit: number;
  }): Promise<SecurityAuditTimelinePage> {
    const records = this.records
      .filter((record) => record.attribution.workspaceId === input.workspaceId)
      .sort(
        (left, right) =>
          Date.parse(left.occurredAt) - Date.parse(right.occurredAt) ||
          left.id.localeCompare(right.id),
      )
      .filter(
        (record) =>
          !input.after ||
          Date.parse(record.occurredAt) > Date.parse(input.after.occurredAt) ||
          (record.occurredAt === input.after.occurredAt && record.id > input.after.id),
      );
    const page = records.slice(0, input.limit);
    const last = page.at(-1);
    return {
      records: page,
      ...(records.length > input.limit && last
        ? { nextCursor: { occurredAt: last.occurredAt, id: last.id } }
        : {}),
    };
  }
}

function record(
  input: Partial<SecurityAuditRecord> & Pick<SecurityAuditRecord, 'id'>,
): SecurityAuditRecord {
  return {
    eventType: 'auth.login',
    eventClass: 'authentication',
    criticality: 'critical',
    schemaVersion: 1,
    attribution: { workspaceId: 'workspace-a', actorId: 'operator-a' },
    outcome: 'success',
    occurredAt: '2026-08-17T10:00:00.000Z',
    recordedAt: '2026-08-17T10:00:01.000Z',
    source: 'test',
    eventFingerprint: 'fingerprint',
    payload: {},
    integrityVersion: 1,
    integrityHash: 'integrity-hash',
    ...input,
  };
}

function timelineService(
  records: readonly SecurityAuditRecord[],
  links: ReadonlyMap<string, readonly string[]> = new Map(),
): SecurityAuditTimelineService {
  return new SecurityAuditTimelineService(
    new InMemorySecurityAuditRepository(records),
    new InMemoryIncidentRepository(links),
  );
}

describe('SecurityAuditTimelineService', () => {
  it('returns a workspace-scoped chronological investigation narrative', async () => {
    const service = timelineService([
      record({
        id: '3',
        eventType: 'vault.lifecycle',
        eventClass: 'vault',
        occurredAt: '2026-08-17T10:03:00.000Z',
      }),
      record({
        id: '2',
        eventType: 'authz.role-change',
        eventClass: 'privilege',
        occurredAt: '2026-08-17T10:02:00.000Z',
        attribution: {
          workspaceId: 'workspace-a',
          actorId: 'operator-a',
          subjectId: 'operator-b',
        },
      }),
      record({
        id: '1',
        eventType: 'auth.session',
        eventClass: 'session',
        occurredAt: '2026-08-17T10:01:00.000Z',
      }),
      record({ id: 'foreign', attribution: { workspaceId: 'workspace-b' } }),
    ]);

    const timeline = await service.readWorkspaceTimeline({ workspaceId: 'workspace-a' });

    expect(timeline.entries.map((entry) => entry.id)).toEqual(['1', '2', '3']);
    expect(timeline.entries.map((entry) => entry.investigationStage)).toEqual([
      'persistence',
      'escalation',
      'credential-impact',
    ]);
    expect(timeline.entries[1].investigationGroup).toBe('subject:operator-b');
  });

  it('enriches timeline entries with incident containment references', async () => {
    const service = timelineService(
      [record({ id: 'entry' }), record({ id: 'other', occurredAt: '2026-08-17T10:01:00.000Z' })],
      new Map([['entry', ['incident-1', 'incident-2']]]),
    );

    const timeline = await service.readWorkspaceTimeline({ workspaceId: 'workspace-a' });

    expect(timeline.entries[0].incidentIds).toEqual(['incident-1', 'incident-2']);
    expect(timeline.entries[1].incidentIds).toBeUndefined();
  });

  it('navigates forward with an opaque chronological cursor', async () => {
    const service = timelineService([
      record({ id: '1' }),
      record({ id: '2', occurredAt: '2026-08-17T10:01:00.000Z' }),
      record({ id: '3', occurredAt: '2026-08-17T10:02:00.000Z' }),
    ]);

    const first = await service.readWorkspaceTimeline({ workspaceId: 'workspace-a', pageSize: 2 });
    const second = await service.readWorkspaceTimeline({
      workspaceId: 'workspace-a',
      cursor: first.nextCursor,
      pageSize: 2,
    });

    expect(first.entries.map((entry) => entry.id)).toEqual(['1', '2']);
    expect(second.entries.map((entry) => entry.id)).toEqual(['3']);
    expect(second.nextCursor).toBeUndefined();
  });

  it('refuses malformed cursors and page sizes rather than broadening history', async () => {
    const service = timelineService([]);

    await expect(
      service.readWorkspaceTimeline({ workspaceId: 'workspace-a', cursor: 'invalid' }),
    ).rejects.toThrow('cursor is invalid');
    await expect(
      service.readWorkspaceTimeline({ workspaceId: 'workspace-a', pageSize: 101 }),
    ).rejects.toThrow('pageSize');
  });
});
