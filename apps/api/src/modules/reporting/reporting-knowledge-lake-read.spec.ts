import { Test } from '@nestjs/testing';
import { describe, expect, it } from 'vitest';
import { OutboxDispatcher } from '../event-processing';
import type { AnalyticalFactAdmission } from '../knowledge-lake/domain/analytical-fact-admission';
import { InMemoryKnowledgeLakeIngestionAdapter } from '../knowledge-lake/ingestion/in-memory-knowledge-lake-ingestion.adapter';
import { REPORTING_BOUNDARY } from './domain/reporting-boundary';
import {
  KNOWLEDGE_LAKE_QUERY_CONSUMER,
  REPORTING_QUERY_PORT,
  REPORTING_SERVICE_PORT,
} from './ports/reporting.port';
import { ReportingBoundaryService } from './reporting-boundary.service';
import { ReportingKnowledgeLakeReadService } from './reporting-knowledge-lake-read.service';
import { ReportingModule } from './reporting.module';

function admit(
  lake: InMemoryKnowledgeLakeIngestionAdapter,
  overrides: Partial<AnalyticalFactAdmission> & Pick<AnalyticalFactAdmission, 'eventId'>,
): void {
  const result = lake.admit({
    occurredAt: '2026-08-10T12:00:00.000Z',
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

describe('RC-24 Epic 2/4 — ReportingModule Lake + generation wiring', () => {
  it('wires Lake consumer + generation/query ports; Reporting remains projection-only', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [ReportingModule],
    })
      .overrideProvider(OutboxDispatcher)
      .useValue({
        register: () => undefined,
        stop: async () => undefined,
        start: () => undefined,
      })
      .compile();

    const boundary = moduleRef.get(ReportingBoundaryService);
    expect(boundary.getBoundary()).toBe(REPORTING_BOUNDARY);
    expect(boundary.getBoundary().activePorts.knowledgeLakeConsumer).toBe(true);
    expect(boundary.getBoundary().activePorts.reportingService).toBe(true);
    expect(boundary.getBoundary().activePorts.reportingQuery).toBe(true);
    expect(boundary.getBoundary().activePorts.persistence).toBe(true);
    expect(boundary.getBoundary().activePorts.rest).toBe(false);
    expect(boundary.isSourceOfTruth()).toBe(false);

    expect(moduleRef.get(ReportingKnowledgeLakeReadService)).toBeDefined();
    expect(moduleRef.get(KNOWLEDGE_LAKE_QUERY_CONSUMER)).toBeDefined();
    expect(moduleRef.get(REPORTING_SERVICE_PORT)).toBeDefined();
    expect(moduleRef.get(REPORTING_QUERY_PORT)).toBeDefined();

    await moduleRef.close();
  });
});

