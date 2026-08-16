import { describe, expect, it, vi } from 'vitest';
import { InMemoryKnowledgeLakeIngestionAdapter } from '../knowledge-lake/ingestion/in-memory-knowledge-lake-ingestion.adapter';
import type { AnalyticalFactAdmission } from '../knowledge-lake/domain/analytical-fact-admission';
import { createReportDefinition } from '../reporting/domain/report-definition';
import { createReportRun } from '../reporting/domain/report-run';
import { KnowledgeLakeProductService } from './knowledge-lake-product.service';

const admittedAt = '2026-08-16T10:00:00.000Z';

function admit(
  lake: InMemoryKnowledgeLakeIngestionAdapter,
  overrides: Partial<AnalyticalFactAdmission> & Pick<AnalyticalFactAdmission, 'eventId'>,
) {
  const result = lake.admit({
    occurredAt: '2026-08-16T09:00:00.000Z',
    producer: 'trading-session',
    category: 'Trading',
    mode: 'paper',
    workspaceId: 'ws-1',
    payload: { kind: 'marker' },
    schemaVersion: '1',
    ...overrides,
  });
  expect(result.outcome).toBe('admitted');
}

function harness() {
  const lake = new InMemoryKnowledgeLakeIngestionAdapter();
  admit(lake, {
    eventId: 'evt-trade-1',
    occurredAt: '2026-08-16T09:00:00.000Z',
    admittedAt: '2026-08-16T09:05:00.000Z',
    producer: 'trading-session',
    tradingSessionId: 'session-1',
    correlationId: 'corr-a',
    sourceRef: { ownerType: 'TradingSession', id: 'session-1' },
  });
  admit(lake, {
    eventId: 'evt-risk-1',
    occurredAt: '2026-08-16T09:30:00.000Z',
    admittedAt: '2026-08-16T09:35:00.000Z',
    producer: 'risk-engine',
    category: 'Risk',
    tradingSessionId: 'session-1',
    correlationId: 'corr-a',
  });
  admit(lake, {
    eventId: 'evt-research-1',
    occurredAt: '2026-08-16T10:00:00.000Z',
    admittedAt: '2026-08-16T10:05:00.000Z',
    producer: 'research-lab',
    category: 'Research',
    mode: 'research',
    payload: { outcomeKind: 'experiment_completed', strategyId: 'lib-9' },
    sourceRef: { ownerType: 'Experiment', id: 'exp-1' },
  });
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
      lakeEventIds: ['evt-trade-1'],
      sourceRefs: [{ ownerType: 'knowledge-lake', id: 'evt-trade-1' }],
    },
    createdAt: admittedAt,
  });
  const reportingQuery = {
    listRuns: vi.fn(() => Object.freeze({ items: [run], authorityClass: 'projection' as const })),
    getRun: vi.fn((id: string) => (id === 'run-1' ? run : null)),
    listAggregations: vi.fn(),
    listDefinitions: vi.fn(),
    getDefinition: vi.fn(),
  };
  const libraryLookup = {
    getByLibraryEntryId: vi.fn(() => null),
    getByFamilyVersion: vi.fn(),
    list: vi.fn(),
  };
  const service = new KnowledgeLakeProductService(
    lake,
    reportingQuery as never,
    libraryLookup as never,
  );
  return { lake, service, reportingQuery, libraryLookup };
}

describe('PC-16 KnowledgeLakeProductService', () => {
  it('lists and searches existing query-port facts without admitting', () => {
    const { service, lake } = harness();
    const page = service.list({ workspaceId: 'ws-1' });
    expect(page.items.map((row) => row.entryId)).toEqual([
      'evt-trade-1',
      'evt-risk-1',
      'evt-research-1',
    ]);
    expect(page.ledgerSoT).toBe(false);

    const search = service.search({ workspaceId: 'ws-1', q: 'research-lab' });
    expect(search.items.map((row) => row.entryId)).toEqual(['evt-research-1']);

    const bySource = service.list({ workspaceId: 'ws-1', producer: 'risk-engine' });
    expect(bySource.items.map((row) => row.entryId)).toEqual(['evt-risk-1']);

    expect(lake.peekAppendOrder()).toHaveLength(3);
  });

  it('opens entry details with relationships, provenance, and connected reports', () => {
    const { service, reportingQuery, libraryLookup } = harness();
    const detail = service.get('ws-1', 'evt-trade-1');
    expect(detail?.provenance.producer).toBe('trading-session');
    expect(detail?.relationships.some((row) => row.relatedEntryId === 'evt-risk-1')).toBe(true);
    expect(detail?.connectedReports[0]?.reportRunId).toBe('run-1');
    expect(detail?.connectedNarratives[0]?.authorsNarrative).toBe(false);
    expect(detail?.exportKind).toBe('projection-json');
    expect(reportingQuery.listRuns).toHaveBeenCalledWith({ workspaceId: 'ws-1' });
    expect(libraryLookup.getByLibraryEntryId).not.toHaveBeenCalled();
  });

  it('filters by existing report citations and returns null for a foreign workspace', () => {
    const { service } = harness();
    const cited = service.list({ workspaceId: 'ws-1', reportRunId: 'run-1' });
    expect(cited.items.map((row) => row.entryId)).toEqual(['evt-trade-1']);
    expect(service.get('ws-2', 'evt-trade-1')).toBeNull();
    expect(service.provenance('ws-1', 'missing')).toBeNull();
  });

  it('exposes ingestion history newest first', () => {
    const { service } = harness();
    const history = service.history({ workspaceId: 'ws-1' });
    expect(history.items[0]?.entryId).toBe('evt-research-1');
    expect(history.items[0]?.ingestedAt).toBeTruthy();
  });
});
