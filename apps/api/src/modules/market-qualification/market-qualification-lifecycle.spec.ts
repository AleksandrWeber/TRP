import { Test } from '@nestjs/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { KNOWLEDGE_LAKE_QUERY_PORT } from '../knowledge-lake/ports/knowledge-lake-query.port';
import { MarketDataQueryService } from '../live-market-data/api/market-data-query.service';
import { InMemoryQualificationStore } from './adapters/in-memory-qualification-store';
import { LiveMarketDataReadAdapter } from './adapters/live-market-data-read.adapter';
import { ResearchOutputReadAdapter } from './adapters/research-output-read.adapter';
import { MarketQualificationLifecycleService } from './market-qualification-lifecycle.service';
import { MarketQualificationObservationalReadService } from './market-qualification-observational-read.service';
import { MarketQualificationQueryService } from './market-qualification-query.service';
import {
  LIVE_MARKET_DATA_READ_CONSUMER,
  MARKET_QUALIFICATION_QUERY_PORT,
  MARKET_QUALIFICATION_SERVICE_PORT,
  RESEARCH_OUTPUT_READ_CONSUMER,
  type MarketQualificationQueryPort,
  type MarketQualificationServicePort,
} from './ports/market-qualification.port';

const TS = '2026-08-10T12:00:00.000Z';
const TS2 = '2026-08-10T12:01:00.000Z';
const TS3 = '2026-08-10T12:02:00.000Z';
const TS4 = '2026-08-10T12:03:00.000Z';

function createFakeMarketDataQuery() {
  return {
    listStatuses: () => Object.freeze([]),
    listLatest: () => Object.freeze([]),
    listSubscriptions: () => Object.freeze([]),
    getStatus: () => null,
    getLatest: () => null,
    getSubscription: () => null,
  } as unknown as MarketDataQueryService;
}

function createFakeLakeQuery() {
  return {
    getByEventId: () => null,
    list: () => ({
      authorityClass: 'projection' as const,
      items: [],
      nextCursor: null,
    }),
  };
}

async function compileLifecycleModule() {
  return Test.createTestingModule({
    providers: [
      LiveMarketDataReadAdapter,
      ResearchOutputReadAdapter,
      MarketQualificationObservationalReadService,
      InMemoryQualificationStore,
      MarketQualificationLifecycleService,
      MarketQualificationQueryService,
      { provide: MarketDataQueryService, useValue: createFakeMarketDataQuery() },
      { provide: KNOWLEDGE_LAKE_QUERY_PORT, useValue: createFakeLakeQuery() },
      {
        provide: LIVE_MARKET_DATA_READ_CONSUMER,
        useExisting: LiveMarketDataReadAdapter,
      },
      {
        provide: RESEARCH_OUTPUT_READ_CONSUMER,
        useExisting: ResearchOutputReadAdapter,
      },
      {
        provide: MARKET_QUALIFICATION_SERVICE_PORT,
        useExisting: MarketQualificationLifecycleService,
      },
      {
        provide: MARKET_QUALIFICATION_QUERY_PORT,
        useExisting: MarketQualificationQueryService,
      },
    ],
  }).compile();
}

