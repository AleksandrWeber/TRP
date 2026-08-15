import { describe, expect, it, vi } from 'vitest';
import { InMemoryWorkspaceRepository } from '../../modules/workspace/repositories/in-memory-workspace.repository';
import { WorkspaceAccessService } from '../../modules/workspace/workspace-access.service';
import { WorkspaceDomainService } from '../../modules/workspace/workspace-domain.service';
import { createReportDefinition } from '../../modules/reporting/domain/report-definition';
import { createReportRun } from '../../modules/reporting/domain/report-run';
import { createAggregationSlice } from '../../modules/reporting/domain/aggregation-slice';
import { ReportingRunController } from '../../modules/reporting-product/reporting.controller';
import { ReportingProductService } from '../../modules/reporting-product/reporting-product.service';
import type { AuthUser } from '../../modules/auth/jwt.strategy';
import { Role } from '../../modules/identity/role';
import type { ReportRunNarrativeView } from '../../modules/product-flow/report-run-narrative.view';
import type { DeliveryResult } from '../../modules/notification-delivery/domain/delivery';

const OWNER: AuthUser = {
  userId: 'pc05-owner',
  email: 'pc05@example.com',
  displayName: 'PC-05',
  role: Role.Researcher,
};

const createdAt = '2026-08-15T18:00:00.000Z';

/**
 * PC-05: Reporting HTTP over existing query ports.
 * AI remains narrative only. Notification remains delivery only.
 */
describe('PC-05 — Reporting product', () => {
  it('lists and reads existing ReportRuns with narrative and delivery attached', async () => {
    const workspaces = new WorkspaceDomainService(new InMemoryWorkspaceRepository());
    const access = new WorkspaceAccessService(workspaces);
    const workspace = await workspaces.create({ name: 'Paper Lab', ownerUserId: OWNER.userId });
    const definition = createReportDefinition({
      reportDefinitionId: 'def-1',
      workspaceId: workspace.id,
      name: 'Ops Daily',
      kind: 'ops_daily',
      defaultModes: ['paper'],
      metricKeys: ['fact_count'],
      createdAt,
    });
    const run = createReportRun({
      reportRunId: 'run-1',
      workspaceId: workspace.id,
      definition,
      window: {
        from: '2026-08-15T00:00:00.000Z',
        to: '2026-08-16T00:00:00.000Z',
        preset: 'daily',
      },
      modes: ['paper'],
      status: 'completed',
      sourceSummary: {
        factCount: 1,
        lakeEventIds: ['evt-1'],
        sourceRefs: [{ ownerType: 'knowledge-lake', id: 'evt-1' }],
      },
      createdAt,
    });
    const slice = createAggregationSlice({
      sliceId: 'slice-1',
      reportRunId: 'run-1',
      metricKey: 'fact_count',
      label: 'Facts',
      value: 1,
      sourceRefs: [{ ownerType: 'knowledge-lake', id: 'evt-1' }],
    });
    const reportingQuery = {
      listRuns: () => Object.freeze({ items: [run], authorityClass: 'projection' as const }),
      getRun: (id: string) => (id === 'run-1' ? run : null),
      listAggregations: () => Object.freeze([slice]),
      listDefinitions: () =>
        Object.freeze({ items: [definition], authorityClass: 'projection' as const }),
      getDefinition: (id: string) => (id === 'def-1' ? definition : null),
    };
    const delivery = Object.freeze({
      deliveryId: 'del-1',
      workspaceId: workspace.id,
      userId: OWNER.userId,
      type: 'daily-report',
      reportRunId: 'run-1',
      attempts: Object.freeze([]),
      outcome: 'skipped',
      createdAt,
    }) as DeliveryResult;
    const notifications = {
      listDeliveries: vi.fn(() => [delivery]),
      deliver: vi.fn(),
    };
    const narratives = {
      getAttachedNarrative: vi.fn((): ReportRunNarrativeView =>
        Object.freeze({
          reportRunId: 'run-1',
          workspaceId: workspace.id,
          reportStatus: 'completed',
          reportOutcome: 'completed',
          narrativeId: 'nar-1',
          narrativeKind: 'narrative',
          narrativeText: 'Projection only.',
          narrativeUnavailable: false,
          attached: true,
          reportMutated: false,
          forcesTrade: false,
          authorityClass: 'narrative',
        }),
      ),
    };
    const service = new ReportingProductService(
      reportingQuery as never,
      narratives as never,
      notifications as never,
    );
    const controller = new ReportingRunController(service, access);

    const page = controller.list({ user: OWNER }, workspace.id, { status: 'completed' });
    expect(page.items).toHaveLength(1);
    expect(page.items[0]?.name).toBe('Ops Daily');
    expect(page.items[0]?.ledgerSoT).toBe(false);

    const detail = controller.get({ user: OWNER }, workspace.id, { reportRunId: 'run-1' });
    expect(detail.aggregations[0]?.value).toBe(1);
    expect(detail.narrative?.narrativeText).toBe('Projection only.');
    expect(detail.delivery?.outcome).toBe('skipped');
    expect(detail.exportKind).toBe('projection-json');
    expect(notifications.deliver).not.toHaveBeenCalled();
  });
});
