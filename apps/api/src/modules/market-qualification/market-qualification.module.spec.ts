import { Test } from '@nestjs/testing';
import { describe, expect, it } from 'vitest';
import type { AnalyticalFact } from '../knowledge-lake/domain/analytical-fact-admission';
import { KNOWLEDGE_LAKE_QUERY_PORT } from '../knowledge-lake/ports/knowledge-lake-query.port';
import { MarketDataQueryService } from '../live-market-data/api/market-data-query.service';
import { InMemoryQualificationStore } from './adapters/in-memory-qualification-store';
import { LiveMarketDataReadAdapter } from './adapters/live-market-data-read.adapter';
import { ResearchOutputReadAdapter } from './adapters/research-output-read.adapter';
import {
  MARKET_QUALIFICATION_BOUNDARY,
  MARKET_QUALIFICATION_MODULE_ID,
} from './domain/market-qualification-boundary';
import { MarketQualificationBoundaryService } from './market-qualification-boundary.service';
import { MarketQualificationLifecycleService } from './market-qualification-lifecycle.service';
import { MarketQualificationObservationalReadService } from './market-qualification-observational-read.service';
import { MarketQualificationQueryService } from './market-qualification-query.service';
import {
  LIVE_MARKET_DATA_READ_CONSUMER,
  MARKET_QUALIFICATION_QUERY_PORT,
  MARKET_QUALIFICATION_SERVICE_PORT,
  RESEARCH_OUTPUT_READ_CONSUMER,
} from './ports/market-qualification.port';

function createFakeMarketDataQuery(overrides?: {
  statuses?: unknown[];
  latest?: unknown[];
  subscriptions?: unknown[];
}) {
  return {
    listStatuses: () => Object.freeze(overrides?.statuses ?? []),
    listLatest: () => Object.freeze(overrides?.latest ?? []),
    listSubscriptions: () => Object.freeze(overrides?.subscriptions ?? []),
    getStatus: () => null,
    getLatest: () => null,
    getSubscription: () => null,
  } as unknown as MarketDataQueryService;
}

function createFakeLakeQuery(facts: AnalyticalFact[] = []) {
  return {
    getByEventId: (eventId: string) => facts.find((f) => f.eventId === eventId) ?? null,
    list: (query: { workspaceId: string; categories?: readonly string[] }) => {
      const items = facts.filter((f) => {
        if (f.workspaceId !== query.workspaceId) return false;
        if (query.categories && !query.categories.includes(f.category)) {
          return false;
        }
        return true;
      });
      return {
        authorityClass: 'projection' as const,
        items,
        nextCursor: null,
      };
    },
  };
}

