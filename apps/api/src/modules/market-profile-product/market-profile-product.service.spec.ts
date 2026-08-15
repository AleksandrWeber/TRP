import { Test } from '@nestjs/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { deriveQualificationTargetId } from '../market-qualification';
import type { QualificationRun } from '../market-qualification/domain/qualification-run';
import {
  MARKET_QUALIFICATION_QUERY_PORT,
  type MarketQualificationQueryPort,
} from '../market-qualification/ports/market-qualification.port';
import { InMemoryMarketProfileStore } from '../market-profile/adapters/in-memory-market-profile-store';
import { MarketProfileQueryService } from '../market-profile/market-profile-query.service';
import { MarketProfileVersioningService } from '../market-profile/market-profile-versioning.service';
import {
  MARKET_PROFILE_QUERY_PORT,
  MARKET_PROFILE_SERVICE_PORT,
  type PublishMarketProfile,
} from '../market-profile/ports/market-profile.port';
import { MarketProfileProductService } from './market-profile-product.service';

const TS = '2026-08-15T20:00:00.000Z';
const TS2 = '2026-08-15T21:00:00.000Z';

const TARGET = {
  workspaceId: 'ws-1',
  exchangeScopeId: 'scope-binance',
  marketSymbol: 'BTCUSDT',
} as const;

const TARGET_ID = deriveQualificationTargetId(
  TARGET.workspaceId,
  TARGET.exchangeScopeId,
  TARGET.marketSymbol,
);

function dimensionPayloads() {
  return {
    volatility: {
      regimeLabel: 'moderate',
      metrics: { realized_range: 0.02, observation_count: 10 },
      windowSummary: 'caller-supplied window',
    },
    liquidity: {
      regimeLabel: 'moderate',
      metrics: { volume_level: 1, observation_count: 10 },
      windowSummary: 'caller-supplied window',
    },
    trend: {
      regimeLabel: 'low',
      metrics: { directional_bias: 0, observation_count: 10 },
      windowSummary: 'caller-supplied window',
    },
    structure: {
      characteristics: [
        { key: 'symbol_status', value: 'active' },
        { key: 'data_quality_flag', value: 'ok' },
      ],
    },
    confidenceSummary: {
      level: 'medium',
      score: 0.5,
      sourceRunId: 'run-1',
      rationaleSummary: 'caller-supplied only',
    },
  };
}

function completedRun(id: string): QualificationRun {
  return Object.freeze({
    qualificationRunId: id,
    workspaceId: TARGET.workspaceId,
    targetId: TARGET_ID,
    modeContext: 'lab',
    status: 'completed',
    requestedBy: 'op',
    confirmedBy: 'op',
    inputSummary: Object.freeze({
      observationCount: 0,
      researchRefCount: 0,
      liveMarketDataRefs: Object.freeze([] as string[]),
      researchOutputRefs: Object.freeze([] as string[]),
    }),
    completedAt: TS,
    createdAt: TS,
    authorityClass: 'research_artifact',
  }) as QualificationRun;
}

function createFakeQualQuery(): MarketQualificationQueryPort {
  const runs: Record<string, QualificationRun> = {
    'run-1': completedRun('run-1'),
    'run-2': completedRun('run-2'),
  };
  return {
    getQualificationTarget: () => null,
    getQualificationState: () => null,
    getMarketConfidence: () => null,
    getMarketHealth: () => null,
    listQualificationTargets: () => Object.freeze([]),
    listQualificationRuns: () => Object.freeze([]),
    getQualificationRun: (query) => {
      if (query.workspaceId !== TARGET.workspaceId) return null;
      const run = runs[query.qualificationRunId];
      if (!run) return null;
      return Object.freeze({
        ...run,
        forcesTrade: false as const,
        authorizesSession: false as const,
      });
    },
  };
}

async function compileProductModule() {
  return Test.createTestingModule({
    providers: [
      InMemoryMarketProfileStore,
      MarketProfileVersioningService,
      MarketProfileQueryService,
      MarketProfileProductService,
      { provide: MARKET_QUALIFICATION_QUERY_PORT, useValue: createFakeQualQuery() },
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

describe('PC-09 MarketProfileProductService', () => {
  let product: MarketProfileProductService;
  let publisher: MarketProfileVersioningService;
  let store: InMemoryMarketProfileStore;

  beforeEach(async () => {
    const moduleRef = await compileProductModule();
    product = moduleRef.get(MarketProfileProductService);
    publisher = moduleRef.get(MarketProfileVersioningService);
    store = moduleRef.get(InMemoryMarketProfileStore);
    store.clear();
  });

  it('exposes latest, versions, metadata, dimensions, published source, and metadata compare', () => {
    const base: PublishMarketProfile = {
      ...TARGET,
      qualificationRunId: 'run-1',
      publishedBy: 'pipeline-1',
      publishedAt: TS,
      ...dimensionPayloads(),
    };
    expect(publisher.publishProfileVersion(base).outcome).toBe('published');
    expect(
      publisher.publishProfileVersion({
        ...base,
        qualificationRunId: 'run-2',
        publishedAt: TS2,
        confidenceSummary: {
          ...base.confidenceSummary,
          level: 'high',
          sourceRunId: 'run-2',
          rationaleSummary: 'requalify snapshot',
        },
      }).outcome,
    ).toBe('published');

    const workspace = product.getWorkspace(TARGET.workspaceId);
    expect(workspace.targetCount).toBe(1);
    expect(workspace.versionCount).toBe(2);
    expect(workspace.latest[0]?.version).toBe(2);
    expect(workspace.calculatesProfile).toBe(false);
    expect(workspace.scoresMarket).toBe(false);

    const latest = product.getLatest(TARGET.workspaceId, TARGET_ID);
    expect(latest?.version).toBe(2);
    expect(latest?.isCurrentPublished).toBe(true);
    expect(latest?.publishedSource.qualificationRunId).toBe('run-2');
    expect(latest?.dimensions.volatility.regimeLabel).toBe('moderate');
    expect(latest?.forcesTrade).toBe(false);

    const v1 = product.getVersion(TARGET.workspaceId, TARGET_ID, 1);
    expect(v1?.version).toBe(1);
    expect(v1?.isLatest).toBe(false);
    expect(v1?.metadata.rationaleSummary).toBe('caller-supplied only');

    const compared = product.compare(TARGET.workspaceId, TARGET_ID, 1, 2);
    expect(compared?.fromVersion).toBe(1);
    expect(compared?.toVersion).toBe(2);
    expect(compared?.differences.find((row) => row.field === 'confidenceLevel')?.changed).toBe(
      true,
    );
    expect(JSON.stringify(compared)).not.toContain('realized_range');

    expect(product.getWorkspace('other-ws').versionCount).toBe(0);
    expect(product.getLatest(TARGET.workspaceId, 'missing')).toBeNull();
  });
});
