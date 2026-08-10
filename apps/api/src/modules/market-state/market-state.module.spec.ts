import { Test } from '@nestjs/testing';
import { describe, expect, it } from 'vitest';
import { MarketDataQueryService } from '../live-market-data/api/market-data-query.service';
import { MARKET_QUALIFICATION_CONSUMER_READ_PORT } from '../market-qualification/ports/market-qualification-consumer.port';
import { MARKET_PROFILE_CONSUMER_READ_PORT } from '../market-profile/ports/market-profile-consumer.port';
import { MarketStateLiveMarketDataReadAdapter } from './adapters/live-market-data-read.adapter';
import { MarketStateProfileReadAdapter } from './adapters/profile-consumer-read.adapter';
import { MarketStateQualificationReadAdapter } from './adapters/qualification-consumer-read.adapter';
import { MARKET_STATE_BOUNDARY, MARKET_STATE_MODULE_ID } from './domain/market-state-boundary';
import { MarketStateBoundaryService } from './market-state-boundary.service';
import { MarketStateObservationalReadService } from './market-state-observational-read.service';
import {
  MARKET_STATE_CONSUMER_READ_PORT,
  MARKET_STATE_LIVE_MARKET_DATA_READ_CONSUMER,
  MARKET_STATE_PROFILE_CONSUMER,
  MARKET_STATE_QUALIFICATION_CONSUMER,
  MARKET_STATE_QUERY_PORT,
  MARKET_STATE_SERVICE_PORT,
} from './ports/market-state.port';

function createFakeMarketDataQuery(
  latest: unknown[] = [],
  statuses: unknown[] = [],
  subscriptions: unknown[] = [],
) {
  return {
    listStatuses: () => Object.freeze(statuses),
    listLatest: () => Object.freeze(latest),
    listSubscriptions: () => Object.freeze(subscriptions),
    getStatus: () => null,
    getLatest: () => null,
    getSubscription: () => null,
  } as unknown as MarketDataQueryService;
}

function createFakeQualificationConsumer(summary: unknown = null) {
  return {
    getLifecycleStatus: () => (summary as { lifecycle?: unknown } | null)?.lifecycle ?? null,
    getConfidenceProjection: () => (summary as { confidence?: unknown } | null)?.confidence ?? null,
    getHealthProjection: () => (summary as { health?: unknown } | null)?.health ?? null,
    getQualificationSummary: () => summary,
  };
}

function createFakeProfileConsumer(latest: unknown = null, history: unknown[] = []) {
  return {
    getLatestProfileProjection: () => latest,
    getProfileHistory: () => Object.freeze(history),
    getProfileVersionMetadata: () => null,
  };
}

async function compileMarketStateReadModule(opts?: {
  latest?: unknown[];
  statuses?: unknown[];
  subscriptions?: unknown[];
  qualificationSummary?: unknown;
  profileLatest?: unknown;
  profileHistory?: unknown[];
}) {
  return Test.createTestingModule({
    providers: [
      MarketStateBoundaryService,
      MarketStateLiveMarketDataReadAdapter,
      MarketStateQualificationReadAdapter,
      MarketStateProfileReadAdapter,
      MarketStateObservationalReadService,
      {
        provide: MarketDataQueryService,
        useValue: createFakeMarketDataQuery(
          opts?.latest ?? [],
          opts?.statuses ?? [],
          opts?.subscriptions ?? [],
        ),
      },
      {
        provide: MARKET_QUALIFICATION_CONSUMER_READ_PORT,
        useValue: createFakeQualificationConsumer(opts?.qualificationSummary ?? null),
      },
      {
        provide: MARKET_PROFILE_CONSUMER_READ_PORT,
        useValue: createFakeProfileConsumer(
          opts?.profileLatest ?? null,
          opts?.profileHistory ?? [],
        ),
      },
      {
        provide: MARKET_STATE_LIVE_MARKET_DATA_READ_CONSUMER,
        useExisting: MarketStateLiveMarketDataReadAdapter,
      },
      {
        provide: MARKET_STATE_QUALIFICATION_CONSUMER,
        useExisting: MarketStateQualificationReadAdapter,
      },
      {
        provide: MARKET_STATE_PROFILE_CONSUMER,
        useExisting: MarketStateProfileReadAdapter,
      },
    ],
  }).compile();
}

