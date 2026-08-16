import { BadRequestException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { AiAnalyticsService } from '../ai-analytics/ai-analytics.service';
import { InMemoryKnowledgeLakeIngestionAdapter } from '../knowledge-lake/ingestion/in-memory-knowledge-lake-ingestion.adapter';
import { createReportDefinition } from '../reporting/domain/report-definition';
import { createReportRun } from '../reporting/domain/report-run';
import type { ReportRun } from '../reporting/domain/report-run';
import { AiAnalyticsProductService } from './ai-analytics-product.service';

const createdAt = '2026-08-16T10:00:00.000Z';

function harness(runs: ReportRun[]) {
  const lake = new InMemoryKnowledgeLakeIngestionAdapter();
  lake.admit({
    eventId: 'evt-1',
    occurredAt: '2026-08-16T09:00:00.000Z',
    producer: 'trading-session',
    category: 'Trading',
    mode: 'paper',
    workspaceId: 'ws-1',
    tradingSessionId: 'session-1',
    payload: { kind: 'session-marker' },
    schemaVersion: '1',
    sourceRef: { ownerType: 'Qualification', id: 'qual-1' },
  });
  const reportingQuery = {
    listRuns: () => Object.freeze({ items: runs, authorityClass: 'projection' as const }),
    getRun: (id: string) => runs.find((run) => run.reportRunId === id) ?? null,
    listAggregations: () => Object.freeze([]),
    listDefinitions: () => Object.freeze({ items: [], authorityClass: 'projection' as const }),
    getDefinition: () => null,
  };
  const reporting = {
    requestReportRun: () => {
      throw new Error('must not generate reports');
    },
    compareRuns: () =>
      Object.freeze([
        {
          authorityClass: 'projection' as const,
          leftReportRunId: runs[0]?.reportRunId ?? 'left',
          rightReportRunId: runs[1]?.reportRunId ?? 'right',
          metricKey: 'fact_count',
          leftValue: 1,
          rightValue: 2,
          delta: 1,
        },
      ]),
    registerDefinition: () => {
      throw new Error('must not register definitions');
    },
  };
  const libraryLookup = {
    getByLibraryEntryId: (id: string) =>
      id === 'lib-1'
        ? {
            authorityClass: 'source_of_truth' as const,
            strategy: { strategyFamilyId: 'fam-1' },
            version: { version: '1.0.0' },
            certification: null,
            eligibility: null,
            tacticalEnvelope: null,
            membershipStatus: 'certified' as const,
          }
        : null,
    getByFamilyVersion: () => null,
    list: () =>
      Object.freeze({ items: [], nextCursor: null, authorityClass: 'source_of_truth' as const }),
  };
  const ai = new AiAnalyticsService(reportingQuery);
  const product = new AiAnalyticsProductService(
    ai,
    reportingQuery as never,
    reporting as never,
    lake,
    libraryLookup as never,
  );
  return { product, lake };
}

function run(overrides: Partial<Parameters<typeof createReportRun>[0]> & { reportRunId: string }) {
  const definition = createReportDefinition({
    reportDefinitionId: 'def-1',
    workspaceId: 'ws-1',
    name: 'Ops Daily',
    kind: 'ops_daily',
    defaultModes: ['paper'],
    metricKeys: ['fact_count'],
    createdAt,
  });
  return createReportRun({
    workspaceId: 'ws-1',
    definition,
    window: { from: '2026-08-16T00:00:00.000Z', to: '2026-08-17T00:00:00.000Z', preset: 'daily' },
    modes: ['paper'],
    status: 'completed',
    sourceSummary: {
      factCount: 1,
      lakeEventIds: ['evt-1'],
      sourceRefs: [{ ownerType: 'knowledge-lake', id: 'evt-1' }],
    },
    createdAt,
    ...overrides,
  });
}

describe('PC-17 AI Analytics product service', () => {
  it('lists and generates narratives from existing ReportRuns without persistence', () => {
    const left = run({ reportRunId: 'run-1', libraryEntryId: 'lib-1' });
    const { product } = harness([left]);
    const page = product.list({ workspaceId: 'ws-1' });
    expect(page.items.length).toBe(4);
    expect(page.sourceOfTruth).toBe(false);
    expect(page.forcesTrade).toBe(false);

    const generated = product.generate({
      workspaceId: 'ws-1',
      reportRunId: 'run-1',
      kind: 'summarize',
    });
    expect(generated.kind).toBe('summarize');
    expect(generated.authorityClass).toBe('narrative');
    expect(generated.recommendations.every((row) => row.forcesTrade === false)).toBe(true);
    expect(generated.knowledgeRefs[0]?.entryId).toBe('evt-1');
    expect(generated.reportRefs[0]?.ownsReport).toBe(false);
    expect(generated.strategyRefs[0]?.libraryEntryId).toBe('lib-1');
    expect(product.get('ws-1', generated.analysisId)?.analysisId).toBe(generated.analysisId);
  });

  it('compares two existing reports as narrative, not report ownership', () => {
    const left = run({ reportRunId: 'run-1', libraryEntryId: 'lib-1' });
    const right = run({
      reportRunId: 'run-2',
      libraryEntryId: 'lib-2',
      createdAt: '2026-08-16T11:00:00.000Z',
    });
    const { product } = harness([left, right]);
    const compared = product.generate({
      workspaceId: 'ws-1',
      reportRunId: 'run-1',
      compareReportRunId: 'run-2',
      kind: 'explain',
    });
    expect(compared.comparison?.forcesTrade).toBe(false);
    expect(compared.comparison?.sourceOfTruth).toBe(false);
    expect(compared.comparison?.slices[0]?.ownsReports).toBe(false);
    expect(compared.comparison?.rightReportRunId).toBe('run-2');
  });

  it('rejects generate without an existing report and does not invent storage', () => {
    const { product } = harness([]);
    expect(() => product.generate({ workspaceId: 'ws-1', kind: 'narrative' })).toThrow(
      BadRequestException,
    );
  });
});
