import { beforeEach, describe, expect, it } from 'vitest';
import { createMarketState, withMarketStateLifecycle } from '../market-state/domain/market-state';
import { MarketStateProjectionStore } from '../market-state/domain/market-state-projection.store';
import type { MarketStateObservationalReadService } from '../market-state/market-state-observational-read.service';
import { MarketStateProductService } from './market-state-product.service';
import { deriveMarketStateTargetId } from './market-state.view';

const TS = '2026-08-15T20:00:00.000Z';
const TS2 = '2026-08-15T21:00:00.000Z';

const TARGET = {
  workspaceId: 'ws-1',
  exchangeScopeId: 'scope-binance',
  marketSymbol: 'BTCUSDT',
} as const;

const TARGET_ID = deriveMarketStateTargetId(
  TARGET.workspaceId,
  TARGET.exchangeScopeId,
  TARGET.marketSymbol,
);

function fakeObservational(): MarketStateObservationalReadService {
  return {
    getQualificationSummary: () =>
      Object.freeze({
        authorityClass: 'research_artifact' as const,
        workspaceId: TARGET.workspaceId,
        exchangeScopeId: TARGET.exchangeScopeId,
        marketSymbol: TARGET.marketSymbol,
        targetId: 'qual-tgt:ws-1:scope-binance:BTCUSDT',
        lifecycle: {
          authorityClass: 'research_artifact' as const,
          workspaceId: TARGET.workspaceId,
          exchangeScopeId: TARGET.exchangeScopeId,
          marketSymbol: TARGET.marketSymbol,
          targetId: 'qual-tgt:ws-1:scope-binance:BTCUSDT',
          state: 'qualified',
          updatedAt: TS,
          forcesTrade: false as const,
          authorizesSession: false as const,
          isQualificationOwnership: false as const,
          isMarketStateClassification: false as const,
        },
        confidence: {
          authorityClass: 'research_artifact' as const,
          workspaceId: TARGET.workspaceId,
          exchangeScopeId: TARGET.exchangeScopeId,
          marketSymbol: TARGET.marketSymbol,
          targetId: 'qual-tgt:ws-1:scope-binance:BTCUSDT',
          level: 'high',
          rationaleSummary: 'ok',
          sourceRunId: 'run-1',
          asOf: TS,
          forcesTrade: false as const,
          authorizesSession: false as const,
          isQualificationOwnership: false as const,
          isMarketStateClassification: false as const,
        },
        health: null,
        latestRunStatus: 'completed',
        forcesTrade: false as const,
        authorizesSession: false as const,
        isQualificationOwnership: false as const,
        isMarketStateClassification: false as const,
      }),
    getLatestProfile: () =>
      Object.freeze({
        authorityClass: 'research_artifact' as const,
        marketProfileId: 'mp-1',
        workspaceId: TARGET.workspaceId,
        targetId: 'qual-tgt:ws-1:scope-binance:BTCUSDT',
        exchangeScopeId: TARGET.exchangeScopeId,
        marketSymbol: TARGET.marketSymbol,
        version: 2,
        qualificationRunId: 'run-1',
        dimensions: {
          volatilityRegime: 'moderate',
          liquidityRegime: 'moderate',
          trendRegime: 'low',
          structureCharacteristicCount: 1,
        },
        confidenceLevel: 'high',
        publishedAt: TS,
        forcesTrade: false as const,
        authorizesSession: false as const,
        isProfileOwnership: false as const,
        isMarketStateClassification: false as const,
      }),
  } as unknown as MarketStateObservationalReadService;
}

function seedVersion(store: MarketStateProjectionStore, version: number, publishedAt: string) {
  const marketStateId = `${TARGET_ID}:v${version}`;
  const prior = store.getCurrent(TARGET);
  const state = createMarketState({
    marketStateId,
    ...TARGET,
    version: {
      marketStateId,
      version,
      publishedAt,
      publishedBy: 'pipeline-1',
    },
    lifecycle: {
      status: 'active',
      updatedAt: publishedAt,
      updatedBy: 'pipeline-1',
      reason: 'activated',
    },
    snapshot: {
      regime: 'quiet',
      volatilityClass: 'moderate',
      narrativeSummary: 'caller-supplied snapshot',
    },
    metadata: {
      observationAsOf: publishedAt,
      confidenceRef: 'run-1',
      profileRef: 'mp-1',
      inputSummary: 'qualification observed; profile present',
    },
  });
  if (prior) {
    store.seed(
      state,
      withMarketStateLifecycle(
        prior,
        'superseded',
        publishedAt,
        'pipeline-1',
        'superseded by newer Market State version',
      ),
    );
    return state;
  }
  store.seed(state);
  return state;
}

describe('PC-10 MarketStateProductService', () => {
  let store: MarketStateProjectionStore;
  let product: MarketStateProductService;

  beforeEach(() => {
    store = new MarketStateProjectionStore();
    product = new MarketStateProductService(store, fakeObservational());
  });

  it('exposes current, lifecycle, history, metadata, transitions, and observational refs', () => {
    seedVersion(store, 1, TS);
    seedVersion(store, 2, TS2);

    const workspace = product.getWorkspace(TARGET.workspaceId);
    expect(workspace.targetCount).toBe(1);
    expect(workspace.versionCount).toBe(2);
    expect(workspace.current[0]?.version).toBe(2);
    expect(workspace.classifiesMarket).toBe(false);
    expect(workspace.orchestrates).toBe(false);

    const current = product.getCurrent(TARGET.workspaceId, TARGET_ID);
    expect(current?.version).toBe(2);
    expect(current?.isCurrent).toBe(true);
    expect(current?.lifecycle.status).toBe('active');
    expect(current?.snapshot.regimeLabel).toBe('quiet');
    expect(current?.qualification.present).toBe(true);
    expect(current?.qualification.confidenceLevel).toBe('high');
    expect(current?.profile.present).toBe(true);
    expect(current?.profile.version).toBe(2);
    expect(current?.forcesTrade).toBe(false);
    expect(current?.classifiesMarket).toBe(false);

    const v1 = product.getVersion(TARGET.workspaceId, TARGET_ID, 1);
    expect(v1?.version).toBe(1);
    expect(v1?.isCurrent).toBe(false);
    expect(v1?.lifecycle.status).toBe('superseded');
    expect(v1?.lifecycle.isStale).toBe(true);

    const history = product.listHistory(TARGET.workspaceId, TARGET_ID);
    expect(history.items.map((row) => row.version)).toEqual([2, 1]);

    const transitions = product.listTransitions(TARGET.workspaceId, TARGET_ID);
    expect(transitions?.items.length).toBeGreaterThan(0);

    expect(product.getWorkspace('other-ws').versionCount).toBe(0);
    expect(product.getCurrent(TARGET.workspaceId, 'missing')).toBeNull();
  });

  it('refresh republishes the existing snapshot without classifying', () => {
    seedVersion(store, 1, TS);
    const refreshed = product.refresh(TARGET.workspaceId, TARGET_ID, 'operator-1');
    expect(refreshed?.outcome).toBe('accepted');
    expect(refreshed?.version).toBe(2);
    expect(refreshed?.current.snapshot.regimeLabel).toBe('quiet');
    expect(refreshed?.classifiesMarket).toBe(false);
    expect(refreshed?.current.metadata.notes).toContain('operator refresh');
    expect(product.getCurrent(TARGET.workspaceId, TARGET_ID)?.version).toBe(2);
    expect(product.refresh(TARGET.workspaceId, 'missing', 'operator-1')).toBeNull();
  });
});