describe('RC-26 Epic 2 — Market State Nest read wiring', () => {
  it('wires input consumers; classify/query remain inactive', async () => {
    const moduleRef = await compileMarketStateReadModule();

    const boundary = moduleRef.get(MarketStateBoundaryService);
    expect(boundary.getBoundary()).toBe(MARKET_STATE_BOUNDARY);
    expect(boundary.getBoundary().moduleId).toBe(MARKET_STATE_MODULE_ID);
    expect(boundary.getBoundary().activePorts.liveMarketDataConsumer).toBe(true);
    expect(boundary.getBoundary().activePorts.qualificationConsumer).toBe(true);
    expect(boundary.getBoundary().activePorts.profileConsumer).toBe(true);
    expect(boundary.getBoundary().activePorts.marketStateService).toBe(false);
    expect(boundary.getBoundary().activePorts.marketStateQuery).toBe(false);
    expect(boundary.getBoundary().activePorts.persistence).toBe(false);
    expect(boundary.getBoundary().activePorts.rest).toBe(false);
    expect(boundary.isQualification()).toBe(false);
    expect(boundary.isProfile()).toBe(false);

    expect(moduleRef.get(MarketStateObservationalReadService)).toBeDefined();
    expect(moduleRef.get(MARKET_STATE_LIVE_MARKET_DATA_READ_CONSUMER)).toBeInstanceOf(
      MarketStateLiveMarketDataReadAdapter,
    );
    expect(moduleRef.get(MARKET_STATE_QUALIFICATION_CONSUMER)).toBeInstanceOf(
      MarketStateQualificationReadAdapter,
    );
    expect(moduleRef.get(MARKET_STATE_PROFILE_CONSUMER)).toBeInstanceOf(
      MarketStateProfileReadAdapter,
    );

    expect(() => moduleRef.get(MARKET_STATE_SERVICE_PORT)).toThrow();
    expect(() => moduleRef.get(MARKET_STATE_QUERY_PORT)).toThrow();
    // Partial Epic-2 compile fixture does not wire consumer-read; full module does (Epic 6).
    expect(() => moduleRef.get(MARKET_STATE_CONSUMER_READ_PORT)).toThrow();

    await moduleRef.close();
  });

  it('full MarketStateModule wires consumer-read while classify/query stay inactive', async () => {
    const { MarketStateModule } = await import('./market-state.module');
    const moduleRef = await Test.createTestingModule({
      imports: [MarketStateModule],
    }).compile();

    expect(moduleRef.get(MARKET_STATE_CONSUMER_READ_PORT)).toBeDefined();
    expect(() => moduleRef.get(MARKET_STATE_SERVICE_PORT)).toThrow();
    expect(() => moduleRef.get(MARKET_STATE_QUERY_PORT)).toThrow();
    expect(moduleRef.get(MarketStateBoundaryService).getBoundary().activePorts.consumerRead).toBe(
      true,
    );

    await moduleRef.close();
  });

  it('maps LMD snapshots immutably and handles empty sources', async () => {
    const moduleRef = await compileMarketStateReadModule({
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
            openTime: '2026-08-10T12:00:00.000Z',
            closeTime: '2026-08-10T12:01:00.000Z',
            open: 1,
            high: 2,
            low: 1,
            close: 1.5,
            volume: 10,
            exchangeOccurredAt: '2026-08-10T12:01:00.000Z',
            sequence: 1,
          },
          latestMarkPrice: null,
          checkpoint: null,
          freshnessAt: '2026-08-10T12:01:00.000Z',
          projectionVersion: 1,
          updatedAt: '2026-08-10T12:01:00.000Z',
          authoritative: false,
        },
      ],
      statuses: [
        {
          workspaceId: 'ws-1',
          sourceId: 'binance_spot',
          instrument: 'BTCUSDT',
          streamId: 'stream-1',
          status: 'healthy',
          sequence: 1,
          reason: null,
          updatedAt: '2026-08-10T12:01:00.000Z',
          lastOperationalMessageAt: null,
          operationalOnly: true,
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
          state: 'active',
          updatedAt: '2026-08-10T12:01:00.000Z',
        },
      ],
    });

    const reads = moduleRef.get(MarketStateObservationalReadService);
    const snapshots = reads.getCurrentMarketSnapshots({ workspaceId: 'ws-1' });
    expect(snapshots).toHaveLength(1);
    expect(snapshots[0]?.authorityClass).toBe('observation');
    expect(snapshots[0]?.authoritative).toBe(false);
    expect(snapshots[0]?.isMarketStateClassification).toBe(false);
    expect(snapshots[0]?.forcesTrade).toBe(false);
    expect(Object.isFrozen(snapshots[0])).toBe(true);

    const symbols = reads.getSymbolState({ workspaceId: 'ws-1' });
    expect(symbols.empty).toBe(false);
    expect(symbols.symbols[0]?.operationalOnly).toBe(true);

    const meta = reads.getExchangeMetadata({ workspaceId: 'ws-1' });
    expect(meta[0]?.subscriptionState).toBe('active');

    expect(reads.getCurrentMarketSnapshots({ workspaceId: 'ws-missing' })).toEqual([]);
    expect(reads.getSymbolState({ workspaceId: 'ws-missing' }).empty).toBe(true);
    expect(reads.getExchangeMetadata({ workspaceId: 'ws-missing' })).toEqual([]);

    expect(reads).not.toHaveProperty('classifyMarketState');
    expect(reads).not.toHaveProperty('selectStrategy');
    expect(reads).not.toHaveProperty('scoreRegime');

    await moduleRef.close();
  });

  it('maps Qualification and Profile projections without ownership transfer', async () => {
    const moduleRef = await compileMarketStateReadModule({
      qualificationSummary: {
        workspaceId: 'ws-1',
        exchangeScopeId: 'binance',
        marketSymbol: 'BTCUSDT',
        targetId: 't1',
        lifecycle: {
          workspaceId: 'ws-1',
          exchangeScopeId: 'binance',
          marketSymbol: 'BTCUSDT',
          targetId: 't1',
          state: 'qualified',
          updatedAt: '2026-08-10T12:00:00.000Z',
          authorityClass: 'research_artifact',
          forcesTrade: false,
          authorizesSession: false,
          mutable: false,
          consumerWritable: false,
        },
        confidence: {
          workspaceId: 'ws-1',
          exchangeScopeId: 'binance',
          marketSymbol: 'BTCUSDT',
          targetId: 't1',
          level: 'high',
          rationaleSummary: 'ok',
          sourceRunId: 'run-1',
          asOf: '2026-08-10T12:00:00.000Z',
          authorityClass: 'research_artifact',
          forcesTrade: false,
          authorizesSession: false,
          mutable: false,
          consumerWritable: false,
        },
        health: {
          workspaceId: 'ws-1',
          exchangeScopeId: 'binance',
          marketSymbol: 'BTCUSDT',
          targetId: 't1',
          status: 'healthy',
          indicatorCount: 2,
          sourceRunId: 'run-1',
          asOf: '2026-08-10T12:00:00.000Z',
          authorityClass: 'research_artifact',
          forcesTrade: false,
          authorizesSession: false,
          mutable: false,
          consumerWritable: false,
        },
        latestRunStatus: 'completed',
        authorityClass: 'research_artifact',
        forcesTrade: false,
        authorizesSession: false,
        mutable: false,
        consumerWritable: false,
      },
      profileLatest: {
        marketProfileId: 'mp-1',
        workspaceId: 'ws-1',
        targetId: 't1',
        exchangeScopeId: 'binance',
        marketSymbol: 'BTCUSDT',
        version: 3,
        qualificationRunId: 'run-1',
        dimensions: {
          volatilityRegime: 'medium',
          liquidityRegime: 'high',
          trendRegime: 'up',
          structureCharacteristicCount: 1,
        },
        confidenceLevel: 'high',
        publishedAt: '2026-08-10T12:00:00.000Z',
        authorityClass: 'research_artifact',
        forcesTrade: false,
        authorizesSession: false,
        mutable: false,
        consumerWritable: false,
      },
      profileHistory: [
        {
          marketProfileId: 'mp-1',
          workspaceId: 'ws-1',
          targetId: 't1',
          exchangeScopeId: 'binance',
          marketSymbol: 'BTCUSDT',
          version: 3,
          qualificationRunId: 'run-1',
          publishedAt: '2026-08-10T12:00:00.000Z',
          authorityClass: 'research_artifact',
          forcesTrade: false,
          authorizesSession: false,
          mutable: false,
          consumerWritable: false,
        },
      ],
    });

    const reads = moduleRef.get(MarketStateObservationalReadService);
    const target = {
      workspaceId: 'ws-1',
      exchangeScopeId: 'binance',
      marketSymbol: 'BTCUSDT',
    };

    const summary = reads.getQualificationSummary(target);
    expect(summary?.authorityClass).toBe('research_artifact');
    expect(summary?.isQualificationOwnership).toBe(false);
    expect(summary?.isMarketStateClassification).toBe(false);
    expect(summary?.confidence?.level).toBe('high');
    expect(Object.isFrozen(summary)).toBe(true);

    const profile = reads.getLatestProfile(target);
    expect(profile?.authorityClass).toBe('research_artifact');
    expect(profile?.isProfileOwnership).toBe(false);
    expect(profile?.version).toBe(3);
    expect(reads.getProfileHistory(target)).toHaveLength(1);

    expect(reads.getQualificationSummary({ ...target, workspaceId: '' })).toBeNull();
    expect(reads.getLatestProfile({ ...target, marketSymbol: '' })).toBeNull();

    await moduleRef.close();
  });
});
