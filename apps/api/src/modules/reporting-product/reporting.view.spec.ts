import { describe, expect, it } from 'vitest';
import { createAggregationSlice } from '../reporting/domain/aggregation-slice';
import { createReportDefinition } from '../reporting/domain/report-definition';
import { createReportRun } from '../reporting/domain/report-run';
import {
  runMatchesQuery,
  toProjectionExport,
  toReportDefinitionView,
  toReportRunDetailView,
  toReportRunListItemView,
} from './reporting.view';
import type { ReportRunNarrativeView } from '../product-flow/report-run-narrative.view';

const createdAt = '2026-08-15T12:00:00.000Z';

function definition() {
  return createReportDefinition({
    reportDefinitionId: 'def-1',
    workspaceId: 'ws-1',
    name: 'Ops Daily',
    description: 'Paper ops',
    kind: 'ops_daily',
    defaultModes: ['paper'],
    metricKeys: ['fact_count'],
    createdAt,
  });
}

function run() {
  return createReportRun({
    reportRunId: 'run-1',
    workspaceId: 'ws-1',
    definition: definition(),
    window: { from: '2026-08-15T00:00:00.000Z', to: '2026-08-16T00:00:00.000Z', preset: 'daily' },
    modes: ['paper'],
    tradingSessionId: 'session-1',
    status: 'completed',
    sourceSummary: {
      factCount: 2,
      lakeEventIds: ['evt-1'],
      sourceRefs: [{ ownerType: 'knowledge-lake', id: 'evt-1' }],
    },
    createdAt,
  });
}

describe('PC-05 reporting product views', () => {
  it('maps definitions and runs as projections, never ledger SoT', () => {
    const defView = toReportDefinitionView(definition());
    expect(defView.authorityClass).toBe('projection');
    expect(defView.ledgerSoT).toBe(false);
    expect(defView.name).toBe('Ops Daily');

    const item = toReportRunListItemView(run(), { deliveryId: 'del-1', outcome: 'skipped' });
    expect(item.authorityClass).toBe('projection');
    expect(item.ledgerSoT).toBe(false);
    expect(item.deliveryOutcome).toBe('skipped');
    expect(item.kind).toBe('ops_daily');
  });

  it('filters existing runs without inventing report types', () => {
    const item = run();
    expect(runMatchesQuery(item, { workspaceId: 'ws-1', kind: 'ops_daily' })).toBe(true);
    expect(runMatchesQuery(item, { workspaceId: 'ws-1', kind: 'ops_weekly' })).toBe(false);
    expect(runMatchesQuery(item, { workspaceId: 'ws-1', status: 'completed' })).toBe(true);
    expect(runMatchesQuery(item, { workspaceId: 'ws-1', status: 'empty' })).toBe(false);
    expect(runMatchesQuery(item, { workspaceId: 'ws-1', mode: 'paper' })).toBe(true);
    expect(runMatchesQuery(item, { workspaceId: 'ws-1', mode: 'live' })).toBe(false);
    expect(runMatchesQuery(item, { workspaceId: 'ws-1', q: 'ops' })).toBe(true);
    expect(runMatchesQuery(item, { workspaceId: 'ws-1', q: 'missing' })).toBe(false);
  });

  it('exports existing aggregations as projection JSON, not a PDF engine', () => {
    const slice = createAggregationSlice({
      sliceId: 'slice-1',
      reportRunId: 'run-1',
      metricKey: 'fact_count',
      label: 'Facts',
      value: 2,
      sourceRefs: [{ ownerType: 'knowledge-lake', id: 'evt-1' }],
      visualizationHint: 'kpi',
    });
    const narrative: ReportRunNarrativeView = Object.freeze({
      reportRunId: 'run-1',
      workspaceId: 'ws-1',
      reportStatus: 'completed',
      reportOutcome: 'completed',
      narrativeId: 'nar-1',
      narrativeKind: 'narrative',
      narrativeText: 'Quiet session.',
      narrativeUnavailable: false,
      attached: true,
      reportMutated: false,
      forcesTrade: false,
      authorityClass: 'narrative',
    });
    const detail = toReportRunDetailView({
      run: run(),
      aggregations: [slice],
      narrative,
      delivery: null,
    });
    expect(detail.exportKind).toBe('projection-json');
    expect(detail.exportAvailable).toBe(true);
    const exported = JSON.parse(toProjectionExport(detail)) as {
      authorityClass: string;
      ledgerSoT: boolean;
      aggregations: unknown[];
    };
    expect(exported.authorityClass).toBe('projection');
    expect(exported.ledgerSoT).toBe(false);
    expect(exported.aggregations).toHaveLength(1);
  });
});
