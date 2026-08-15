import { Test } from '@nestjs/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { OutboxDispatcher } from '../../modules/event-processing';
import type { AnalyticalFactAdmission } from '../../modules/knowledge-lake/domain/analytical-fact-admission';
import { InMemoryKnowledgeLakeIngestionAdapter } from '../../modules/knowledge-lake/ingestion/in-memory-knowledge-lake-ingestion.adapter';
import {
  AI_ANALYTICS_PORT,
  type AIAnalyticsPort,
} from '../../modules/ai-analytics/ports/ai-analytics.port';
import { AiAnalyticsModule } from '../../modules/ai-analytics/ai-analytics.module';
import { ReportingModule } from '../../modules/reporting/reporting.module';
import { createHistoricalWindow } from '../../modules/reporting/domain/historical-window';
import { createReportDefinition } from '../../modules/reporting/domain/report-definition';
import {
  REPORTING_QUERY_PORT,
  REPORTING_SERVICE_PORT,
  type ReportingQueryPort,
  type ReportingServicePort,
} from '../../modules/reporting/ports/reporting.port';
import { ReportNarrativeConsumerService } from '../../modules/product-flow';

const at = '2026-08-15T17:00:00.000Z';

function admit(
  lake: InMemoryKnowledgeLakeIngestionAdapter,
  overrides: Partial<AnalyticalFactAdmission> & Pick<AnalyticalFactAdmission, 'eventId'>,
): void {
  const result = lake.admit({
    occurredAt: '2026-08-15T10:00:00.000Z',
    producer: 'trading-session',
    category: 'Trading',
    mode: 'paper',
    workspaceId: 'ws-1',
    payload: { kind: 'marker', displayPnl: 4 },
    schemaVersion: '1',
    ...overrides,
  });
  expect(result.outcome).toBe('admitted');
}

async function compileFlow() {
  return Test.createTestingModule({
    imports: [ReportingModule, AiAnalyticsModule],
    providers: [ReportNarrativeConsumerService],
  })
    .overrideProvider(OutboxDispatcher)
    .useValue({
      register: () => undefined,
      stop: async () => undefined,
      start: () => undefined,
    })
    .compile();
}

describe('PC-15 15-c — Reporting → AI Analytics product flow', () => {
  let reporting: ReportingServicePort;
  let query: ReportingQueryPort;
  let ai: AIAnalyticsPort;
  let consumer: ReportNarrativeConsumerService;
  let lake: InMemoryKnowledgeLakeIngestionAdapter;

  beforeEach(async () => {
    const app = await compileFlow();
    reporting = app.get(REPORTING_SERVICE_PORT);
    query = app.get(REPORTING_QUERY_PORT);
    ai = app.get(AI_ANALYTICS_PORT);
    consumer = app.get(ReportNarrativeConsumerService);
    lake = app.get(InMemoryKnowledgeLakeIngestionAdapter);
    reporting.registerDefinition(
      createReportDefinition({
        reportDefinitionId: 'def-15c',
        workspaceId: 'ws-1',
        name: 'Ops Daily',
        kind: 'ops_daily',
        defaultModes: ['paper'],
        metricKeys: ['fact_count', 'display_pnl_projection'],
        createdAt: at,
      }),
    );
  });

  it('invokes AI when a ReportRun completes and exposes the attached narrative', () => {
    admit(lake, { eventId: 'evt-15c-1' });
    const beforeRuns = JSON.stringify(query.listRuns({ workspaceId: 'ws-1' }));

    const result = consumer.requestAndNarrate({
      workspaceId: 'ws-1',
      reportDefinitionId: 'def-15c',
      window: createHistoricalWindow({
        from: '2026-08-15T00:00:00.000Z',
        to: '2026-08-16T00:00:00.000Z',
      }),
      modes: ['paper'],
      requestedAt: at,
      reportRunId: 'run-15c-1',
    });

    expect(result.report.outcome).toBe('completed');
    expect(result.narrative.authorityClass).toBe('narrative');
    expect(result.narrative.kind).toBe('narrative');
    expect(result.narrative.reportRunId).toBe('run-15c-1');
    expect(result.attachment.attached).toBe(true);
    expect(result.attachment.reportMutated).toBe(false);
    expect(result.attachment.narrativeUnavailable).toBe(false);
    expect(result.attachment.narrativeText).toContain('run-15c-1');
    expect(result.narrative.sourceRefs.every((ref) => ref.ownerType !== 'knowledge-lake')).toBe(
      true,
    );

    const stored = query.getRun('run-15c-1');
    expect(stored?.reportRunId).toBe('run-15c-1');
    expect(stored).not.toHaveProperty('narrativeId');
    expect(JSON.stringify(query.listRuns({ workspaceId: 'ws-1' }))).not.toBe(beforeRuns);

    const exposed = consumer.getAttachedNarrative({
      workspaceId: 'ws-1',
      reportRunId: 'run-15c-1',
      requestedAt: at,
    });
    expect(exposed.narrativeId).toBe(result.narrative.narrativeId);
    expect(exposed.narrativeText).toBe(result.narrative.text);
  });

  it('preserves ReportRun immutability and narrative determinism', () => {
    admit(lake, { eventId: 'evt-15c-2' });
    const first = consumer.requestAndNarrate({
      workspaceId: 'ws-1',
      reportDefinitionId: 'def-15c',
      window: createHistoricalWindow({
        from: '2026-08-15T00:00:00.000Z',
        to: '2026-08-16T00:00:00.000Z',
      }),
      modes: ['paper'],
      requestedAt: at,
      reportRunId: 'run-15c-det',
    });
    const snapshot = JSON.stringify(query.getRun('run-15c-det'));
    const slices = JSON.stringify(query.listAggregations('run-15c-det'));

    const second = consumer.narrateCompletedRun({
      workspaceId: 'ws-1',
      reportRunId: 'run-15c-det',
      requestedAt: at,
    });
    const direct = ai.generateNarrative({
      workspaceId: 'ws-1',
      reportRunId: 'run-15c-det',
      requestedAt: at,
    });

    expect(second.narrative).toEqual(first.narrative);
    expect(direct).toEqual(first.narrative);
    expect(JSON.stringify(query.getRun('run-15c-det'))).toBe(snapshot);
    expect(JSON.stringify(query.listAggregations('run-15c-det'))).toBe(slices);
    expect(Object.isFrozen(first.narrative)).toBe(true);
    expect(Object.isFrozen(query.getRun('run-15c-det'))).toBe(true);
  });

  it('still produces the existing unavailable narrative when Reporting cannot supply the run', () => {
    const result = consumer.narrateCompletedRun({
      workspaceId: 'ws-1',
      reportRunId: 'missing-15c',
      requestedAt: at,
    });
    expect(result.report.outcome).toBe('rejected');
    expect(result.narrative.modelMeta?.outcome).toBe('unavailable');
    expect(result.narrative.text).toMatch(/unavailable/i);
    expect(result.attachment.narrativeUnavailable).toBe(true);
    expect(result.attachment.reportMutated).toBe(false);
    expect(query.getRun('missing-15c')).toBeNull();
  });
});
