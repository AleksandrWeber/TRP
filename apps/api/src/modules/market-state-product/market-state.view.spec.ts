import { describe, expect, it } from 'vitest';
import { createMarketState } from '../market-state/domain/market-state';
import {
  MARKET_STATE_PRODUCT_FLAGS,
  deriveMarketStateTargetId,
  toLifecycleView,
  toMetadataView,
  toQualificationReferenceView,
} from './market-state.view';

const TS = '2026-08-15T20:00:00.000Z';

describe('PC-10 market state product views', () => {
  it('keeps product authority flags honest', () => {
    expect(MARKET_STATE_PRODUCT_FLAGS).toMatchObject({
      authorityClass: 'market_state_artifact',
      forcesTrade: false,
      isQualification: false,
      isProfile: false,
      authorizesRuntime: false,
      classifiesMarket: false,
      selectsStrategy: false,
      orchestrates: false,
    });
  });

  it('maps lifecycle and metadata without classifying', () => {
    const state = createMarketState({
      marketStateId: 'mkt-state:ws-1:scope-binance:BTCUSDT:v1',
      workspaceId: 'ws-1',
      exchangeScopeId: 'scope-binance',
      marketSymbol: 'BTCUSDT',
      version: {
        marketStateId: 'mkt-state:ws-1:scope-binance:BTCUSDT:v1',
        version: 1,
        publishedAt: TS,
        publishedBy: 'pipeline-1',
      },
      lifecycle: {
        status: 'active',
        updatedAt: TS,
        updatedBy: 'pipeline-1',
        reason: 'activated',
      },
      snapshot: {
        regime: 'quiet',
        narrativeSummary: 'caller-supplied snapshot',
      },
      metadata: {
        observationAsOf: TS,
        confidenceRef: 'run-1',
        profileRef: 'mp-1',
        inputSummary: 'qualification observed; profile v1',
      },
    });
    const targetId = deriveMarketStateTargetId('ws-1', 'scope-binance', 'BTCUSDT');
    const lifecycle = toLifecycleView(state);
    expect(lifecycle.status).toBe('active');
    expect(lifecycle.isStale).toBe(false);
    expect(lifecycle.classifiesMarket).toBe(false);
    expect(lifecycle.targetId).toBe(targetId);

    const metadata = toMetadataView(state);
    expect(metadata.confidenceRef).toBe('run-1');
    expect(metadata.profileRef).toBe('mp-1');
    expect(metadata.classifiesMarket).toBe(false);

    const absent = toQualificationReferenceView(null);
    expect(absent.present).toBe(false);
    expect(absent.isQualification).toBe(false);
  });
});
