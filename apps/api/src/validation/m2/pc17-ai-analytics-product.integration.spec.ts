import { describe, expect, it } from 'vitest';
import { InMemoryWorkspaceRepository } from '../../modules/workspace/repositories/in-memory-workspace.repository';
import { WorkspaceAccessService } from '../../modules/workspace/workspace-access.service';
import { WorkspaceDomainService } from '../../modules/workspace/workspace-domain.service';
import { InMemoryKnowledgeLakeIngestionAdapter } from '../../modules/knowledge-lake/ingestion/in-memory-knowledge-lake-ingestion.adapter';
import { AiAnalyticsProductController } from '../../modules/ai-analytics-product/ai-analytics.controller';
import { AiAnalyticsProductService } from '../../modules/ai-analytics-product/ai-analytics-product.service';
import { AiAnalyticsService } from '../../modules/ai-analytics/ai-analytics.service';
import type { AuthUser } from '../../modules/auth/jwt.strategy';
import { Role } from '../../modules/identity/role';
import { createReportDefinition } from '../../modules/reporting/domain/report-definition';
import { createReportRun } from '../../modules/reporting/domain/report-run';

const OWNER: AuthUser = {
  userId: 'pc17-owner',
  email: 'pc17@example.com',
  displayName: 'PC-17',
  role: Role.Researcher,
};

/**
 * PC-17: AI Analytics HTTP over existing generation ports.
 * Research `/v1/ai/execute` remains a different slice.
 */
describe('PC-17 — AI Analytics product', () => {
  it('generates and inspects narratives from existing reports only', async () => {
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
      payload: { kind: 'session-marker' },
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
    const reporting = {
      requestReportRun: () => {
        throw new Error('must not generate reports');
      },
      compareRuns: () => Object.freeze([]),
      registerDefinition: () => {
        throw new Error('must not register definitions');
      },
    };
    const libraryLookup = {
      getByLibraryEntryId: () => null,
      getByFamilyVersion: () => null,
      list: () =>
        Object.freeze({ items: [], nextCursor: null, authorityClass: 'source_of_truth' as const }),
    };
    const service = new AiAnalyticsProductService(
      new AiAnalyticsService(reportingQuery),
      reportingQuery as never,
      reporting as never,
      lake,
      libraryLookup as never,
    );
    const controller = new AiAnalyticsProductController(service, access);

    const generated = controller.generate({ user: OWNER }, workspace.id, {
      reportRunId: 'run-1',
      kind: 'narrative',
    });
    expect(generated.authorityClass).toBe('narrative');
    expect(generated.sourceOfTruth).toBe(false);
    expect(generated.forcesTrade).toBe(false);
    expect(generated.text.length).toBeGreaterThan(0);

    const page = controller.list({ user: OWNER }, workspace.id, { kind: 'narrative' });
    expect(page.items.map((row) => row.analysisId)).toContain(generated.analysisId);

    const detail = controller.get({ user: OWNER }, workspace.id, {
      analysisId: generated.analysisId,
    });
    expect(detail.reasoning.ownsFacts).toBe(false);
    expect(detail.knowledgeRefs[0]?.entryId).toBe('evt-1');

    const history = controller.history({ user: OWNER }, workspace.id, {});
    expect(history.items.map((row) => row.analysisId)).toContain(generated.analysisId);

    const provenance = controller.provenance({ user: OWNER }, workspace.id, {
      analysisId: generated.analysisId,
    });
    expect(provenance.mutatesSource).toBe(false);
  });
});
