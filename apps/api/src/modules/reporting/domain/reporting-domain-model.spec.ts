import { describe, expect, it } from 'vitest';
import { createAggregationSlice, createReportSection } from './aggregation-slice';
import { createHistoricalWindow } from './historical-window';
import { createReportDefinition, snapshotReportDefinition } from './report-definition';
import { createReportRun } from './report-run';
import {
  REPORTING_DOMAIN_AUTHORITY_CLASS,
  isMoneyAdjacentMetricKey,
  isReportingForbiddenMetricKey,
} from './reporting-domain-shared';
import { createReportingSourceRef, isKnowledgeLakeSourceRef } from './reporting-source-ref';

const createdAt = '2026-08-10T12:00:00.000Z';

function sampleDefinition() {
  return createReportDefinition({
    reportDefinitionId: 'def-ops-daily',
    workspaceId: 'ws-1',
    name: 'Ops Daily',
    kind: 'ops_daily',
    defaultModes: ['paper'],
    metricKeys: ['fact_count', 'display_pnl_projection'],
    compareEnabled: true,
    createdAt,
  });
}

describe('RC-24 Epic 3 — Reporting domain model', () => {
  it('creates immutable ReportDefinition with projection authority', () => {
    const definition = sampleDefinition();
    expect(definition.authorityClass).toBe(REPORTING_DOMAIN_AUTHORITY_CLASS);
    expect(definition.authorityClass).toBe('projection');
    expect(Object.isFrozen(definition)).toBe(true);
    expect(Object.isFrozen(definition.metricKeys)).toBe(true);
    expect(definition.kind).toBe('ops_daily');
  });

  it('rejects forbidden shadow-accounting metric keys on definitions', () => {
    expect(isReportingForbiddenMetricKey('recomputed_ledger_balance')).toBe(true);
    expect(() =>
      createReportDefinition({
        reportDefinitionId: 'def-bad',
        workspaceId: 'ws-1',
        name: 'Bad',
        kind: 'custom',
        defaultModes: ['paper'],
        metricKeys: ['recomputed_ledger_balance'],
        createdAt,
      }),
    ).toThrow(/shadow accounting/);
  });

  it('creates immutable HistoricalWindow with from < to', () => {
    const window = createHistoricalWindow({
      preset: 'daily',
      from: '2026-08-10T00:00:00.000Z',
      to: '2026-08-11T00:00:00.000Z',
      timezone: 'UTC',
    });
    expect(Object.isFrozen(window)).toBe(true);
    expect(window.preset).toBe('daily');
    expect(() =>
      createHistoricalWindow({
        from: '2026-08-11T00:00:00.000Z',
        to: '2026-08-10T00:00:00.000Z',
      }),
    ).toThrow(/from must be strictly before to/);
  });

  it('creates immutable ReportRun (Report Snapshot) that freezes definition snapshot', () => {
    const definition = sampleDefinition();
    const window = createHistoricalWindow({
      from: '2026-08-10T00:00:00.000Z',
      to: '2026-08-11T00:00:00.000Z',
    });
    const run = createReportRun({
      reportRunId: 'run-1',
      workspaceId: 'ws-1',
      definition,
      window,
      modes: ['paper'],
      tradingSessionId: 'session-1',
      status: 'empty',
      sourceSummary: {
        factCount: 0,
        lakeEventIds: [],
        sourceRefs: [],
      },
      createdAt,
    });

    expect(run.authorityClass).toBe('projection');
    expect(run.status).toBe('empty');
    expect(Object.isFrozen(run)).toBe(true);
    expect(run.definitionSnapshot.reportDefinitionId).toBe('def-ops-daily');
    expect(run.definitionSnapshot).not.toBe(definition);

    const snap = snapshotReportDefinition(definition);
    expect(Object.isFrozen(snap)).toBe(true);
  });

  it('rejects ReportRun when rejected without reasons', () => {
    const definition = sampleDefinition();
    const window = createHistoricalWindow({
      from: '2026-08-10T00:00:00.000Z',
      to: '2026-08-11T00:00:00.000Z',
    });
    expect(() =>
      createReportRun({
        reportRunId: 'run-bad',
        workspaceId: 'ws-1',
        definition,
        window,
        modes: ['paper'],
        status: 'rejected',
        sourceSummary: { factCount: 0 },
        createdAt,
      }),
    ).toThrow(/rejectionReasons/);
  });

  it('creates AggregationSlice (Report Section) with Lake source refs only as references', () => {
    const lakeRef = createReportingSourceRef({
      ownerType: 'knowledge-lake',
      id: 'evt-1',
    });
    expect(isKnowledgeLakeSourceRef(lakeRef)).toBe(true);
    expect(Object.isFrozen(lakeRef)).toBe(true);

    const slice = createAggregationSlice({
      sliceId: 'slice-1',
      reportRunId: 'run-1',
      metricKey: 'fact_count',
      label: 'Fact count',
      value: 2,
      sourceRefs: [{ ownerType: 'knowledge-lake', id: 'evt-1' }],
      visualizationHint: 'kpi',
    });

    expect(slice.authorityClass).toBe('projection');
    expect(Object.isFrozen(slice)).toBe(true);
    expect(slice.sourceRefs[0]?.ownerType).toBe('knowledge-lake');

    const section = createReportSection({
      sliceId: 'slice-2',
      reportRunId: 'run-1',
      metricKey: 'facts_by_category',
      label: 'By category',
      sourceRefs: [{ ownerType: 'knowledge-lake', id: 'evt-2' }],
    });
    expect(section.sliceId).toBe('slice-2');
  });

  it('requires mode labeling for money-adjacent metrics', () => {
    expect(isMoneyAdjacentMetricKey('display_pnl_projection')).toBe(true);
    expect(() =>
      createAggregationSlice({
        sliceId: 'slice-money',
        reportRunId: 'run-1',
        metricKey: 'display_pnl_projection',
        label: 'PnL display',
        sourceRefs: [{ ownerType: 'knowledge-lake', id: 'evt-1' }],
      }),
    ).toThrow(/requires mode labeling/);

    const labeled = createAggregationSlice({
      sliceId: 'slice-money-ok',
      reportRunId: 'run-1',
      metricKey: 'display_pnl_projection',
      mode: 'paper',
      label: 'PnL display',
      sourceRefs: [{ ownerType: 'knowledge-lake', id: 'evt-1' }],
    });
    expect(labeled.mode).toBe('paper');
  });

  it('rejects AggregationSlice without source refs and forbidden metric keys', () => {
    expect(() =>
      createAggregationSlice({
        sliceId: 'slice-empty',
        reportRunId: 'run-1',
        metricKey: 'fact_count',
        label: 'Empty',
        sourceRefs: [],
      }),
    ).toThrow(/sourceRefs must be non-empty/);

    expect(() =>
      createAggregationSlice({
        sliceId: 'slice-shadow',
        reportRunId: 'run-1',
        metricKey: 'shadow_cash',
        label: 'Shadow',
        sourceRefs: [{ ownerType: 'knowledge-lake', id: 'evt-1' }],
      }),
    ).toThrow(/shadow accounting/);
  });

  it('does not expose report-generation behaviour on domain factories', async () => {
    const definitionMod = await import('./report-definition');
    const runMod = await import('./report-run');
    const sliceMod = await import('./aggregation-slice');
    expect(definitionMod).not.toHaveProperty('generateReport');
    expect(definitionMod).not.toHaveProperty('aggregate');
    expect(runMod).not.toHaveProperty('requestReportRun');
    expect(runMod).not.toHaveProperty('summarize');
    expect(sliceMod).not.toHaveProperty('computeAggregation');
    expect(sliceMod).not.toHaveProperty('recomputeLedgerBalance');
  });
});
