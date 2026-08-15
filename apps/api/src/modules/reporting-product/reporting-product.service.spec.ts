import { describe, expect, it, vi } from 'vitest';
import type { DeliveryResult } from '../notification-delivery/domain/delivery';
import type { ReportRunNarrativeView } from '../product-flow/report-run-narrative.view';
import { createReportDefinition } from '../reporting/domain/report-definition';
import { createReportRun } from '../reporting/domain/report-run';
import { createAggregationSlice } from '../reporting/domain/aggregation-slice';
import { ReportingProductService } from './reporting-product.service';

const createdAt = '2026-08-15T12:00:00.000Z';

function definition() {
  return createReportDefinition({
    reportDefinitionId: 'def-1',
    workspaceId: 'ws-1',
    name: 'Ops Daily',
    kind: 'ops_daily',
    defaultModes: ['paper'],
    metricKeys: ['fact_count'],
    createdAt,
  });
}

function completedRun() {
  return createReportRun({
    reportRunId: 'run-1',
    workspaceId: 'ws-1',
    definition: definition(),
    window: { from: '2026-08-15T00:00:00.000Z', to: '2026-08-16T00:00:00.000Z', preset: 'daily' },
    modes: ['paper'],
    tradingSessionId: 'session-1',
    status: 'completed',
    sourceSummary: {
      factCount: 1,
      lakeEventIds: ['evt-1'],
      sourceRefs: [{ ownerType: 'knowledge-lake', id: 'evt-1' }],
    },
    createdAt,
  });
}

function delivery(): DeliveryResult {
  return Object.freeze({
    deliveryId: 'del-1',
    workspaceId: 'ws-1',
    userId: 'user-1',
    type: 'daily-report',
    reportRunId: 'run-1',
    attempts: Object.freeze([
      Object.freeze({
        channelId: 'telegram',
        outcome: 'skipped',
        skipReason: 'channel-not-connected',
      }),
    ]),
    outcome: 'skipped',
    createdAt,
  }) as DeliveryResult;
}

function narrative(): ReportRunNarrativeView {
  return Object.freeze({
    reportRunId: 'run-1',
    workspaceId: 'ws-1',
    reportStatus: 'completed',
    reportOutcome: 'completed',
    narrativeId: 'nar-1',
    narrativeKind: 'narrative',
    narrativeText: 'Paper session stayed quiet.',
    narrativeUnavailable: false,
    attached: true,
    reportMutated: false,
    forcesTrade: false,
    authorityClass: 'narrative',
  });
}

function harness() {
  const reportingQuery = {
    listDefinitions: vi.fn(() =>
      Object.freeze({ items: [definition()], authorityClass: 'projection' as const }),
    ),
    getDefinition: vi.fn((id: string) => (id === 'def-1' ? definition() : null)),
    listRuns: vi.fn(() =>
      Object.freeze({ items: [completedRun()], authorityClass: 'projection' as const }),
    ),
    getRun: vi.fn((id: string) => (id === 'run-1' ? completedRun() : null)),
    listAggregations: vi.fn(() =>
      Object.freeze([
        createAggregationSlice({
          sliceId: 'slice-1',
          reportRunId: 'run-1',
          metricKey: 'fact_count',
          label: 'Facts',
          value: 1,
          sourceRefs: [{ ownerType: 'knowledge-lake', id: 'evt-1' }],
        }),
      ]),
    ),
  };
  const notifications = {
    listDeliveries: vi.fn(() => [delivery()]),
    deliver: vi.fn(),
  };
  const narratives = {
    getAttachedNarrative: vi.fn(() => narrative()),
  };
  const service = new ReportingProductService(
    reportingQuery as never,
    narratives as never,
    notifications as never,
  );
  return { service, reportingQuery, notifications, narratives };
}

describe('ReportingProductService (PC-05)', () => {
  it('lists existing ReportRuns with delivery status and does not generate or deliver', () => {
    const { service, reportingQuery, notifications, narratives } = harness();
    const page = service.listRuns({ workspaceId: 'ws-1', q: 'ops' });
    expect(page.items).toHaveLength(1);
    expect(page.items[0]?.reportRunId).toBe('run-1');
    expect(page.items[0]?.deliveryOutcome).toBe('skipped');
    expect(page.ledgerSoT).toBe(false);
    expect(reportingQuery.listRuns).toHaveBeenCalledWith({ workspaceId: 'ws-1' });
    expect(notifications.deliver).not.toHaveBeenCalled();
    expect(narratives.getAttachedNarrative).not.toHaveBeenCalled();
    expect(service as unknown as { requestReportRun?: unknown }).not.toHaveProperty(
      'requestReportRun',
    );
  });

  it('returns detail with aggregations, narrative, and delivery from existing owners', () => {
    const { service, notifications, narratives } = harness();
    const detail = service.getRun('ws-1', 'run-1');
    expect(detail?.name).toBe('Ops Daily');
    expect(detail?.aggregations).toHaveLength(1);
    expect(detail?.narrative?.narrativeText).toBe('Paper session stayed quiet.');
    expect(detail?.narrative?.reportMutated).toBe(false);
    expect(detail?.delivery?.outcome).toBe('skipped');
    expect(detail?.delivery?.generatesReports).toBe(false);
    expect(detail?.exportKind).toBe('projection-json');
    expect(notifications.deliver).not.toHaveBeenCalled();
    expect(narratives.getAttachedNarrative).toHaveBeenCalledWith({
      workspaceId: 'ws-1',
      reportRunId: 'run-1',
    });
  });

  it('hides foreign-workspace runs', () => {
    const { service } = harness();
    expect(service.getRun('ws-other', 'run-1')).toBeNull();
    expect(service.getDefinition('ws-other', 'def-1')).toBeNull();
  });
});