describe('RC-25 Epic 4 — Market Qualification lifecycle', () => {
  let service: MarketQualificationServicePort;
  let query: MarketQualificationQueryPort;
  let store: InMemoryQualificationStore;
  let moduleRef: Awaited<ReturnType<typeof compileLifecycleModule>>;

  beforeEach(async () => {
    moduleRef = await compileLifecycleModule();
    service = moduleRef.get(MARKET_QUALIFICATION_SERVICE_PORT);
    query = moduleRef.get(MARKET_QUALIFICATION_QUERY_PORT);
    store = moduleRef.get(InMemoryQualificationStore);
    store.clear();
  });

  it('request → confirm → complete with immutable records and no auto-start', async () => {
    const requested = service.requestQualificationRun({
      workspaceId: 'ws-1',
      exchangeScopeId: 'scope-binance',
      marketSymbol: 'BTCUSDT',
      modeContext: 'lab',
      requestedBy: 'operator-1',
      requestedAt: TS,
      qualificationRunId: 'run-1',
    });

    expect(requested.outcome).toBe('accepted');
    expect(requested.forcesTrade).toBe(false);
    expect(requested.authorizesSession).toBe(false);
    expect(requested.qualificationState?.state).toBe('pending_confirm');

    const runAfterRequest = query.getQualificationRun({
      workspaceId: 'ws-1',
      qualificationRunId: 'run-1',
    });
    expect(runAfterRequest?.status).toBe('requested');
    expect(Object.isFrozen(runAfterRequest)).toBe(true);
    expect(Object.isFrozen(requested.qualificationState)).toBe(true);

    // Heavy work must not start without confirm.
    expect(
      query.getQualificationState({
        workspaceId: 'ws-1',
        exchangeScopeId: 'scope-binance',
        marketSymbol: 'BTCUSDT',
      })?.state,
    ).toBe('pending_confirm');

    const unconfirmedComplete = service.completeQualificationRun({
      workspaceId: 'ws-1',
      qualificationRunId: 'run-1',
      completedAt: TS2,
    });
    expect(unconfirmedComplete.outcome).toBe('rejected');
    expect(unconfirmedComplete.rejectionReasons).toContain('invalid_run_status:requested');

    const confirmed = service.confirmQualificationRun({
      workspaceId: 'ws-1',
      qualificationRunId: 'run-1',
      confirmedBy: 'operator-2',
      confirmedAt: TS2,
    });
    expect(confirmed.outcome).toBe('running');
    expect(confirmed.qualificationState?.state).toBe('qualifying');
    expect(confirmed.qualificationState?.activeRunId).toBe('run-1');

    const completed = service.completeQualificationRun({
      workspaceId: 'ws-1',
      qualificationRunId: 'run-1',
      completedAt: TS3,
      confidence: {
        level: 'medium',
        score: 0.6,
        rationaleSummary: 'caller-supplied only',
        asOf: TS3,
      },
      health: {
        status: 'healthy',
        indicators: [{ key: 'exchange_connectivity', value: 'ok' }],
        asOf: TS3,
      },
    });

    expect(completed.outcome).toBe('completed');
    expect(completed.qualificationState?.state).toBe('qualified');
    expect(completed.marketConfidence?.level).toBe('medium');
    expect(completed.marketConfidence?.forcesTrade).toBe(false);
    expect(completed.marketHealth?.status).toBe('healthy');
    expect(Object.isFrozen(completed.marketConfidence)).toBe(true);

    const priorRun = store.getRun('run-1');
    expect(priorRun?.status).toBe('completed');
    expect(Object.isFrozen(priorRun)).toBe(true);

    const confidence = query.getMarketConfidence({
      workspaceId: 'ws-1',
      exchangeScopeId: 'scope-binance',
      marketSymbol: 'BTCUSDT',
    });
    expect(confidence?.authorizesSession).toBe(false);
    expect(confidence?.authorityClass).toBe('research_artifact');

    await moduleRef.close();
  });

  it('rejects invalid transitions and protects against silent heavy start', async () => {
    const requested = service.requestQualificationRun({
      workspaceId: 'ws-1',
      exchangeScopeId: 'scope-binance',
      marketSymbol: 'ETHUSDT',
      modeContext: 'paper',
      requestedBy: 'op',
      requestedAt: TS,
      qualificationRunId: 'run-a',
    });
    expect(requested.outcome).toBe('accepted');

    const doubleRequest = service.requestQualificationRun({
      workspaceId: 'ws-1',
      exchangeScopeId: 'scope-binance',
      marketSymbol: 'ETHUSDT',
      modeContext: 'paper',
      requestedBy: 'op',
      requestedAt: TS2,
      qualificationRunId: 'run-b',
    });
    expect(doubleRequest.outcome).toBe('rejected');
    expect(doubleRequest.rejectionReasons?.[0]).toMatch(/already_pending_confirm|open_run/);

    const confirmMissingActor = service.confirmQualificationRun({
      workspaceId: 'ws-1',
      qualificationRunId: 'run-a',
      confirmedBy: '',
      confirmedAt: TS2,
    });
    expect(confirmMissingActor.outcome).toBe('rejected');

    service.confirmQualificationRun({
      workspaceId: 'ws-1',
      qualificationRunId: 'run-a',
      confirmedBy: 'op',
      confirmedAt: TS2,
    });

    const fail = service.failQualificationRun({
      workspaceId: 'ws-1',
      qualificationRunId: 'run-a',
      failedAt: TS3,
      reasons: ['observational_inputs_insufficient'],
    });
    expect(fail.outcome).toBe('failed');
    expect(fail.qualificationState?.state).toBe('failed');
    expect(Object.isFrozen(fail.qualificationState)).toBe(true);

    const completeAfterFail = service.completeQualificationRun({
      workspaceId: 'ws-1',
      qualificationRunId: 'run-a',
      completedAt: TS4,
    });
    expect(completeAfterFail.outcome).toBe('rejected');

    await moduleRef.close();
  });

  it('cancels pending runs and supports empty observational inputs', async () => {
    const requested = service.requestQualificationRun({
      workspaceId: 'ws-empty',
      exchangeScopeId: 'scope-x',
      marketSymbol: 'SOLUSDT',
      modeContext: 'live',
      requestedBy: 'op',
      requestedAt: TS,
      qualificationRunId: 'run-empty',
    });
    expect(requested.outcome).toBe('accepted');

    const run = query.getQualificationRun({
      workspaceId: 'ws-empty',
      qualificationRunId: 'run-empty',
    });
    expect(run?.inputSummary.observationCount).toBe(0);
    expect(run?.inputSummary.researchRefCount).toBe(0);

    const cancelled = service.cancelQualificationRun({
      workspaceId: 'ws-empty',
      qualificationRunId: 'run-empty',
      cancelledAt: TS2,
      reasons: ['operator_cancelled'],
    });
    expect(cancelled.outcome).toBe('cancelled');
    expect(cancelled.qualificationState?.state).toBe('failed');
    expect(
      query.getQualificationRun({
        workspaceId: 'ws-empty',
        qualificationRunId: 'run-empty',
      })?.status,
    ).toBe('cancelled');

    await moduleRef.close();
  });

  it('requalifies from qualified only after confirm (qualified → qualifying)', async () => {
    service.requestQualificationRun({
      workspaceId: 'ws-1',
      exchangeScopeId: 'scope-binance',
      marketSymbol: 'BTCUSDT',
      modeContext: 'lab',
      requestedBy: 'op',
      requestedAt: TS,
      qualificationRunId: 'run-1',
    });
    service.confirmQualificationRun({
      workspaceId: 'ws-1',
      qualificationRunId: 'run-1',
      confirmedBy: 'op',
      confirmedAt: TS2,
    });
    service.completeQualificationRun({
      workspaceId: 'ws-1',
      qualificationRunId: 'run-1',
      completedAt: TS3,
    });

    const requalify = service.requestQualificationRun({
      workspaceId: 'ws-1',
      exchangeScopeId: 'scope-binance',
      marketSymbol: 'BTCUSDT',
      modeContext: 'lab',
      requestedBy: 'op',
      requestedAt: TS4,
      qualificationRunId: 'run-2',
    });
    expect(requalify.outcome).toBe('accepted');
    // Domain: qualified stays until confirm; heavy work not started.
    expect(requalify.qualificationState?.state).toBe('qualified');
    expect(
      query.getQualificationRun({
        workspaceId: 'ws-1',
        qualificationRunId: 'run-2',
      })?.status,
    ).toBe('requested');

    const confirmed = service.confirmQualificationRun({
      workspaceId: 'ws-1',
      qualificationRunId: 'run-2',
      confirmedBy: 'op',
      confirmedAt: '2026-08-10T12:04:00.000Z',
    });
    expect(confirmed.outcome).toBe('running');
    expect(confirmed.qualificationState?.state).toBe('qualifying');

    const runs = query.listQualificationRuns({
      workspaceId: 'ws-1',
      exchangeScopeId: 'scope-binance',
      marketSymbol: 'BTCUSDT',
    });
    expect(runs).toHaveLength(2);
    expect(runs.every((r) => r.forcesTrade === false)).toBe(true);
    expect(runs.every((r) => r.authorizesSession === false)).toBe(true);

    await moduleRef.close();
  });

  it('query views never authorize trading or sessions', async () => {
    service.requestQualificationRun({
      workspaceId: 'ws-1',
      exchangeScopeId: 'scope-binance',
      marketSymbol: 'BTCUSDT',
      modeContext: 'lab',
      requestedBy: 'op',
      requestedAt: TS,
      qualificationRunId: 'run-q',
    });

    const target = query.getQualificationTarget({
      workspaceId: 'ws-1',
      exchangeScopeId: 'scope-binance',
      marketSymbol: 'BTCUSDT',
    });
    const state = query.getQualificationState({
      workspaceId: 'ws-1',
      exchangeScopeId: 'scope-binance',
      marketSymbol: 'BTCUSDT',
    });

    expect(target?.forcesTrade).toBe(false);
    expect(target?.authorizesSession).toBe(false);
    expect(state?.forcesTrade).toBe(false);
    expect(state?.authorizesSession).toBe(false);
    expect(service).not.toHaveProperty('scoreConfidence');
    expect(service).not.toHaveProperty('publishProfile');
    expect(service).not.toHaveProperty('selectStrategy');
    expect(query).not.toHaveProperty('authorizeSession');

    await moduleRef.close();
  });
});
