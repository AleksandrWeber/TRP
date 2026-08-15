import { Test } from '@nestjs/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { KNOWLEDGE_LAKE_QUERY_PORT } from '../../modules/knowledge-lake/ports/knowledge-lake-query.port';
import { MarketDataQueryService } from '../../modules/live-market-data/api/market-data-query.service';
import { InMemoryQualificationStore } from '../../modules/market-qualification/adapters/in-memory-qualification-store';
import { LiveMarketDataReadAdapter } from '../../modules/market-qualification/adapters/live-market-data-read.adapter';
import { ResearchOutputReadAdapter } from '../../modules/market-qualification/adapters/research-output-read.adapter';
import { MarketQualificationLifecycleService } from '../../modules/market-qualification/market-qualification-lifecycle.service';
import { MarketQualificationObservationalReadService } from '../../modules/market-qualification/market-qualification-observational-read.service';
import { MarketQualificationQueryService } from '../../modules/market-qualification/market-qualification-query.service';
import {
  LIVE_MARKET_DATA_READ_CONSUMER,
  MARKET_QUALIFICATION_QUERY_PORT,
  MARKET_QUALIFICATION_SERVICE_PORT,
  RESEARCH_OUTPUT_READ_CONSUMER,
  type MarketQualificationServicePort,
} from '../../modules/market-qualification/ports/market-qualification.port';
import { InMemoryMarketProfileStore } from '../../modules/market-profile/adapters/in-memory-market-profile-store';
import { MarketProfileConsumerReadAdapter } from '../../modules/market-profile/adapters/market-profile-consumer-read.adapter';
import { MarketProfileQueryService } from '../../modules/market-profile/market-profile-query.service';
import { MarketProfileVersioningService } from '../../modules/market-profile/market-profile-versioning.service';
import {
  MARKET_PROFILE_CONSUMER_READ_PORT,
  type MarketProfileConsumerReadPort,
} from '../../modules/market-profile/ports/market-profile-consumer.port';
import {
  MARKET_PROFILE_QUERY_PORT,
  MARKET_PROFILE_SERVICE_PORT,
  type MarketProfileQueryPort,
} from '../../modules/market-profile/ports/market-profile.port';
import { QualificationProfilePublisherService } from '../../modules/product-flow';

const TS = '2026-08-15T16:00:00.000Z';
const TS2 = '2026-08-15T16:01:00.000Z';
const TS3 = '2026-08-15T16:02:00.000Z';
const TS4 = '2026-08-15T16:03:00.000Z';
const TS5 = '2026-08-15T16:04:00.000Z';

const TARGET = {
  workspaceId: 'ws-1',
  exchangeScopeId: 'scope-binance',
  marketSymbol: 'BTCUSDT',
} as const;

function dimensionPayloads(observationCount = 10) {
  return {
    volatility: {
      regimeLabel: 'moderate' as const,
      metrics: { realized_range: 0.02, observation_count: observationCount },
      windowSummary: 'caller-supplied window',
    },
    liquidity: {
      regimeLabel: 'moderate' as const,
      metrics: { volume_level: 1, observation_count: observationCount },
      windowSummary: 'caller-supplied window',
    },
    trend: {
      regimeLabel: 'low' as const,
      metrics: { directional_bias: 0, observation_count: observationCount },
      windowSummary: 'caller-supplied window',
    },
    structure: {
      characteristics: [
        { key: 'symbol_status', value: 'active' },
        { key: 'data_quality_flag', value: 'ok' },
      ],
    },
  };
}

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