async function compileQualificationTestModule(
  marketData = createFakeMarketDataQuery(),
  lake = createFakeLakeQuery(),
) {
  return Test.createTestingModule({
    providers: [
      MarketQualificationBoundaryService,
      LiveMarketDataReadAdapter,
      ResearchOutputReadAdapter,
      MarketQualificationObservationalReadService,
      InMemoryQualificationStore,
      MarketQualificationLifecycleService,
      MarketQualificationQueryService,
      { provide: MarketDataQueryService, useValue: marketData },
      { provide: KNOWLEDGE_LAKE_QUERY_PORT, useValue: lake },
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

describe('RC-25 Epic 4 — Market Qualification Nest lifecycle wiring', () => {
  it('wires lifecycle + query ports; boundary marks them active', async () => {
    const moduleRef = await compileQualificationTestModule();

    const boundary = moduleRef.get(MarketQualificationBoundaryService);
    expect(boundary.getBoundary()).toBe(MARKET_QUALIFICATION_BOUNDARY);
    expect(boundary.getBoundary().moduleId).toBe(MARKET_QUALIFICATION_MODULE_ID);
    expect(boundary.getBoundary().activePorts.liveMarketDataConsumer).toBe(true);
    expect(boundary.getBoundary().activePorts.researchOutputConsumer).toBe(true);
    expect(boundary.getBoundary().activePorts.marketQualificationService).toBe(true);
    expect(boundary.getBoundary().activePorts.marketQualificationQuery).toBe(true);
    expect(boundary.getBoundary().activePorts.persistence).toBe(true);
    expect(boundary.getBoundary().activePorts.rest).toBe(false);
    expect(boundary.isExecutionSourceOfTruth()).toBe(false);

    expect(moduleRef.get(LIVE_MARKET_DATA_READ_CONSUMER)).toBeDefined();
    expect(moduleRef.get(RESEARCH_OUTPUT_READ_CONSUMER)).toBeDefined();
    expect(moduleRef.get(MarketQualificationObservationalReadService)).toBeDefined();
    expect(moduleRef.get(MARKET_QUALIFICATION_SERVICE_PORT)).toBeInstanceOf(
      MarketQualificationLifecycleService,
    );
    expect(moduleRef.get(MARKET_QUALIFICATION_QUERY_PORT)).toBeInstanceOf(
      MarketQualificationQueryService,
    );

    await moduleRef.close();
  });
});

describe('RC-25 Epic 2 — Live Market Data + Research read integration', () => {
  it('reads immutable observational slices and research refs', async () => {
    const marketData = createFakeMarketDataQuery({
      statuses: [
        {
          workspaceId: 'ws-1',
          sourceId: 'binance_spot',
          instrument: 'BTCUSDT',
          streamId: 'stream-1',
          status: 'healthy',
          sequence: 1,
          reason: null,
          updatedAt: '2026-08-10T12:00:00.000Z',
          lastOperationalMessageAt: null,
          operationalOnly: true,
        },
      ],
      latest: [
        {
          workspaceId: 'ws-1',
          streamId: 'stream-1',
          sourceId: 'binance_spot',
          instrument: 'BTCUSDT',
          channel: 'closed_candle',
          timeframe: '1m',
          latestClosedCandle: {
            eventId: 'c1',
            instrument: 'BTCUSDT',
            timeframe: '1m',
            openTime: '2026-08-10T11:59:00.000Z',
            closeTime: '2026-08-10T12:00:00.000Z',
            open: 1,
            high: 2,
            low: 1,
            close: 1.5,
            volume: 10,
            exchangeOccurredAt: '2026-08-10T12:00:00.000Z',
            sequence: 1,
          },
          latestMarkPrice: {
            eventId: 'm1',
            instrument: 'BTCUSDT',
            price: '1.50',
            exchangeOccurredAt: '2026-08-10T12:00:00.000Z',
            sequence: 1,
          },
          checkpoint: null,
          freshnessAt: '2026-08-10T12:00:00.000Z',
          projectionVersion: 1,
          updatedAt: '2026-08-10T12:00:00.000Z',
          authoritative: false,
        },
      ],
      subscriptions: [
        {
          id: 'sub-1',
          workspaceId: 'ws-1',
          sourceId: 'binance_spot',
          instrument: 'BTCUSDT',
          channel: 'closed_candle',
          streamId: 'stream-1',
          state: 'desired',
          updatedAt: '2026-08-10T12:00:00.000Z',
        },
      ],
    });

    const researchFact: AnalyticalFact = {
      eventId: 'evt-research-1',
      occurredAt: '2026-08-10T10:00:00.000Z',
      admittedAt: '2026-08-10T10:00:01.000Z',
      producer: 'research-campaign',
      category: 'Research',
      mode: 'research',
      workspaceId: 'ws-1',
      exchangeScopeId: 'scope-binance',
      payload: { kind: 'campaign_completed' },
      schemaVersion: '1',
      sourceRef: { ownerType: 'campaign', id: 'camp-1' },
    };

    const moduleRef = await compileQualificationTestModule(
      marketData,
      createFakeLakeQuery([researchFact]),
    );

    const reads = moduleRef.get(MarketQualificationObservationalReadService);
    const health = reads.getConnectivityHealth({ workspaceId: 'ws-1' });
    expect(health.authorityClass).toBe('observation');
    expect(health.empty).toBe(false);
    expect(Object.isFrozen(health)).toBe(true);

    const observations = reads.getMarketObservations({ workspaceId: 'ws-1' });
    expect(observations).toHaveLength(1);
    expect(observations[0]?.authorityClass).toBe('observation');
    expect(observations[0]?.authoritative).toBe(false);
    expect(observations[0]?.latestClose).toBe(1.5);
    expect(Object.isFrozen(observations[0])).toBe(true);

    const metadata = reads.getExchangeMetadata({ workspaceId: 'ws-1' });
    expect(metadata[0]?.instrument).toBe('BTCUSDT');

    const history = reads.getHistoricalCharacteristics({ workspaceId: 'ws-1' });
    expect(history[0]?.kind).toBe('latest_snapshot');

    const research = reads.getApprovedResearchOutputs({ workspaceId: 'ws-1' });
    expect(research).toHaveLength(1);
    expect(research[0]?.authorityClass).toBe('research_artifact');
    expect(research[0]?.eventId).toBe('evt-research-1');
    expect(Object.isFrozen(research[0])).toBe(true);

    await moduleRef.close();
  });

  it('handles empty sources without inventing observations or research', async () => {
    const moduleRef = await compileQualificationTestModule();
    const reads = moduleRef.get(MarketQualificationObservationalReadService);

    expect(reads.getConnectivityHealth({ workspaceId: 'ws-missing' }).empty).toBe(true);
    expect(reads.getMarketObservations({ workspaceId: 'ws-missing' })).toEqual([]);
    expect(reads.getExchangeMetadata({ workspaceId: 'ws-missing' })).toEqual([]);
    expect(reads.getHistoricalCharacteristics({ workspaceId: 'ws-missing' })).toEqual([]);
    expect(reads.getApprovedResearchOutputs({ workspaceId: 'ws-missing' })).toEqual([]);
    expect(reads.getApprovedResearchOutputs({ workspaceId: '' })).toEqual([]);

    await moduleRef.close();
  });

  it('does not introduce evaluation / scoring behaviour on the read facade', async () => {
    const moduleRef = await compileQualificationTestModule();
    const reads = moduleRef.get(MarketQualificationObservationalReadService);
    expect(reads).not.toHaveProperty('requestQualificationRun');
    expect(reads).not.toHaveProperty('scoreConfidence');
    expect(reads).not.toHaveProperty('publishProfile');
    expect(reads).not.toHaveProperty('selectStrategy');
    await moduleRef.close();
  });
});
