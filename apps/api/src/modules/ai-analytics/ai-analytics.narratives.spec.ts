import { Test } from '@nestjs/testing';
import { describe, expect, it } from 'vitest';
import { OutboxDispatcher } from '../event-processing';
import type { AnalyticalFactAdmission } from '../knowledge-lake/domain/analytical-fact-admission';
import { InMemoryKnowledgeLakeIngestionAdapter } from '../knowledge-lake/ingestion/in-memory-knowledge-lake-ingestion.adapter';
import { createHistoricalWindow } from '../reporting/domain/historical-window';
import { createReportDefinition } from '../reporting/domain/report-definition';
import {
  REPORTING_QUERY_PORT,
  REPORTING_SERVICE_PORT,
  type ReportingQueryPort,
  type ReportingServicePort,
} from '../reporting/ports/reporting.port';
import { AiAnalyticsModule } from './ai-analytics.module';
import { AI_ANALYTICS_BOUNDARY } from './domain/ai-analytics-boundary';
import { AiAnalyticsBoundaryService } from './ai-analytics-boundary.service';
import { AI_ANALYTICS_PORT, type AIAnalyticsPort } from './ports/ai-analytics.port';

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
    payload: { kind: 'marker', displayPnl: 3 },
    schemaVersion: '1',
    ...overrides,
  });
  expect(result.outcome).toBe('admitted');
}

async function createAiModule() {
  return Test.createTestingModule({
    imports: [AiAnalyticsModule],
  })
    .overrideProvider(OutboxDispatcher)
    .useValue({
      register: () => undefined,
      stop: async () => undefined,
      start: () => undefined,
    })
    .compile();
}

describe('RC-24 Epic 5 — AiAnalyticsModule skeleton', () => {
  it('wires boundary + AIAnalyticsPort over Reporting query consumer', async () => {
    const moduleRef = await createAiModule();
    const boundary = moduleRef.get(AiAnalyticsBoundaryService);
    expect(boundary.getBoundary()).toBe(AI_ANALYTICS_BOUNDARY);
    expect(boundary.getBoundary().activePorts.generateNarrative).toBe(true);
    expect(boundary.queriesKnowledgeLakeDirectly()).toBe(false);
    expect(boundary.modifiesReports()).toBe(false);
    expect(moduleRef.get(AI_ANALYTICS_PORT)).toBeDefined();
    expect(moduleRef.get(REPORTING_QUERY_PORT)).toBeDefined();
    await moduleRef.close();
  });
});

