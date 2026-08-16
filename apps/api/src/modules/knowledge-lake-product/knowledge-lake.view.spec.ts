import { describe, expect, it } from 'vitest';
import type { AnalyticalFactAdmission } from '../knowledge-lake/domain/analytical-fact-admission';
import { toAnalyticalFact } from '../knowledge-lake/domain/analytical-fact-admission';
import { createReportDefinition } from '../reporting/domain/report-definition';
import { createReportRun } from '../reporting/domain/report-run';
import {
  factMatchesQuery,
  reportCitesEntry,
  toDetailView,
  toHistoryPageView,
  toListItemView,
  toProjectionExport,
  toProvenanceView,
} from './knowledge-lake.view';

const admittedAt = '2026-08-16T10:00:00.000Z';

function fact(
  overrides: Partial<AnalyticalFactAdmission> & Pick<AnalyticalFactAdmission, 'eventId'>,
) {
  return toAnalyticalFact(
    {
      occurredAt: '2026-08-16T09:00:00.000Z',
      producer: 'trading-session',
      category: 'Trading',
      mode: 'paper',
      workspaceId: 'ws-1',
      payload: { kind: 'marker' },
      schemaVersion: '1',
      ...overrides,
    },
    admittedAt,
  );
}

describe('PC-16 Knowledge Lake product views', () => {
  it('marks list items as analytical projections, never ledger SoT', () => {
    const item = toListItemView(fact({ eventId: 'evt-1' }));
    expect(item.entryId).toBe('evt-1');
    expect(item.authorityClass).toBe('projection');
    expect(item.ledgerSoT).toBe(false);
    expect(item.analyticalCopy).toBe(true);
  });

  it('orders history by admittedAt descending', () => {
    const older = toAnalyticalFact(
      {
        eventId: 'evt-old',
        occurredAt: '2026-08-16T08:00:00.000Z',
        producer: 'orders',
        category: 'Trading',
        mode: 'paper',
        workspaceId: 'ws-1',
        payload: {},
        schemaVersion: '1',
      },
      '2026-08-16T08:30:00.000Z',
    );
    const newer = fact({ eventId: 'evt-new' });
    expect(toHistoryPageView([older, newer]).items.map((row) => row.entryId)).toEqual([
      'evt-new',
      'evt-old',
    ]);
  });

  it('matches text search over producer, payload, and sourceRef without a new index', () => {
    const match = fact({
      eventId: 'evt-1',
      producer: 'research-lab',
      payload: { kind: 'research_analytical_marker', strategyId: 'lib-9' },
      sourceRef: { ownerType: 'Experiment', id: 'exp-1' },
    });
    expect(factMatchesQuery(match, { workspaceId: 'ws-1', q: 'lib-9' })).toBe(true);
    expect(factMatchesQuery(match, { workspaceId: 'ws-1', q: 'missing' })).toBe(false);
    expect(factMatchesQuery(match, { workspaceId: 'ws-1', libraryEntryId: 'lib-9' })).toBe(true);
  });

  it('cites connected reports from existing lakeEventIds and does not export PDF', () => {
    const definition = createReportDefinition({
      reportDefinitionId: 'def-1',
      workspaceId: 'ws-1',
      name: 'Ops Daily',
      kind: 'ops_daily',
      defaultModes: ['paper'],
      metricKeys: ['fact_count'],
      createdAt: admittedAt,
    });
    const run = createReportRun({
      reportRunId: 'run-1',
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
      createdAt: admittedAt,
    });
    const lakeFact = fact({
      eventId: 'evt-1',
      producer: 'research-lab',
      category: 'Research',
      mode: 'research',
      payload: { outcomeKind: 'experiment_completed', strategyId: 'lib-9' },
      sourceRef: { ownerType: 'Experiment', id: 'exp-1' },
    });
    expect(reportCitesEntry(run, 'evt-1')).toBe(true);
    const detail = toDetailView({ fact: lakeFact, related: [], reports: [run], strategy: null });
    expect(detail.connectedReports[0]?.href).toBe('/reporting/run-1');
    expect(detail.connectedNarratives[0]?.authorsNarrative).toBe(false);
    expect(detail.connectedResearch[0]?.ownerType).toBe('Experiment');
    expect(detail.exportKind).toBe('projection-json');
    expect(toProjectionExport(detail)).toContain('"analyticalCopy": true');
    expect(toProvenanceView(lakeFact).mutatesSource).toBe(false);
  });
});
