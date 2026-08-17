import { describe, expect, it } from 'vitest';
import { integrityHashFor } from './security-audit-integrity';
import { renderInvestigationExport } from './security-audit-export.service';
import type { SecurityAuditInvestigation } from './security-audit-incident';

import type { SecurityAuditRecord } from './security-audit-record';

const eventContent = Object.freeze({
  id: 'event-1',
  eventType: 'auth.login',
  eventClass: 'authentication',
  criticality: 'critical',
  schemaVersion: 1,
  attribution: { workspaceId: 'workspace-a', actorId: 'operator-a' },
  outcome: 'failure',
  occurredAt: '2026-08-17T10:00:00.000Z',
  recordedAt: '2026-08-17T10:00:01.000Z',
  source: 'authentication',
  eventFingerprint: 'fingerprint',
  payload: { ip: '127.0.0.1' },
  integrityVersion: 1,
}) satisfies Omit<SecurityAuditRecord, 'integrityHash'>;

const auditEvent: SecurityAuditRecord = Object.freeze({
  ...eventContent,
  integrityHash: integrityHashFor(eventContent),
});

const investigation: SecurityAuditInvestigation = {
  incident: {
    id: 'security-audit-incident:v1:abc',
    workspaceId: 'workspace-a',
    openedAt: '2026-08-17T10:02:00.000Z',
    status: 'open',
  },
  events: [auditEvent],
  criticality: 'critical',
  securityImpact: 'critical',
  financialIntegrityImpact: 'high',
  investigationCompleteness: {
    presentStages: ['entry'],
    absentStages: ['persistence', 'escalation', 'credential-impact', 'pressure'],
  },
};

describe('SecurityAuditExportService foundation', () => {
  it('renders the same evidence as the same deterministic non-secret export', () => {
    const first = renderInvestigationExport(investigation);
    const second = renderInvestigationExport(investigation);

    expect(second).toEqual(first);
    expect(first.contentHash).toMatch(/^[0-9a-f]{64}$/);
    expect(first.content).toContain('"event-1"');
    expect(first.content).not.toContain('password');
    expect(first.content).not.toContain('token');
  });

  it('preserves export integrity metadata that still verifies against event facts', () => {
    const exported = renderInvestigationExport(investigation);
    const parsed = JSON.parse(exported.content) as {
      events: Array<{ integrityHash: string } & Record<string, unknown>>;
    };
    const event = investigation.events[0];
    const { integrityHash, ...content } = event;
    expect(integrityHash).toBe(integrityHashFor(content));
    expect(parsed.events[0].integrityHash).toBe(integrityHash);
  });
});
