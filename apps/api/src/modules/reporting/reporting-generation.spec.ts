import { Test } from '@nestjs/testing';
import { describe, expect, it } from 'vitest';
import { OutboxDispatcher } from '../event-processing';
import type { AnalyticalFactAdmission } from '../knowledge-lake/domain/analytical-fact-admission';
import { InMemoryKnowledgeLakeIngestionAdapter } from '../knowledge-lake/ingestion/in-memory-knowledge-lake-ingestion.adapter';
import { createHistoricalWindow } from './domain/historical-window';
import { createReportDefinition } from './domain/report-definition';
import { aggregateReportingFacts } from './generation/aggregate-reporting-facts';
import { deriveReportRunId } from './generation/derive-report-run-id';
import {
  REPORTING_QUERY_PORT,
  REPORTING_SERVICE_PORT,
  type ReportingQueryPort,
  type ReportingServicePort,
} from './ports/reporting.port';
import { ReportingModule } from './reporting.module';
import type { ReportingAnalyticalFact } from './domain/reporting-analytical-read-model';

const createdAt = '2026-08-10T12:00:00.000Z';

function admit(
  lake: InMemoryKnowledgeLakeIngestionAdapter,
  overrides: Partial<AnalyticalFactAdmission> & Pick<AnalyticalFactAdmission, 'eventId'>,
): void {
  const result = lake.admit({
    occurredAt: '2026-08-10T10:00:00.000Z',
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

async function createReportingModule() {
  return Test.createTestingModule({
    imports: [ReportingModule],
  })
    .overrideProvider(OutboxDispatcher)
    .useValue({
      register: () => undefined,
      stop: async () => undefined,
      start: () => undefined,
    })
    .compile();
}

describe('RC-24 Epic 4 — deterministic report generation', () => {
  it('produces identical outputs for identical inputs', async () => {
    const moduleRef = await createReportingModule();
    const lake = moduleRef.get(InMemoryKnowledgeLakeIngestionAdapter);
    admit(lake, {
      eventId: 'evt-1',
      occurredAt: '2026-08-10T10:00:00.000Z',
      tradingSessionId: 'session-1',
      payload: { displayPnl: 10 },
    });
    admit(lake, {
      eventId: 'evt-2',
      occurredAt: '2026-08-10T11:00:00.000Z',
      producer: 'risk-engine',
      category: 'Risk',
      tradingSessionId: 'session-1',
      payload: { displayPnl: 5 },
    });

    const service = moduleRef.get<ReportingServicePort>(REPORTING_SERVICE_PORT);
    const definition = createReportDefinition({
      reportDefinitionId: 'def-1',
      workspaceId: 'ws-1',
      name: 'Ops Daily',
      kind: 'ops_daily',
      defaultModes: ['paper'],
      metricKeys: ['fact_count', 'facts_by_category', 'display_pnl_projection'],
      createdAt,
    });
    service.registerDefinition(definition);

    const window = createHistoricalWindow({
      preset: 'daily',
      from: '2026-08-10T00:00:00.000Z',
      to: '2026-08-11T00:00:00.000Z',
    });

    const cmd = {
      workspaceId: 'ws-1',
      reportDefinitionId: 'def-1',
      window,
      modes: ['paper'] as const,
      requestedAt: createdAt,
    };

    const first = service.requestReportRun(cmd);
    const second = service.requestReportRun(cmd);

    expect(first.outcome).toBe('completed');
    expect(second.outcome).toBe('completed');
    expect(first.reportRun?.reportRunId).toBe(second.reportRun?.reportRunId);
    expect(first.aggregations).toEqual(second.aggregations);
    expect(first.reportRun).toEqual(second.reportRun);
    expect(Object.isFrozen(first.reportRun)).toBe(true);
    expect(Object.isFrozen(first.aggregations[0])).toBe(true);

    const pnl = first.aggregations.find((s) => s.metricKey === 'display_pnl_projection');
    expect(pnl?.mode).toBe('paper');
    expect(pnl?.value).toBe(15);
    expect(pnl?.authorityClass).toBe('projection');

    await moduleRef.close();
  });

  it('handles empty historical windows as empty outcome', async () => {
    const moduleRef = await createReportingModule();
    const service = moduleRef.get<ReportingServicePort>(REPORTING_SERVICE_PORT);
    const query = moduleRef.get<ReportingQueryPort>(REPORTING_QUERY_PORT);

    const definition = createReportDefinition({
      reportDefinitionId: 'def-empty',
      workspaceId: 'ws-1',
      name: 'Empty',
      kind: 'custom',
      defaultModes: ['paper'],
      metricKeys: ['fact_count'],
      createdAt,
    });
    service.registerDefinition(definition);

    const result = service.requestReportRun({
      workspaceId: 'ws-1',
      reportDefinitionId: 'def-empty',
      window: createHistoricalWindow({
        from: '2026-08-01T00:00:00.000Z',
        to: '2026-08-02T00:00:00.000Z',
      }),
      modes: ['paper'],
      requestedAt: createdAt,
    });

    expect(result.outcome).toBe('empty');
    expect(result.reportRun?.status).toBe('empty');
    expect(result.reportRun?.sourceSummary.factCount).toBe(0);
    expect(query.getRun(result.reportRun!.reportRunId)?.status).toBe('empty');
    expect(query.listAggregations(result.reportRun!.reportRunId).length).toBeGreaterThan(0);

    await moduleRef.close();
  });

  it('aggregates and compares runs without AI behaviour', async () => {
    const moduleRef = await createReportingModule();
    const lake = moduleRef.get(InMemoryKnowledgeLakeIngestionAdapter);
    admit(lake, {
      eventId: 'evt-a',
      occurredAt: '2026-08-10T09:00:00.000Z',
      category: 'Trading',
    });
    admit(lake, {
      eventId: 'evt-b',
      occurredAt: '2026-08-10T10:00:00.000Z',
      category: 'Risk',
      producer: 'risk-engine',
    });
    admit(lake, {
      eventId: 'evt-c',
      occurredAt: '2026-08-11T10:00:00.000Z',
      category: 'Trading',
    });

    const service = moduleRef.get<ReportingServicePort>(REPORTING_SERVICE_PORT);
    const definition = createReportDefinition({
      reportDefinitionId: 'def-cmp',
      workspaceId: 'ws-1',
      name: 'Compare',
      kind: 'ops_daily',
      defaultModes: ['paper'],
      metricKeys: ['fact_count', 'facts_by_category'],
      compareEnabled: true,
      createdAt,
    });
    service.registerDefinition(definition);

    const left = service.requestReportRun({
      workspaceId: 'ws-1',
      reportDefinitionId: 'def-cmp',
      window: createHistoricalWindow({
        from: '2026-08-10T00:00:00.000Z',
        to: '2026-08-11T00:00:00.000Z',
      }),
      modes: ['paper'],
      requestedAt: createdAt,
      reportRunId: 'run-left',
    });
    const right = service.requestReportRun({
      workspaceId: 'ws-1',
      reportDefinitionId: 'def-cmp',
      window: createHistoricalWindow({
        from: '2026-08-10T00:00:00.000Z',
        to: '2026-08-12T00:00:00.000Z',
      }),
      modes: ['paper'],
      requestedAt: createdAt,
      reportRunId: 'run-right',
    });

    expect(left.aggregations.find((s) => s.metricKey === 'fact_count')?.value).toBe(2);
    expect(right.aggregations.find((s) => s.metricKey === 'fact_count')?.value).toBe(3);

    const comparisons = service.compareRuns({
      workspaceId: 'ws-1',
      leftReportRunId: 'run-left',
      rightReportRunId: 'run-right',
    });
    const factCountCmp = comparisons.find((c) => c.metricKey === 'fact_count');
    expect(factCountCmp?.delta).toBe(1);
    expect(factCountCmp?.authorityClass).toBe('projection');

    expect(service).not.toHaveProperty('generateNarrative');
    expect(service).not.toHaveProperty('explain');

    await moduleRef.close();
  });

  it('rejects ambiguous definition identity and unknown modes', async () => {
    const moduleRef = await createReportingModule();
    const service = moduleRef.get<ReportingServicePort>(REPORTING_SERVICE_PORT);
    const definition = createReportDefinition({
      reportDefinitionId: 'def-x',
      workspaceId: 'ws-1',
      name: 'X',
      kind: 'custom',
      defaultModes: ['paper'],
      metricKeys: ['fact_count'],
      createdAt,
    });

    const window = createHistoricalWindow({
      from: '2026-08-10T00:00:00.000Z',
      to: '2026-08-11T00:00:00.000Z',
    });

    expect(
      service.requestReportRun({
        workspaceId: 'ws-1',
        reportDefinitionId: 'def-x',
        definition,
        window,
        modes: ['paper'],
        requestedAt: createdAt,
      }).outcome,
    ).toBe('rejected');

    expect(
      service.requestReportRun({
        workspaceId: 'ws-1',
        definition,
        window,
        modes: ['paper', 'not-a-mode' as 'paper'],
        requestedAt: createdAt,
      }).rejectionReasons?.[0],
    ).toMatch(/unknown_mode/);

    await moduleRef.close();
  });

  it('derives stable reportRunIds and aggregation slice ids', () => {
    expect(deriveReportRunId(['a', 'b'])).toBe(deriveReportRunId(['a', 'b']));
    expect(deriveReportRunId(['a', 'b'])).not.toBe(deriveReportRunId(['a', 'c']));

    const facts: ReportingAnalyticalFact[] = [
      {
        authorityClass: 'projection',
        eventId: 'evt-2',
        occurredAt: '2026-08-10T11:00:00.000Z',
        admittedAt: '2026-08-10T11:00:01.000Z',
        producer: 'orders',
        category: 'Trading',
        mode: 'paper',
        workspaceId: 'ws-1',
        payload: {},
        schemaVersion: '1',
      },
      {
        authorityClass: 'projection',
        eventId: 'evt-1',
        occurredAt: '2026-08-10T10:00:00.000Z',
        admittedAt: '2026-08-10T10:00:01.000Z',
        producer: 'orders',
        category: 'Trading',
        mode: 'paper',
        workspaceId: 'ws-1',
        payload: {},
        schemaVersion: '1',
      },
    ];

    const a = aggregateReportingFacts({
      reportRunId: 'run-x',
      metricKeys: ['fact_count'],
      facts,
      modes: ['paper'],
    });
    const b = aggregateReportingFacts({
      reportRunId: 'run-x',
      metricKeys: ['fact_count'],
      facts: [...facts].reverse(),
      modes: ['paper'],
    });
    expect(a).toEqual(b);
    expect(a[0]?.value).toBe(2);
  });

  it('query port lists definitions, runs, and aggregations as projections', async () => {
    const moduleRef = await createReportingModule();
    const service = moduleRef.get<ReportingServicePort>(REPORTING_SERVICE_PORT);
    const query = moduleRef.get<ReportingQueryPort>(REPORTING_QUERY_PORT);

    const definition = createReportDefinition({
      reportDefinitionId: 'def-q',
      workspaceId: 'ws-1',
      name: 'Query',
      kind: 'ops_weekly',
      defaultModes: ['paper'],
      metricKeys: ['fact_count'],
      createdAt,
    });
    service.registerDefinition(definition);
    const result = service.requestReportRun({
      workspaceId: 'ws-1',
      reportDefinitionId: 'def-q',
      window: createHistoricalWindow({
        from: '2026-08-10T00:00:00.000Z',
        to: '2026-08-11T00:00:00.000Z',
      }),
      modes: ['paper'],
      requestedAt: createdAt,
      reportRunId: 'run-q',
    });

    expect(query.getDefinition('def-q')?.kind).toBe('ops_weekly');
    expect(query.listDefinitions({ workspaceId: 'ws-1' }).authorityClass).toBe('projection');
    expect(query.getRun('run-q')?.reportRunId).toBe('run-q');
    expect(query.listRuns({ workspaceId: 'ws-1' }).items).toHaveLength(1);
    expect(query.listAggregations('run-q')).toEqual(result.aggregations);

    await moduleRef.close();
  });
});
