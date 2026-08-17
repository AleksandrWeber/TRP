import { describe, expect, it } from 'vitest';
import type {
  SecurityAuditIncident,
  SecurityAuditIncidentEvent,
  SecurityAuditIncidentLifecycleEntry,
  SecurityAuditIncidentRecord,
} from './security-audit-incident';
import type { SecurityAuditIncidentRepository } from './security-audit-incident.repository';
import { SecurityAuditIncidentService } from './security-audit-incident.service';
import type { SecurityAuditRecord } from './security-audit-record';

class InMemoryIncidentRepository implements SecurityAuditIncidentRepository {
  readonly incidents = new Map<string, SecurityAuditIncidentRecord>();
  readonly links: SecurityAuditIncidentEvent[] = [];
  readonly lifecycle: SecurityAuditIncidentLifecycleEntry[] = [];
  constructor(private readonly records: readonly SecurityAuditRecord[]) {}

  async createIncident(incident: SecurityAuditIncident): Promise<void> {
    this.incidents.set(incident.id, {
      id: incident.id,
      workspaceId: incident.workspaceId,
      openedAt: incident.openedAt,
      ...(incident.openedByActorId ? { openedByActorId: incident.openedByActorId } : {}),
    });
  }
  async appendEventLink(link: SecurityAuditIncidentEvent): Promise<void> {
    this.links.push(link);
  }
  async appendLifecycle(entry: SecurityAuditIncidentLifecycleEntry): Promise<void> {
    this.lifecycle.push(entry);
  }
  async readRecordsByIds(ids: readonly string[]): Promise<readonly SecurityAuditRecord[]> {
    return this.records.filter((record) => ids.includes(record.id));
  }
  async readIncident(id: string): Promise<SecurityAuditIncidentRecord | undefined> {
    return this.incidents.get(id);
  }
  async readIncidentIdsForEventIds(
    eventIds: readonly string[],
  ): Promise<ReadonlyMap<string, readonly string[]>> {
    const grouped = new Map<string, string[]>();
    for (const link of this.links) {
      if (!eventIds.includes(link.eventId)) continue;
      const current = grouped.get(link.eventId) ?? [];
      current.push(link.incidentId);
      grouped.set(link.eventId, current);
    }
    return grouped;
  }
  async readIncidentEvents(id: string): Promise<readonly SecurityAuditRecord[]> {
    const ids = this.links.filter((link) => link.incidentId === id).map((link) => link.eventId);
    return this.records.filter((record) => ids.includes(record.id));
  }
  async readLifecycle(id: string): Promise<readonly SecurityAuditIncidentLifecycleEntry[]> {
    return this.lifecycle.filter((entry) => entry.incidentId === id);
  }
}

function event(
  input: Partial<SecurityAuditRecord> & Pick<SecurityAuditRecord, 'id' | 'eventType'>,
): SecurityAuditRecord {
  const { id, eventType, ...overrides } = input;
  const eventClass = eventType === 'vault.lifecycle' ? 'vault' : 'authentication';
  return {
    id,
    eventType,
    eventClass,
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
    integrityHash: 'a'.repeat(64),
    ...overrides,
  };
}

describe('SecurityAuditIncidentService', () => {
  it('links immutable evidence and derives an investigation without copying event facts', async () => {
    const first = event({
      id: 'entry',
      eventType: 'auth.login',
      occurredAt: '2026-08-17T10:00:00.000Z',
    });
    const second = event({
      id: 'vault',
      eventType: 'vault.lifecycle',
      occurredAt: '2026-08-17T10:02:00.000Z',
    });
    const repository = new InMemoryIncidentRepository([second, first]);
    const service = new SecurityAuditIncidentService(repository);

    const investigation = await service.open({
      workspaceId: 'workspace-a',
      eventIds: ['vault', 'entry'],
      openedByActorId: 'admin-a',
      openedAt: '2026-08-17T10:03:00.000Z',
    });

    expect(investigation.events.map((record) => record.id)).toEqual(['entry', 'vault']);
    expect(investigation.securityImpact).toBe('critical');
    expect(investigation.financialIntegrityImpact).toBe('critical');
    expect(investigation.investigationCompleteness.presentStages).toEqual([
      'entry',
      'credential-impact',
    ]);
    expect(investigation.investigationCompleteness.absentStages).toEqual([
      'persistence',
      'escalation',
      'pressure',
    ]);
    expect(repository.links).toEqual([
      expect.objectContaining({ eventId: 'vault' }),
      expect.objectContaining({ eventId: 'entry' }),
    ]);
    expect(investigation.events[1]).toBe(second);
  });

  it('refuses missing or cross-workspace evidence without inventing facts', async () => {
    const foreign = event({
      id: 'foreign',
      eventType: 'auth.login',
      attribution: { workspaceId: 'workspace-b' },
    });
    const service = new SecurityAuditIncidentService(new InMemoryIncidentRepository([foreign]));

    await expect(
      service.open({ workspaceId: 'workspace-a', eventIds: ['foreign'] }),
    ).rejects.toThrow('incident workspace');
    await expect(
      service.open({ workspaceId: 'workspace-a', eventIds: ['missing'] }),
    ).rejects.toThrow('incident workspace');
  });

  it('uses append-only lifecycle entries and refuses evidence after closure', async () => {
    const record = event({ id: 'entry', eventType: 'auth.login' });
    const repository = new InMemoryIncidentRepository([record]);
    const service = new SecurityAuditIncidentService(repository);
    const investigation = await service.open({
      workspaceId: 'workspace-a',
      eventIds: ['entry'],
      openedAt: '2026-08-17T10:30:00.000Z',
    });

    await service.close({
      incidentId: investigation.incident.id,
      occurredAt: '2026-08-17T11:00:00.000Z',
    });
    await expect(
      service.attachEvidence({
        incidentId: investigation.incident.id,
        workspaceId: 'workspace-a',
        eventIds: ['entry'],
      }),
    ).rejects.toThrow('open incident workspace');
    await expect(service.investigate(investigation.incident.id)).resolves.toMatchObject({
      incident: { status: 'closed', closedAt: '2026-08-17T11:00:00.000Z' },
    });
  });

  it('reuses the same deterministic incident for the same evidence', async () => {
    const first = event({ id: 'first', eventType: 'auth.login' });
    const second = event({ id: 'second', eventType: 'vault.lifecycle' });
    const repository = new InMemoryIncidentRepository([first, second]);
    const service = new SecurityAuditIncidentService(repository);

    const initial = await service.open({
      workspaceId: 'workspace-a',
      eventIds: ['second', 'first'],
      openedAt: '2026-08-17T10:00:00.000Z',
    });
    const repeated = await service.open({
      workspaceId: 'workspace-a',
      eventIds: ['first', 'second'],
      openedAt: '2030-01-01T00:00:00.000Z',
    });

    expect(repeated).toEqual(initial);
    expect(repository.incidents.size).toBe(1);
  });
});
