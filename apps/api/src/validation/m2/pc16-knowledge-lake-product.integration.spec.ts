import { describe, expect, it } from 'vitest';
import { InMemoryWorkspaceRepository } from '../../modules/workspace/repositories/in-memory-workspace.repository';
import { WorkspaceAccessService } from '../../modules/workspace/workspace-access.service';
import { WorkspaceDomainService } from '../../modules/workspace/workspace-domain.service';
import { InMemoryKnowledgeLakeIngestionAdapter } from '../../modules/knowledge-lake/ingestion/in-memory-knowledge-lake-ingestion.adapter';
import { KnowledgeLakeProductController } from '../../modules/knowledge-lake-product/knowledge-lake.controller';
import { KnowledgeLakeProductService } from '../../modules/knowledge-lake-product/knowledge-lake-product.service';
import type { AuthUser } from '../../modules/auth/jwt.strategy';
import { Role } from '../../modules/identity/role';
import { createReportDefinition } from '../../modules/reporting/domain/report-definition';
import { createReportRun } from '../../modules/reporting/domain/report-run';

const OWNER: AuthUser = {
  userId: 'pc16-owner',
  email: 'pc16@example.com',
  displayName: 'PC-16',
  role: Role.Researcher,
};

/**
 * PC-16: Knowledge Lake HTTP over existing query ports.
 * Research `/v1/knowledge` remains a different slice.
 */
describe('PC-16 — Knowledge Lake product', () => {
  it('lists, searches, and reads existing analytical facts as projections', async () => {
    const workspaces = new WorkspaceDomainService(new InMemoryWorkspaceRepository());
    const access = new WorkspaceAccessService(workspaces);
    const workspace = await workspaces.create({ name: 'Paper Lab', ownerUserId: OWNER.userId });
    const lake = new InMemoryKnowledgeLakeIngestionAdapter();
    lake.admit({
      eventId: 'evt-1',
      occurredAt: '2026-08-16T09:00:00.000Z',
      producer: 'trading-session',
      category: 'Trading',
      mode: 'paper',
      workspaceId: workspace.id,
      tradingSessionId: 'session-1',
      correlationId: 'corr-a',
      payload: { kind: 'session-marker' },
      schemaVersion: '1',
    });
    lake.admit({
      eventId: 'evt-2',
      occurredAt: '2026-08-16T09:30:00.000Z',
      producer: 'risk-engine',
      category: 'Risk',
      mode: 'paper',
      workspaceId: workspace.id,
      tradingSessionId: 'session-1',
      correlationId: 'corr-a',
      payload: { kind: 'risk-marker' },
      schemaVersion: '1',
    });
    const definition = createReportDefinition({
      reportDefinitionId: 'def-1',
      workspaceId: workspace.id,
      name: 'Ops Daily',
      kind: 'ops_daily',
      defaultModes: ['paper'],
      metricKeys: ['fact_count'],
      createdAt: '2026-08-16T10:00:00.000Z',
    });
    const run = createReportRun({
      reportRunId: 'run-1',
      workspaceId: workspace.id,
      definition,
      window: { from: '2026-08-16T00:00:00.000Z', to: '2026-08-17T00:00:00.000Z', preset: 'daily' },
      modes: ['paper'],
      status: 'completed',
      sourceSummary: {
        factCount: 1,
        lakeEventIds: ['evt-1'],
        sourceRefs: [{ ownerType: 'knowledge-lake', id: 'evt-1' }],
      },
      createdAt: '2026-08-16T10:00:00.000Z',
    });
    const reportingQuery = {
      listRuns: () => Object.freeze({ items: [run], authorityClass: 'projection' as const }),
      getRun: (id: string) => (id === 'run-1' ? run : null),
      listAggregations: () => Object.freeze([]),
      listDefinitions: () =>
        Object.freeze({ items: [definition], authorityClass: 'projection' as const }),
      getDefinition: () => definition,
    };
    const libraryLookup = {
      getByLibraryEntryId: () => null,
      getByFamilyVersion: () => null,
      list: () =>
        Object.freeze({ items: [], nextCursor: null, authorityClass: 'source_of_truth' as const }),
    };
    const service = new KnowledgeLakeProductService(
      lake,
      reportingQuery as never,
      libraryLookup as never,
    );
    const controller = new KnowledgeLakeProductController(service, access);

    const page = controller.list({ user: OWNER }, workspace.id, { producer: 'risk-engine' });
    expect(page.items).toHaveLength(1);
    expect(page.items[0]?.ledgerSoT).toBe(false);

    const search = controller.search({ user: OWNER }, workspace.id, { q: 'session-marker' });
    expect(search.items.map((row) => row.entryId)).toEqual(['evt-1']);

    const detail = controller.get({ user: OWNER }, workspace.id, { entryId: 'evt-1' });
    expect(detail.relationships.length).toBeGreaterThan(0);
    expect(detail.connectedReports[0]?.reportRunId).toBe('run-1');
    expect(detail.exportKind).toBe('projection-json');

    const history = controller.history({ user: OWNER }, workspace.id, {});
    expect(history.items.map((row) => row.entryId)).toContain('evt-1');

    const provenance = controller.provenance({ user: OWNER }, workspace.id, { entryId: 'evt-1' });
    expect(provenance.mutatesSource).toBe(false);
  });
});
