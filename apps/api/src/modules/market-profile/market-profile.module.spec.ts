import { Test } from '@nestjs/testing';
import { describe, expect, it } from 'vitest';
import { InMemoryQualificationStore } from '../market-qualification/adapters/in-memory-qualification-store';
import { LiveMarketDataReadAdapter } from '../market-qualification/adapters/live-market-data-read.adapter';
import { ResearchOutputReadAdapter } from '../market-qualification/adapters/research-output-read.adapter';
import { MarketQualificationBoundaryService } from '../market-qualification/market-qualification-boundary.service';
import { MarketQualificationLifecycleService } from '../market-qualification/market-qualification-lifecycle.service';
import { MarketQualificationObservationalReadService } from '../market-qualification/market-qualification-observational-read.service';
import { MarketQualificationQueryService } from '../market-qualification/market-qualification-query.service';
import {
  LIVE_MARKET_DATA_READ_CONSUMER,
  MARKET_QUALIFICATION_QUERY_PORT,
  MARKET_QUALIFICATION_SERVICE_PORT,
  RESEARCH_OUTPUT_READ_CONSUMER,
} from '../market-qualification/ports/market-qualification.port';
import { KNOWLEDGE_LAKE_QUERY_PORT } from '../knowledge-lake/ports/knowledge-lake-query.port';
import { MarketDataQueryService } from '../live-market-data/api/market-data-query.service';
import { InMemoryMarketProfileStore } from './adapters/in-memory-market-profile-store';
import {
  MARKET_PROFILE_BOUNDARY,
  MARKET_PROFILE_MODULE_ID,
} from './domain/market-profile-boundary';
import { MarketProfileBoundaryService } from './market-profile-boundary.service';
import { MarketProfileObservationalReadService } from './market-profile-observational-read.service';
import { MarketProfileQueryService } from './market-profile-query.service';
import { MarketProfileVersioningService } from './market-profile-versioning.service';
import {
  MARKET_PROFILE_QUERY_PORT,
  MARKET_PROFILE_SERVICE_PORT,
} from './ports/market-profile.port';

function createFakeMarketDataQuery(latest: unknown[] = []) {
  return {
    listStatuses: () => Object.freeze([]),
    listLatest: () => Object.freeze(latest),
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

async function compileProfileTestModule(latest: unknown[] = []) {
  return Test.createTestingModule({
    providers: [
      MarketQualificationBoundaryService,
      LiveMarketDataReadAdapter,
      ResearchOutputReadAdapter,
      MarketQualificationObservationalReadService,
      InMemoryQualificationStore,
      MarketQualificationLifecycleService,
      MarketQualificationQueryService,
      { provide: MarketDataQueryService, useValue: createFakeMarketDataQuery(latest) },
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
      MarketProfileBoundaryService,
      MarketProfileObservationalReadService,
      InMemoryMarketProfileStore,
      MarketProfileVersioningService,
      MarketProfileQueryService,
      {
        provide: MARKET_PROFILE_SERVICE_PORT,
        useExisting: MarketProfileVersioningService,
      },
      {
        provide: MARKET_PROFILE_QUERY_PORT,
        useExisting: MarketProfileQueryService,
      },
    ],
  }).compile();
}

describe('RC-25 Epic 5 — Market Profile Nest versioning wiring', () => {
  it('wires publish + query ports; boundary marks them active', async () => {
    const moduleRef = await compileProfileTestModule();

    const boundary = moduleRef.get(MarketProfileBoundaryService);
    expect(boundary.getBoundary()).toBe(MARKET_PROFILE_BOUNDARY);
    expect(boundary.getBoundary().moduleId).toBe(MARKET_PROFILE_MODULE_ID);
    expect(boundary.getBoundary().activePorts.observationalInputReads).toBe(true);
    expect(boundary.getBoundary().activePorts.marketProfileService).toBe(true);
    expect(boundary.getBoundary().activePorts.marketProfileQuery).toBe(true);
    expect(boundary.getBoundary().activePorts.persistence).toBe(true);
    expect(boundary.getBoundary().activePorts.rest).toBe(false);
    expect(boundary.forcesTrade()).toBe(false);
    expect(boundary.expandsTacticalEnvelope()).toBe(false);

    expect(moduleRef.get(MarketProfileObservationalReadService)).toBeDefined();
    expect(moduleRef.get(MARKET_PROFILE_SERVICE_PORT)).toBeInstanceOf(
      MarketProfileVersioningService,
    );
    expect(moduleRef.get(MARKET_PROFILE_QUERY_PORT)).toBeInstanceOf(MarketProfileQueryService);
    expect(moduleRef.get(MARKET_QUALIFICATION_QUERY_PORT)).toBeDefined();

    await moduleRef.close();
  });
});

describe('RC-25 Epic 2 — Market Profile observational input reads', () => {
  it('maps Qualification LMD reads into unscored dimension inputs', async () => {
    const moduleRef = await compileProfileTestModule([
      {
        workspaceId: 'ws-1',
        streamId: 'stream-1',
        sourceId: 'binance_spot',
        instrument: 'ETHUSDT',
        channel: 'closed_candle',
        timeframe: '5m',
        latestClosedCandle: {
          eventId: 'c1',
          instrument: 'ETHUSDT',
          timeframe: '5m',
          openTime: '2026-08-10T11:55:00.000Z',
          closeTime: '2026-08-10T12:00:00.000Z',
          open: 1,
          high: 2,
          low: 1,
          close: 1.8,
          volume: 5,
          exchangeOccurredAt: '2026-08-10T12:00:00.000Z',
          sequence: 1,
        },
        latestMarkPrice: null,
        checkpoint: null,
        freshnessAt: '2026-08-10T12:00:00.000Z',
        projectionVersion: 1,
        updatedAt: '2026-08-10T12:00:00.000Z',
        authoritative: false,
      },
    ]);

    const reads = moduleRef.get(MarketProfileObservationalReadService);
    const volatility = reads.getVolatilityInputs({ workspaceId: 'ws-1' });
    expect(volatility).toHaveLength(1);
    expect(volatility[0]?.dimension).toBe('volatility');
    expect(volatility[0]?.scored).toBe(false);
    expect(volatility[0]?.authorityClass).toBe('observation');
    expect(Object.isFrozen(volatility[0])).toBe(true);

    expect(reads.getLiquidityInputs({ workspaceId: 'ws-1' })[0]?.dimension).toBe('liquidity');
    expect(reads.getTrendInputs({ workspaceId: 'ws-1' })[0]?.dimension).toBe('trend');
    expect(reads.getStructureInputs({ workspaceId: 'ws-1' })[0]?.dimension).toBe('structure');
    expect(reads.getMarketHistoryInputs({ workspaceId: 'ws-1' })[0]?.dimension).toBe('history');
    expect(reads.getApprovedResearchOutputs({ workspaceId: 'ws-1' })).toEqual([]);

    await moduleRef.close();
  });

  it('handles empty sources and forbids calculation helpers on the facade', async () => {
    const moduleRef = await compileProfileTestModule();
    const reads = moduleRef.get(MarketProfileObservationalReadService);

    expect(reads.getVolatilityInputs({ workspaceId: 'ws-missing' })).toEqual([]);
    expect(reads.getMarketHistoryInputs({ workspaceId: 'ws-missing' })).toEqual([]);
    expect(reads).not.toHaveProperty('computeVolatilityScore');
    expect(reads).not.toHaveProperty('selectStrategy');

    await moduleRef.close();
  });
});
