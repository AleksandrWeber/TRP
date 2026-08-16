import { describe, expect, it } from 'vitest';
import { createAnalyticalNarrative } from '../ai-analytics/domain/analytical-narrative';
import { toAnalyticalFact } from '../knowledge-lake/domain/analytical-fact-admission';
import { createReportDefinition } from '../reporting/domain/report-definition';
import { createReportRun } from '../reporting/domain/report-run';
import {
  narrativeMatchesQuery,
  toDetailView,
  toHistoryPageView,
  toInsights,
  toListItemView,
  toProvenanceView,
  toRecommendations,
} from './ai-analytics.view';

const createdAt = '2026-08-16T10:00:00.000Z';

function narrative() {
  return createAnalyticalNarrative({
    narrativeId: 'nar-1',
    workspaceId: 'ws-1',
    reportRunId: 'run-1',
    kind: 'summarize',
    text: 'Summary of report run run-1.\nNon-authoritative summary derived from Reporting projections.',
    sourceRefs: [{ ownerType: 'report-run', id: 'run-1' }],
    modesCovered: ['paper'],
    createdAt,
    modelMeta: {
      provider: 'deterministic',
      modelId: 'deterministic-report-narrator-v1',
      templateVersion: '1',
    },
  });
}

describe('PC-17 AI Analytics product views', () => {
  it('marks list items as narrative, never Source of Truth or trades', () => {
    const item = toListItemView(narrative());
    expect(item.analysisId).toBe('nar-1');
    expect(item.authorityClass).toBe('narrative');
    expect(item.sourceOfTruth).toBe(false);
    expect(item.forcesTrade).toBe(false);
    expect(item.summary).toContain('Summary of report run');
  });

  it('orders history by createdAt descending', () => {
    const older = createAnalyticalNarrative({
      narrativeId: 'nar-old',
      workspaceId: 'ws-1',
      reportRunId: 'run-0',
      kind: 'explain',
      text: 'Older',
      sourceRefs: [{ ownerType: 'report-run', id: 'run-0' }],
      modesCovered: [],
      createdAt: '2026-08-16T08:00:00.000Z',
    });
    expect(toHistoryPageView([older, narrative()]).items.map((row) => row.analysisId)).toEqual([
      'nar-1',
      'nar-old',
    ]);
  });

  it('keeps recommendations and insights non-authoritative', () => {
    const definition = createReportDefinition({
      reportDefinitionId: 'def-1',
      workspaceId: 'ws-1',
      name: 'Ops Daily',
      kind: 'ops_daily',
      defaultModes: ['paper'],
      metricKeys: ['fact_count'],
      createdAt,
    });
    const run = createReportRun({
      reportRunId: 'run-1',
      workspaceId: 'ws-1',
      definition,
      window: { from: '2026-08-16T00:00:00.000Z', to: '2026-08-17T00:00:00.000Z', preset: 'daily' },
      modes: ['paper'],
      status: 'completed',
      sourceSummary: { factCount: 1, lakeEventIds: ['evt-1'], sourceRefs: [] },
      createdAt,
    });
    const recs = toRecommendations({ narrative: narrative(), run });
    expect(recs.every((row) => row.forcesTrade === false)).toBe(true);
    expect(recs.some((row) => row.text.includes('does not authorize orders'))).toBe(true);
    expect(toInsights(narrative()).every((row) => row.forcesTrade === false)).toBe(true);
  });

  it('cites Knowledge Lake and session without owning them', () => {
    const definition = createReportDefinition({
      reportDefinitionId: 'def-1',
      workspaceId: 'ws-1',
      name: 'Ops Daily',
      kind: 'ops_daily',
      defaultModes: ['paper'],
      metricKeys: ['fact_count'],
      createdAt,
    });
    const run = createReportRun({
      reportRunId: 'run-1',
      workspaceId: 'ws-1',
      definition,
      window: { from: '2026-08-16T00:00:00.000Z', to: '2026-08-17T00:00:00.000Z', preset: 'daily' },
      modes: ['paper'],
      status: 'completed',
      tradingSessionId: 'session-1',
      libraryEntryId: 'lib-1',
      sourceSummary: {
        factCount: 1,
        lakeEventIds: ['evt-1'],
        sourceRefs: [{ ownerType: 'knowledge-lake', id: 'evt-1' }],
      },
      createdAt,
    });
    const fact = toAnalyticalFact(
      {
        eventId: 'evt-1',
        occurredAt: '2026-08-16T09:00:00.000Z',
        producer: 'trading-session',
        category: 'Trading',
        mode: 'paper',
        workspaceId: 'ws-1',
        tradingSessionId: 'session-1',
        payload: {},
        schemaVersion: '1',
        sourceRef: { ownerType: 'Qualification', id: 'qual-1' },
      },
      createdAt,
    );
    const detail = toDetailView({
      narrative: narrative(),
      run,
      lakeFacts: [fact],
      strategy: null,
      comparison: null,
    });
    expect(detail.knowledgeRefs[0]?.entryId).toBe('evt-1');
    expect(detail.reportRefs[0]?.ownsReport).toBe(false);
    expect(detail.strategyRefs[0]?.ownsStrategy).toBe(false);
    expect(detail.marketRefs.some((row) => row.kind === 'qualification')).toBe(true);
    expect(toProvenanceView(narrative()).mutatesSource).toBe(false);
    expect(narrativeMatchesQuery(narrative(), { workspaceId: 'ws-1', q: 'run-1' })).toBe(true);
  });
});