describe('RC-24 Epic 2 — Reporting Knowledge Lake read integration', () => {
  it('reads analytical facts via Lake Query Port as immutable projections', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [ReportingModule],
    })
      .overrideProvider(OutboxDispatcher)
      .useValue({
        register: () => undefined,
        stop: async () => undefined,
        start: () => undefined,
      })
      .compile();

    const lake = moduleRef.get(InMemoryKnowledgeLakeIngestionAdapter);
    admit(lake, {
      eventId: 'evt-trade-1',
      occurredAt: '2026-08-10T10:00:00.000Z',
      tradingSessionId: 'session-1',
      exchangeScopeId: 'scope-binance',
      correlationId: 'corr-a',
    });
    admit(lake, {
      eventId: 'evt-risk-1',
      occurredAt: '2026-08-10T11:00:00.000Z',
      producer: 'risk-engine',
      category: 'Risk',
      tradingSessionId: 'session-1',
      correlationId: 'corr-a',
    });
    admit(lake, {
      eventId: 'evt-other-ws',
      workspaceId: 'ws-2',
    });

    const reads = moduleRef.get(ReportingKnowledgeLakeReadService);
    const page = reads.list({ workspaceId: 'ws-1' });

    expect(page.authorityClass).toBe('projection');
    expect(page.items.map((f) => f.eventId)).toEqual(['evt-trade-1', 'evt-risk-1']);
    expect(Object.isFrozen(page)).toBe(true);
    expect(Object.isFrozen(page.items[0])).toBe(true);

    const one = reads.getByEventId('evt-risk-1');
    expect(one?.producer).toBe('risk-engine');
    expect(one?.category).toBe('Risk');
    expect(one?.authorityClass).toBe('projection');
    expect(Object.isFrozen(one)).toBe(true);

    await moduleRef.close();
  });

  it('handles empty results and missing event ids', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [ReportingModule],
    })
      .overrideProvider(OutboxDispatcher)
      .useValue({
        register: () => undefined,
        stop: async () => undefined,
        start: () => undefined,
      })
      .compile();

    const reads = moduleRef.get(ReportingKnowledgeLakeReadService);
    const empty = reads.list({ workspaceId: 'ws-empty' });
    expect(empty.authorityClass).toBe('projection');
    expect(empty.items).toEqual([]);
    expect(empty.nextCursor).toBeNull();
    expect(reads.getByEventId('missing')).toBeNull();

    await moduleRef.close();
  });

  it('filters by category, producer, mode, session, scope, correlation, time', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [ReportingModule],
    })
      .overrideProvider(OutboxDispatcher)
      .useValue({
        register: () => undefined,
        stop: async () => undefined,
        start: () => undefined,
      })
      .compile();

    const lake = moduleRef.get(InMemoryKnowledgeLakeIngestionAdapter);
    admit(lake, {
      eventId: 'evt-trade-1',
      occurredAt: '2026-08-10T10:00:00.000Z',
      tradingSessionId: 'session-1',
      exchangeScopeId: 'scope-binance',
      correlationId: 'corr-a',
    });
    admit(lake, {
      eventId: 'evt-research-1',
      occurredAt: '2026-08-10T12:00:00.000Z',
      producer: 'research-lab',
      category: 'Research',
      mode: 'research',
      correlationId: 'corr-b',
    });
    admit(lake, {
      eventId: 'evt-trade-2',
      occurredAt: '2026-08-10T13:00:00.000Z',
      producer: 'orders',
      tradingSessionId: 'session-2',
      exchangeScopeId: 'scope-binance',
    });

    const reads = moduleRef.get(ReportingKnowledgeLakeReadService);

    expect(
      reads.list({ workspaceId: 'ws-1', categories: ['Research'] }).items.map((f) => f.eventId),
    ).toEqual(['evt-research-1']);
    expect(
      reads.list({ workspaceId: 'ws-1', producers: ['orders'] }).items.map((f) => f.eventId),
    ).toEqual(['evt-trade-2']);
    expect(
      reads.list({ workspaceId: 'ws-1', mode: 'research' }).items.map((f) => f.eventId),
    ).toEqual(['evt-research-1']);
    expect(
      reads
        .list({ workspaceId: 'ws-1', tradingSessionId: 'session-1' })
        .items.map((f) => f.eventId),
    ).toEqual(['evt-trade-1']);
    expect(
      reads
        .list({ workspaceId: 'ws-1', exchangeScopeId: 'scope-binance' })
        .items.map((f) => f.eventId),
    ).toEqual(['evt-trade-1', 'evt-trade-2']);
    expect(
      reads.list({ workspaceId: 'ws-1', correlationId: 'corr-a' }).items.map((f) => f.eventId),
    ).toEqual(['evt-trade-1']);
    expect(
      reads
        .list({
          workspaceId: 'ws-1',
          occurredFrom: '2026-08-10T11:00:00.000Z',
          occurredTo: '2026-08-10T13:00:00.000Z',
        })
        .items.map((f) => f.eventId),
    ).toEqual(['evt-research-1']);

    await moduleRef.close();
  });

  it('does not introduce report generation behaviour on the read service', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [ReportingModule],
    })
      .overrideProvider(OutboxDispatcher)
      .useValue({
        register: () => undefined,
        stop: async () => undefined,
        start: () => undefined,
      })
      .compile();

    const reads = moduleRef.get(ReportingKnowledgeLakeReadService);
    expect(reads).not.toHaveProperty('requestReportRun');
    expect(reads).not.toHaveProperty('aggregate');
    expect(reads).not.toHaveProperty('summarize');
    expect(reads).not.toHaveProperty('generateNarrative');

    await moduleRef.close();
  });
});
