import { describe, expect, it, vi } from 'vitest';
import type { AnalyticalNarrative } from '../ai-analytics/domain/analytical-narrative';
import type { ReportRun } from '../reporting/domain/report-run';
import type { ReportRunResult } from '../reporting/ports/reporting.port';
import { ReportNarrativeConsumerService } from './report-narrative-consumer.service';

const at = '2026-08-15T17:00:00.000Z';

function completedRun(): ReportRun {
  return Object.freeze({
    reportRunId: 'run-1',
    workspaceId: 'ws-1',
    reportDefinitionId: 'def-1',
    definitionSnapshot: Object.freeze({
      reportDefinitionId: 'def-1',
      workspaceId: 'ws-1',
      name: 'Ops Daily',
      kind: 'ops_daily',
      defaultModes: Object.freeze(['paper']),
      metricKeys: Object.freeze(['fact_count']),
      authorityClass: 'projection',
      createdAt: at,
    }),
    window: Object.freeze({ from: '2026-08-15T00:00:00.000Z', to: '2026-08-16T00:00:00.000Z' }),
    modes: Object.freeze(['paper']),
    exchangeScopeId: 'binance-spot',
    status: 'completed',
    authorityClass: 'projection',
    sourceSummary: Object.freeze({
      factCount: 1,
      lakeEventIds: Object.freeze(['evt-1']),
      sourceRefs: Object.freeze([{ ownerType: 'knowledge-lake', id: 'evt-1' }]),
    }),
    createdAt: at,
  }) as ReportRun;
}

function completedReport(overrides?: Partial<ReportRunResult>): ReportRunResult {
  return Object.freeze({
    outcome: 'completed',
    reportRun: completedRun(),
    aggregations: Object.freeze([]),
    authorityClass: 'projection',
    ...overrides,
  });
}

function narrative(overrides?: Partial<AnalyticalNarrative>): AnalyticalNarrative {
  return Object.freeze({
    narrativeId: 'nar-1',
    workspaceId: 'ws-1',
    reportRunId: 'run-1',
    kind: 'narrative',
    text: 'Report commentary for run-1.',
    sourceRefs: Object.freeze([{ ownerType: 'report-run', id: 'run-1' }]),
    modesCovered: Object.freeze(['paper']),
    authorityClass: 'narrative',
    disclaimer: 'Non-authoritative narrative.',
    createdAt: at,
    modelMeta: Object.freeze({
      provider: 'deterministic',
      modelId: 'deterministic-report-narrator-v1',
    }),
    ...overrides,
  }) as AnalyticalNarrative;
}

function harness(overrides?: {
  report?: ReportRunResult;
  run?: ReportRun | null;
  narrative?: AnalyticalNarrative;
}) {
  const report = overrides?.report ?? completedReport();
  const generated = overrides?.narrative ?? narrative();
  const reporting = {
    requestReportRun: vi.fn(() => report),
  };
  const reportingQuery = {
    getRun: vi.fn(() =>
      overrides && 'run' in overrides ? overrides.run : (report.reportRun ?? null),
    ),
    listAggregations: vi.fn(() => report.aggregations),
  };
  const ai = {
    generateNarrative: vi.fn(() => generated),
  };
  const consumer = new ReportNarrativeConsumerService(
    reporting as never,
    reportingQuery as never,
    ai as never,
  );
  return { consumer, reporting, reportingQuery, ai, generated };
}

describe('PC-15 15-c — ReportNarrativeConsumerService', () => {
  it('requests a ReportRun then generates a narrative without mutating the run', () => {
    const { consumer, reporting, ai, generated } = harness();
    const result = consumer.requestAndNarrate({
      workspaceId: 'ws-1',
      reportDefinitionId: 'def-1',
      window: { from: '2026-08-15T00:00:00.000Z', to: '2026-08-16T00:00:00.000Z' },
      modes: ['paper'],
      requestedAt: at,
      reportRunId: 'run-1',
    });

    expect(reporting.requestReportRun).toHaveBeenCalledTimes(1);
    expect(ai.generateNarrative).toHaveBeenCalledWith(
      expect.objectContaining({ workspaceId: 'ws-1', reportRunId: 'run-1' }),
    );
    expect(result.narrative.narrativeId).toBe(generated.narrativeId);
    expect(result.attachment.attached).toBe(true);
    expect(result.attachment.reportMutated).toBe(false);
    expect(result.attachment.narrativeUnavailable).toBe(false);
    expect(result.attachment.forcesTrade).toBe(false);
  });

  it('still invokes AI when Reporting is unavailable and returns the existing unavailable narrative', () => {
    const unavailable = narrative({
      text: 'Narrative unavailable: report run missing-run was not found in Reporting. No Source of Truth was queried.',
      reportRunId: 'missing-run',
      modelMeta: Object.freeze({
        provider: 'deterministic',
        modelId: 'deterministic-report-narrator-v1',
        outcome: 'unavailable',
      }),
    });
    const { consumer, ai } = harness({
      report: completedReport({
        outcome: 'rejected',
        reportRun: undefined,
        rejectionReasons: ['definition_required'],
      }),
      narrative: unavailable,
    });
    const result = consumer.requestAndNarrate({
      workspaceId: 'ws-1',
      window: { from: '2026-08-15T00:00:00.000Z', to: '2026-08-16T00:00:00.000Z' },
      modes: ['paper'],
      reportRunId: 'missing-run',
    });

    expect(ai.generateNarrative).toHaveBeenCalledTimes(1);
    expect(result.attachment.narrativeUnavailable).toBe(true);
    expect(result.narrative.modelMeta?.outcome).toBe('unavailable');
    expect(result.attachment.reportMutated).toBe(false);
  });

  it('attaches a narrative to an already completed ReportRun via query, never writing the run', () => {
    const { consumer, reporting, reportingQuery, ai } = harness({
      run: completedRun(),
    });
    const result = consumer.narrateCompletedRun({
      workspaceId: 'ws-1',
      reportRunId: 'run-1',
      requestedAt: at,
    });

    expect(reporting.requestReportRun).not.toHaveBeenCalled();
    expect(reportingQuery.getRun).toHaveBeenCalledWith('run-1');
    expect(ai.generateNarrative).toHaveBeenCalledTimes(1);
    expect(result.report.reportRun?.reportRunId).toBe('run-1');
    expect(result.attachment.narrativeText).toContain('run-1');
  });
});
