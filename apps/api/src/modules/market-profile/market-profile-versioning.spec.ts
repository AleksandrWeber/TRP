import { Test } from '@nestjs/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { deriveQualificationTargetId } from '../market-qualification';
import type { QualificationRun } from '../market-qualification/domain/qualification-run';
import {
  MARKET_QUALIFICATION_QUERY_PORT,
  type MarketQualificationQueryPort,
} from '../market-qualification/ports/market-qualification.port';
import { InMemoryMarketProfileStore } from './adapters/in-memory-market-profile-store';
import { MarketProfileQueryService } from './market-profile-query.service';
import { MarketProfileVersioningService } from './market-profile-versioning.service';
import {
  MARKET_PROFILE_QUERY_PORT,
  MARKET_PROFILE_SERVICE_PORT,
  type MarketProfileQueryPort,
  type MarketProfileServicePort,
  type PublishMarketProfile,
} from './ports/market-profile.port';

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

function completedRun(overrides?: Partial<QualificationRun>): QualificationRun {
  const targetId = deriveQualificationTargetId(
    TARGET.workspaceId,
    TARGET.exchangeScopeId,
    TARGET.marketSymbol,
  );
  return Object.freeze({
    qualificationRunId: 'run-1',
    workspaceId: TARGET.workspaceId,
    targetId,
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
    ...overrides,
  }) as QualificationRun;
}

function createFakeQualQuery(
  runs: Record<string, QualificationRun | null> = { 'run-1': completedRun() },
): MarketQualificationQueryPort {
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

async function compileVersioningModule(
  qualQuery: MarketQualificationQueryPort = createFakeQualQuery(),
) {
  return Test.createTestingModule({
    providers: [
      InMemoryMarketProfileStore,
      MarketProfileVersioningService,
      MarketProfileQueryService,
      { provide: MARKET_QUALIFICATION_QUERY_PORT, useValue: qualQuery },
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

describe('RC-25 Epic 5 — Market Profile versioning', () => {
  let service: MarketProfileServicePort;
  let query: MarketProfileQueryPort;
  let store: InMemoryMarketProfileStore;
  let moduleRef: Awaited<ReturnType<typeof compileVersioningModule>>;

  beforeEach(async () => {
    moduleRef = await compileVersioningModule();
    service = moduleRef.get(MARKET_PROFILE_SERVICE_PORT);
    query = moduleRef.get(MARKET_PROFILE_QUERY_PORT);
    store = moduleRef.get(InMemoryMarketProfileStore);
    store.clear();
  });

  it('publishes immutable versions with monotonic history', async () => {
    const base: PublishMarketProfile = {
      ...TARGET,
      qualificationRunId: 'run-1',
      publishedBy: 'pipeline-1',
      publishedAt: TS,
      ...dimensionPayloads(),
    };

    const first = service.publishProfileVersion(base);
    expect(first.outcome).toBe('published');
    expect(first.version).toBe(1);
    expect(first.forcesTrade).toBe(false);
    expect(first.authorizesSession).toBe(false);
    expect(Object.isFrozen(first.marketProfile)).toBe(true);
    expect(Object.isFrozen(first.marketProfile?.volatility)).toBe(true);

    const second = service.publishProfileVersion({
      ...base,
      publishedAt: TS2,
      qualificationRunId: 'run-1',
      confidenceSummary: {
        ...base.confidenceSummary,
        rationaleSummary: 'requalify snapshot',
      },
    });
    expect(second.outcome).toBe('published');
    expect(second.version).toBe(2);
    expect(second.marketProfileId).not.toBe(first.marketProfileId);

    const latest = query.getLatestProfile(TARGET);
    expect(latest?.version).toBe(2);
    expect(latest?.authorizesSession).toBe(false);
    expect(latest?.forcesTrade).toBe(false);

    const v1 = query.getProfileByVersion({ ...TARGET, version: 1 });
    expect(v1?.version).toBe(1);
    expect(v1?.marketProfileId).toBe(first.marketProfileId);
    expect(v1?.confidenceSummary.rationaleSummary).toBe('caller-supplied only');

    const history = query.listProfileVersions(TARGET);
    expect(history).toHaveLength(2);
    expect(history.map((h) => h.version)).toEqual([1, 2]);
    expect(history.every((h) => h.forcesTrade === false)).toBe(true);

    const workspace = query.listWorkspaceProfiles({ workspaceId: TARGET.workspaceId });
    expect(workspace).toHaveLength(2);
    expect(query.listWorkspaceProfiles({ workspaceId: 'other-ws' })).toEqual([]);

    // Prior version remains unchanged after later publish.
    expect(store.getByVersion(v1!.targetId, 1)).toEqual(first.marketProfile);

    await moduleRef.close();
  });

  it('rejects incomplete qualification runs and missing runs', async () => {
    await moduleRef.close();
    moduleRef = await compileVersioningModule(
      createFakeQualQuery({
        'run-running': completedRun({
          qualificationRunId: 'run-running',
          status: 'running',
          completedAt: undefined,
        }),
      }),
    );
    service = moduleRef.get(MARKET_PROFILE_SERVICE_PORT);

    const missing = service.publishProfileVersion({
      ...TARGET,
      qualificationRunId: 'missing',
      publishedBy: 'op',
      publishedAt: TS,
      ...dimensionPayloads(),
    });
    expect(missing.outcome).toBe('rejected');
    expect(missing.rejectionReasons).toContain('qualification_run_not_found');

    const incomplete = service.publishProfileVersion({
      ...TARGET,
      qualificationRunId: 'run-running',
      publishedBy: 'op',
      publishedAt: TS,
      ...dimensionPayloads(),
    });
    expect(incomplete.outcome).toBe('rejected');
    expect(incomplete.rejectionReasons?.[0]).toMatch(/qualification_run_not_completed/);

    await moduleRef.close();
  });

  it('protects against in-place overwrite of id or version', async () => {
    const published = service.publishProfileVersion({
      ...TARGET,
      qualificationRunId: 'run-1',
      publishedBy: 'op',
      publishedAt: TS,
      marketProfileId: 'fixed-id-1',
      ...dimensionPayloads(),
    });
    expect(published.outcome).toBe('published');

    const duplicateId = service.publishProfileVersion({
      ...TARGET,
      qualificationRunId: 'run-1',
      publishedBy: 'op',
      publishedAt: TS2,
      marketProfileId: 'fixed-id-1',
      ...dimensionPayloads(),
    });
    expect(duplicateId.outcome).toBe('rejected');
    expect(duplicateId.rejectionReasons?.[0]).toMatch(/profile_id_exists/);

    // Direct store overwrite protection.
    expect(() => store.putProfile(published.marketProfile!)).toThrow(/profile_id_exists/);

    await moduleRef.close();
  });

  it('never exposes calculation / selection / authorization helpers', async () => {
    expect(service).not.toHaveProperty('computeVolatility');
    expect(service).not.toHaveProperty('detectTrend');
    expect(service).not.toHaveProperty('scoreLiquidity');
    expect(service).not.toHaveProperty('selectStrategy');
    expect(service).not.toHaveProperty('authorizeSession');
    expect(query).not.toHaveProperty('forceTrade');

    await moduleRef.close();
  });
});
