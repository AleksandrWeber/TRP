import { Test, type TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { deriveQualificationTargetId } from '../../market-qualification';
import { InMemoryMarketProfileStore } from '../adapters/in-memory-market-profile-store';
import { MarketProfileConsumerReadAdapter } from '../adapters/market-profile-consumer-read.adapter';
import { createMarketProfile } from '../domain/market-profile';
import { MarketProfileQueryService } from '../market-profile-query.service';
import {
  MARKET_PROFILE_CONSUMER_READ_PORT,
  type MarketProfileConsumerReadPort,
} from '../ports/market-profile-consumer.port';
import { MARKET_PROFILE_QUERY_PORT } from '../ports/market-profile.port';

const TS = '2026-08-10T12:00:00.000Z';
const TS2 = '2026-08-10T13:00:00.000Z';
const TARGET = {
  workspaceId: 'ws-1',
  exchangeScopeId: 'scope-binance',
  marketSymbol: 'BTCUSDT',
} as const;

function dimensionPayloads() {
  return {
    volatility: {
      regimeLabel: 'moderate',
      metrics: { realized_range: 0.02, observation_count: 10 },
      windowSummary: 'window',
    },
    liquidity: {
      regimeLabel: 'moderate',
      metrics: { volume_level: 1, observation_count: 10 },
      windowSummary: 'window',
    },
    trend: {
      regimeLabel: 'low',
      metrics: { directional_bias: 0, observation_count: 10 },
      windowSummary: 'window',
    },
    structure: {
      characteristics: [{ key: 'symbol_status', value: 'active' }],
    },
  };
}

describe('RC-25 Epic 6 — Market Profile consumer reads', () => {
  let consumer: MarketProfileConsumerReadPort;
  let store: InMemoryMarketProfileStore;
  let moduleRef: TestingModule;
  let targetId: string;

  beforeEach(async () => {
    moduleRef = await Test.createTestingModule({
      providers: [
        InMemoryMarketProfileStore,
        MarketProfileQueryService,
        MarketProfileConsumerReadAdapter,
        {
          provide: MARKET_PROFILE_QUERY_PORT,
          useExisting: MarketProfileQueryService,
        },
        {
          provide: MARKET_PROFILE_CONSUMER_READ_PORT,
          useExisting: MarketProfileConsumerReadAdapter,
        },
      ],
    }).compile();

    consumer = moduleRef.get(MARKET_PROFILE_CONSUMER_READ_PORT);
    store = moduleRef.get(InMemoryMarketProfileStore);
    store.clear();

    targetId = deriveQualificationTargetId(
      TARGET.workspaceId,
      TARGET.exchangeScopeId,
      TARGET.marketSymbol,
    );

    store.putProfile(
      createMarketProfile({
        marketProfileId: 'p-1',
        targetId,
        ...TARGET,
        version: 1,
        qualificationRunId: 'run-1',
        ...dimensionPayloads(),
        confidenceSummary: {
          level: 'medium',
          sourceRunId: 'run-1',
          rationaleSummary: 'v1',
        },
        publishedAt: TS,
        publishedBy: 'pipeline',
      }),
    );
    store.putProfile(
      createMarketProfile({
        marketProfileId: 'p-2',
        targetId,
        ...TARGET,
        version: 2,
        qualificationRunId: 'run-2',
        ...dimensionPayloads(),
        confidenceSummary: {
          level: 'high',
          sourceRunId: 'run-2',
          rationaleSummary: 'v2',
        },
        publishedAt: TS2,
        publishedBy: 'pipeline',
      }),
    );
  });

  it('exposes immutable latest / history / version-metadata projections', async () => {
    const latest = consumer.getLatestProfileProjection(TARGET);
    expect(latest?.version).toBe(2);
    expect(latest?.confidenceLevel).toBe('high');
    expect(latest?.dimensions.volatilityRegime).toBe('moderate');
    expect(latest?.mutable).toBe(false);
    expect(latest?.consumerWritable).toBe(false);
    expect(latest?.forcesTrade).toBe(false);
    expect(Object.isFrozen(latest)).toBe(true);
    expect(Object.isFrozen(latest?.dimensions)).toBe(true);

    const history = consumer.getProfileHistory(TARGET);
    expect(history).toHaveLength(2);
    expect(history.map((h) => h.version)).toEqual([1, 2]);
    expect(history.every((h) => h.consumerWritable === false)).toBe(true);

    const meta = consumer.getProfileVersionMetadata({ ...TARGET, version: 1 });
    expect(meta?.marketProfileId).toBe('p-1');
    expect(meta?.authorizesSession).toBe(false);
    expect(Object.isFrozen(meta)).toBe(true);

    // Prior version unchanged.
    expect(store.getByVersion(targetId, 1)?.confidenceSummary.rationaleSummary).toBe('v1');

    await moduleRef.close();
  });

  it('returns empty/null for unknown targets without mutating store', async () => {
    const before = store.listByTarget(targetId).length;
    expect(
      consumer.getLatestProfileProjection({
        workspaceId: 'ws-missing',
        exchangeScopeId: 'x',
        marketSymbol: 'Y',
      }),
    ).toBeNull();
    expect(
      consumer.getProfileHistory({
        workspaceId: 'ws-missing',
        exchangeScopeId: 'x',
        marketSymbol: 'Y',
      }),
    ).toEqual([]);
    expect(store.listByTarget(targetId)).toHaveLength(before);
    await moduleRef.close();
  });
});
