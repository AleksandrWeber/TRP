import { Test } from '@nestjs/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { KNOWLEDGE_LAKE_QUERY_PORT } from '../knowledge-lake/ports/knowledge-lake-query.port';
import { MarketDataQueryService } from '../live-market-data/api/market-data-query.service';
import { InMemoryQualificationStore } from '../market-qualification/adapters/in-memory-qualification-store';
import { LiveMarketDataReadAdapter } from '../market-qualification/adapters/live-market-data-read.adapter';
import { ResearchOutputReadAdapter } from '../market-qualification/adapters/research-output-read.adapter';
import { MarketQualificationLifecycleService } from '../market-qualification/market-qualification-lifecycle.service';
import { MarketQualificationObservationalReadService } from '../market-qualification/market-qualification-observational-read.service';
import { MarketQualificationQueryService } from '../market-qualification/market-qualification-query.service';
import {
  LIVE_MARKET_DATA_READ_CONSUMER,
  MARKET_QUALIFICATION_QUERY_PORT,
  MARKET_QUALIFICATION_SERVICE_PORT,
  RESEARCH_OUTPUT_READ_CONSUMER,
} from '../market-qualification/ports/market-qualification.port';
import { QualificationProductService } from './qualification-product.service';

const requestedAt = '2026-08-15T20:00:00.000Z';

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

async function compileProductModule() {
  return Test.createTestingModule({
    providers: [
      LiveMarketDataReadAdapter,
      ResearchOutputReadAdapter,
      MarketQualificationObservationalReadService,
      InMemoryQualificationStore,
      MarketQualificationLifecycleService,
      MarketQualificationQueryService,
      QualificationProductService,
      { provide: MarketDataQueryService, useValue: createFakeMarketDataQuery() },
      {
        provide: KNOWLEDGE_LAKE_QUERY_PORT,
        useValue: {
          getByEventId: () => null,
          list: () => ({ authorityClass: 'projection' as const, items: [], nextCursor: null }),
        },
      },
      { provide: LIVE_MARKET_DATA_READ_CONSUMER, useExisting: LiveMarketDataReadAdapter },
      { provide: RESEARCH_OUTPUT_READ_CONSUMER, useExisting: ResearchOutputReadAdapter },
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

describe('PC-08 QualificationProductService', () => {
  let product: QualificationProductService;
  let store: InMemoryQualificationStore;

  beforeEach(async () => {
    const moduleRef = await compileProductModule();
    product = moduleRef.get(QualificationProductService);
    store = moduleRef.get(InMemoryQualificationStore);
    store.clear();
  });

  it('requests, lists, confirms, and exposes existing lifecycle/confidence/health/history', () => {
    const created = product.request({
      workspaceId: 'ws-1',
      exchangeScopeId: 'scope-binance',
      marketSymbol: 'BTCUSDT',
      modeContext: 'paper',
      requestedBy: 'op-1',
      requestedAt,
    });
    expect(created.outcome).toBe('accepted');
    expect(created.forcesTrade).toBe(false);
    expect(created.authorizesSession).toBe(false);
    expect(created.scoresMarket).toBe(false);
    expect(created.target?.lifecycle.state).toBe('pending_confirm');

    const workspace = product.getWorkspace('ws-1');
    expect(workspace.targetCount).toBe(1);
    expect(workspace.pendingConfirmCount).toBe(1);
    expect(workspace.targets[0]?.marketSymbol).toBe('BTCUSDT');

    const confirmed = product.confirm({
      workspaceId: 'ws-1',
      qualificationRunId: created.qualificationRunId,
      confirmedBy: 'op-1',
      confirmedAt: '2026-08-15T20:01:00.000Z',
    });
    expect(confirmed.outcome).toBe('running');
    expect(confirmed.target?.lifecycle.state).toBe('qualifying');
    expect(confirmed.target?.lifecycle.actions.canComplete).toBe(true);

    const completed = product.complete({
      workspaceId: 'ws-1',
      qualificationRunId: created.qualificationRunId,
      completedAt: '2026-08-15T20:02:00.000Z',
    });
    expect(completed.outcome).toBe('completed');
    expect(completed.target?.lifecycle.state).toBe('qualified');
    expect(completed.target?.lifecycle.actions.canRequalify).toBe(true);
    expect(completed.calculatesConfidence).toBe(false);

    const detail = product.getTarget('ws-1', completed.target!.targetId);
    expect(detail?.runs).toHaveLength(1);
    expect(detail?.history.some((item) => item.kind === 'lifecycle')).toBe(true);
    expect(detail?.confidence).toBeNull();
    expect(detail?.health).toBeNull();
    expect(detail?.isMarketProfile).toBe(false);
    expect(detail?.isMarketState).toBe(false);

    const requalify = product.requalify({
      workspaceId: 'ws-1',
      exchangeScopeId: 'scope-binance',
      marketSymbol: 'BTCUSDT',
      modeContext: 'paper',
      requestedBy: 'op-1',
      requestedAt: '2026-08-15T20:03:00.000Z',
    });
    expect(requalify.outcome).toBe('accepted');
    expect(requalify.target?.lifecycle.state).toBe('qualified');
  });

  it('does not invent scoring or profile publish on complete', () => {
    const created = product.request({
      workspaceId: 'ws-1',
      exchangeScopeId: 'scope-binance',
      marketSymbol: 'ETHUSDT',
      modeContext: 'lab',
      requestedBy: 'op-1',
      requestedAt,
    });
    product.confirm({
      workspaceId: 'ws-1',
      qualificationRunId: created.qualificationRunId,
      confirmedBy: 'op-1',
      confirmedAt: '2026-08-15T20:01:00.000Z',
    });
    const completed = product.complete({
      workspaceId: 'ws-1',
      qualificationRunId: created.qualificationRunId,
      completedAt: '2026-08-15T20:02:00.000Z',
    });
    expect(completed.run?.confidence).toBeNull();
    expect(completed.publishedProfileId).toBeNull();
    expect(product).not.toHaveProperty('scoreConfidence');
    expect(product).not.toHaveProperty('publishProfileVersion');
  });
});