async function compileProductFlow() {
  return Test.createTestingModule({
    providers: [
      LiveMarketDataReadAdapter,
      ResearchOutputReadAdapter,
      MarketQualificationObservationalReadService,
      InMemoryQualificationStore,
      MarketQualificationLifecycleService,
      MarketQualificationQueryService,
      InMemoryMarketProfileStore,
      MarketProfileVersioningService,
      MarketProfileQueryService,
      MarketProfileConsumerReadAdapter,
      QualificationProfilePublisherService,
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
      {
        provide: MARKET_PROFILE_SERVICE_PORT,
        useExisting: MarketProfileVersioningService,
      },
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
}

describe('PC-15 15-b — Qualification → Profile product flow', () => {
  let qualification: MarketQualificationServicePort;
  let publisher: QualificationProfilePublisherService;
  let profileQuery: MarketProfileQueryPort;
  let profileConsumer: MarketProfileConsumerReadPort;
  let qualStore: InMemoryQualificationStore;
  let profileStore: InMemoryMarketProfileStore;

  beforeEach(async () => {
    const app = await compileProductFlow();
    qualification = app.get(MARKET_QUALIFICATION_SERVICE_PORT);
    publisher = app.get(QualificationProfilePublisherService);
    profileQuery = app.get(MARKET_PROFILE_QUERY_PORT);
    profileConsumer = app.get(MARKET_PROFILE_CONSUMER_READ_PORT);
    qualStore = app.get(InMemoryQualificationStore);
    profileStore = app.get(InMemoryMarketProfileStore);
  });

  function requestAndConfirm(qualificationRunId: string, requestedAt: string, confirmedAt: string) {
    const requested = qualification.requestQualificationRun({
      ...TARGET,
      modeContext: 'lab',
      requestedBy: 'op-1',
      requestedAt,
      qualificationRunId,
    });
    expect(requested.outcome).toBe('accepted');
    const confirmed = qualification.confirmQualificationRun({
      workspaceId: TARGET.workspaceId,
      qualificationRunId,
      confirmedBy: 'op-2',
      confirmedAt,
    });
    expect(confirmed.outcome).toBe('running');
  }

  it('publishes a Profile version when Qualification completes', () => {
    requestAndConfirm('run-1', TS, TS2);
    const result = publisher.completeAndPublish({
      ...TARGET,
      qualificationRunId: 'run-1',
      completedAt: TS3,
      publishedBy: 'op-1',
      publishedAt: TS3,
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
      ...dimensionPayloads(),
    });

    expect(result.outcome).toBe('completed');
    expect(result.qualificationState?.state).toBe('qualified');
    expect(result.publishedProfileId).toBeDefined();
    expect(result.profilePublish?.outcome).toBe('published');
    expect(result.profilePublish?.version).toBe(1);

    const latest = profileQuery.getLatestProfile(TARGET);
    expect(latest?.version).toBe(1);
    expect(latest?.qualificationRunId).toBe('run-1');
    expect(latest?.marketProfileId).toBe(result.publishedProfileId);
    expect(Object.isFrozen(latest)).toBe(true);

    const consumer = profileConsumer.getLatestProfileProjection(TARGET);
    expect(consumer?.version).toBe(1);
    expect(consumer?.qualificationRunId).toBe('run-1');
    expect(consumer?.mutable).toBe(false);
    expect(consumer?.forcesTrade).toBe(false);
  });

  it('preserves prior Profile versions and Qualification history on requalify', () => {
    requestAndConfirm('run-1', TS, TS2);
    const first = publisher.completeAndPublish({
      ...TARGET,
      qualificationRunId: 'run-1',
      completedAt: TS3,
      publishedBy: 'op-1',
      publishedAt: TS3,
      confidence: {
        level: 'medium',
        score: 0.5,
        rationaleSummary: 'first complete',
        asOf: TS3,
      },
      ...dimensionPayloads(8),
    });
    expect(first.profilePublish?.version).toBe(1);
    const v1Id = first.publishedProfileId!;
    const v1 = profileQuery.getProfileByVersion({ ...TARGET, version: 1 });

    requestAndConfirm('run-2', TS4, TS4);
    const second = publisher.completeAndPublish({
      ...TARGET,
      qualificationRunId: 'run-2',
      completedAt: TS5,
      publishedBy: 'op-1',
      publishedAt: TS5,
      confidence: {
        level: 'high',
        score: 0.8,
        rationaleSummary: 'requalify',
        asOf: TS5,
      },
      ...dimensionPayloads(12),
    });
    expect(second.profilePublish?.version).toBe(2);

    const history = profileQuery.listProfileVersions(TARGET);
    expect(history.map((row) => row.version)).toEqual([1, 2]);
    expect(history.map((row) => row.qualificationRunId)).toEqual(['run-1', 'run-2']);

    const stillV1 = profileQuery.getProfileByVersion({ ...TARGET, version: 1 });
    expect(stillV1?.marketProfileId).toBe(v1Id);
    expect(stillV1?.qualificationRunId).toBe('run-1');
    expect(stillV1?.confidenceSummary.rationaleSummary).toBe(
      v1?.confidenceSummary.rationaleSummary,
    );
    expect(Object.isFrozen(stillV1)).toBe(true);

    const latest = profileQuery.getLatestProfile(TARGET);
    expect(latest?.version).toBe(2);
    expect(latest?.qualificationRunId).toBe('run-2');
    expect(profileConsumer.getLatestProfileProjection(TARGET)?.version).toBe(2);

    const run1 = qualStore.getRun('run-1');
    expect(run1?.status).toBe('completed');
    expect(run1?.completedAt).toBe(TS3);
    expect(Object.isFrozen(run1)).toBe(true);
    const run2 = qualStore.getRun('run-2');
    expect(run2?.status).toBe('completed');
    expect(Object.isFrozen(run2)).toBe(true);
  });

  it('does not publish when Qualification fails or is cancelled', () => {
    requestAndConfirm('run-fail', TS, TS2);
    const failed = qualification.failQualificationRun({
      workspaceId: TARGET.workspaceId,
      qualificationRunId: 'run-fail',
      failedAt: TS3,
      reasons: ['observational_gap'],
    });
    expect(failed.outcome).toBe('failed');
    const failPublish = publisher.completeAndPublish({
      ...TARGET,
      qualificationRunId: 'run-fail',
      completedAt: TS3,
      publishedBy: 'op-1',
      ...dimensionPayloads(),
    });
    expect(failPublish.outcome).toBe('rejected');
    expect(failPublish.publishedProfileId).toBeUndefined();
    expect(profileQuery.getLatestProfile(TARGET)).toBeNull();
    expect(
      profileStore.getLatest(
        `qual-tgt:${TARGET.workspaceId}:${TARGET.exchangeScopeId}:${TARGET.marketSymbol}`,
      ),
    ).toBeNull();

    const requested = qualification.requestQualificationRun({
      ...TARGET,
      modeContext: 'lab',
      requestedBy: 'op-1',
      requestedAt: TS4,
      qualificationRunId: 'run-cancel',
    });
    expect(requested.outcome).toBe('accepted');
    const cancelled = qualification.cancelQualificationRun({
      workspaceId: TARGET.workspaceId,
      qualificationRunId: 'run-cancel',
      cancelledAt: TS5,
    });
    expect(cancelled.outcome).toBe('cancelled');
    const cancelPublish = publisher.completeAndPublish({
      ...TARGET,
      qualificationRunId: 'run-cancel',
      completedAt: TS5,
      publishedBy: 'op-1',
      ...dimensionPayloads(),
    });
    expect(cancelPublish.outcome).toBe('rejected');
    expect(cancelPublish.publishedProfileId).toBeUndefined();
    expect(profileQuery.listProfileVersions(TARGET)).toEqual([]);
  });

  it('is idempotent: one completed run publishes one Profile version', () => {
    requestAndConfirm('run-1', TS, TS2);
    const first = publisher.completeAndPublish({
      ...TARGET,
      qualificationRunId: 'run-1',
      completedAt: TS3,
      publishedBy: 'op-1',
      publishedAt: TS3,
      ...dimensionPayloads(),
    });
    const second = publisher.completeAndPublish({
      ...TARGET,
      qualificationRunId: 'run-1',
      completedAt: TS4,
      publishedBy: 'op-1',
      publishedAt: TS4,
      ...dimensionPayloads(),
    });

    expect(first.publishedProfileId).toBe(second.publishedProfileId);
    expect(second.profilePublish?.version).toBe(1);
    expect(profileQuery.listProfileVersions(TARGET)).toHaveLength(1);
    expect(qualStore.getRun('run-1')?.completedAt).toBe(TS3);
  });
});