describe('RC-24 Epic 5 — AI analytical narratives', () => {
  it('generates identical narratives for identical ReportRun inputs', async () => {
    const moduleRef = await createAiModule();
    const lake = moduleRef.get(InMemoryKnowledgeLakeIngestionAdapter);
    admit(lake, { eventId: 'evt-1', occurredAt: '2026-08-10T10:00:00.000Z' });
    admit(lake, {
      eventId: 'evt-2',
      occurredAt: '2026-08-10T11:00:00.000Z',
      category: 'Risk',
      producer: 'risk-engine',
    });

    const reporting = moduleRef.get<ReportingServicePort>(REPORTING_SERVICE_PORT);
    const definition = createReportDefinition({
      reportDefinitionId: 'def-ai',
      workspaceId: 'ws-1',
      name: 'Ops Daily',
      kind: 'ops_daily',
      defaultModes: ['paper'],
      metricKeys: ['fact_count', 'facts_by_category'],
      createdAt,
    });
    reporting.registerDefinition(definition);
    const report = reporting.requestReportRun({
      workspaceId: 'ws-1',
      reportDefinitionId: 'def-ai',
      window: createHistoricalWindow({
        from: '2026-08-10T00:00:00.000Z',
        to: '2026-08-11T00:00:00.000Z',
      }),
      modes: ['paper'],
      requestedAt: createdAt,
      reportRunId: 'run-ai-1',
    });
    expect(report.outcome).toBe('completed');

    const ai = moduleRef.get<AIAnalyticsPort>(AI_ANALYTICS_PORT);
    const cmd = {
      workspaceId: 'ws-1',
      reportRunId: 'run-ai-1',
      requestedAt: createdAt,
    };
    const first = ai.summarize(cmd);
    const second = ai.summarize(cmd);

    expect(first).toEqual(second);
    expect(first.authorityClass).toBe('narrative');
    expect(Object.isFrozen(first)).toBe(true);
    expect(first.sourceRefs.some((r) => r.ownerType === 'report-run')).toBe(true);
    expect(first.sourceRefs.every((r) => r.ownerType !== 'knowledge-lake')).toBe(true);
    expect(first.disclaimer).toMatch(/Source of Truth wins/i);
    expect(first.text).toContain('run-ai-1');
    expect(first.modelMeta?.provider).toBe('deterministic');

    await moduleRef.close();
  });

  it('supports explain / trends / narrative kinds without mutating reports', async () => {
    const moduleRef = await createAiModule();
    const lake = moduleRef.get(InMemoryKnowledgeLakeIngestionAdapter);
    admit(lake, { eventId: 'evt-x', occurredAt: '2026-08-10T10:00:00.000Z' });

    const reporting = moduleRef.get<ReportingServicePort>(REPORTING_SERVICE_PORT);
    const query = moduleRef.get<ReportingQueryPort>(REPORTING_QUERY_PORT);
    reporting.registerDefinition(
      createReportDefinition({
        reportDefinitionId: 'def-kinds',
        workspaceId: 'ws-1',
        name: 'Kinds',
        kind: 'custom',
        defaultModes: ['paper'],
        metricKeys: ['fact_count'],
        createdAt,
      }),
    );
    reporting.requestReportRun({
      workspaceId: 'ws-1',
      reportDefinitionId: 'def-kinds',
      window: createHistoricalWindow({
        from: '2026-08-10T00:00:00.000Z',
        to: '2026-08-11T00:00:00.000Z',
      }),
      modes: ['paper'],
      requestedAt: createdAt,
      reportRunId: 'run-kinds',
    });

    const before = JSON.stringify(query.getRun('run-kinds'));
    const beforeSlices = JSON.stringify(query.listAggregations('run-kinds'));

    const ai = moduleRef.get<AIAnalyticsPort>(AI_ANALYTICS_PORT);
    const explained = ai.explain({
      workspaceId: 'ws-1',
      reportRunId: 'run-kinds',
      requestedAt: createdAt,
      focus: 'ops review',
    });
    const trends = ai.identifyTrends({
      workspaceId: 'ws-1',
      reportRunId: 'run-kinds',
      requestedAt: createdAt,
    });
    const commentary = ai.generateNarrative({
      workspaceId: 'ws-1',
      reportRunId: 'run-kinds',
      requestedAt: createdAt,
    });

    expect(explained.kind).toBe('explain');
    expect(trends.kind).toBe('trends');
    expect(commentary.kind).toBe('narrative');
    expect(explained.text).toContain('ops review');
    expect(trends.text).toMatch(/Trend|trend/);
    expect(JSON.stringify(query.getRun('run-kinds'))).toBe(before);
    expect(JSON.stringify(query.listAggregations('run-kinds'))).toBe(beforeSlices);

    expect(ai).not.toHaveProperty('executeTrade');
    expect(ai).not.toHaveProperty('approveRisk');
    expect(ai).not.toHaveProperty('modifyReport');

    await moduleRef.close();
  });

  it('fail-softs when report run is missing without querying SoT', async () => {
    const moduleRef = await createAiModule();
    const ai = moduleRef.get<AIAnalyticsPort>(AI_ANALYTICS_PORT);
    const narrative = ai.summarize({
      workspaceId: 'ws-1',
      reportRunId: 'missing-run',
      requestedAt: createdAt,
    });
    expect(narrative.authorityClass).toBe('narrative');
    expect(narrative.text).toMatch(/unavailable/i);
    expect(narrative.modelMeta?.outcome).toBe('unavailable');
    await moduleRef.close();
  });
});
