import { describe, expect, it } from 'vitest';
import { MARKET_PROFILE_PRODUCT_FLAGS, toCompareView } from './market-profile.view';
import { createMarketProfile } from '../market-profile/domain/market-profile';

const dimensions = {
  volatility: {
    regimeLabel: 'moderate' as const,
    metrics: { realized_range: 0.02, observation_count: 10 },
    windowSummary: 'caller-supplied window',
  },
  liquidity: {
    regimeLabel: 'moderate' as const,
    metrics: { volume_level: 1, observation_count: 10 },
    windowSummary: 'caller-supplied window',
  },
  trend: {
    regimeLabel: 'low' as const,
    metrics: { directional_bias: 0, observation_count: 10 },
    windowSummary: 'caller-supplied window',
  },
  structure: {
    characteristics: [
      { key: 'symbol_status', value: 'active' },
      { key: 'data_quality_flag', value: 'ok' },
    ],
  },
};

describe('PC-09 market profile product views', () => {
  it('keeps product authority flags honest', () => {
    expect(MARKET_PROFILE_PRODUCT_FLAGS).toMatchObject({
      authorityClass: 'research_artifact',
      forcesTrade: false,
      authorizesSession: false,
      isMarketQualification: false,
      isMarketState: false,
      calculatesProfile: false,
      scoresMarket: false,
    });
  });

  it('compares metadata only — not dimension calculations', () => {
    const from = createMarketProfile({
      marketProfileId: 'mkt-profile:a:v1',
      workspaceId: 'ws-1',
      targetId: 'qual-tgt:ws-1:scope-binance:BTCUSDT',
      exchangeScopeId: 'scope-binance',
      marketSymbol: 'BTCUSDT',
      version: 1,
      qualificationRunId: 'run-1',
      publishedAt: '2026-08-15T20:00:00.000Z',
      publishedBy: 'pipeline-1',
      ...dimensions,
      confidenceSummary: {
        level: 'medium',
        score: 0.5,
        sourceRunId: 'run-1',
        rationaleSummary: 'first snapshot',
      },
    });
    const to = createMarketProfile({
      marketProfileId: 'mkt-profile:a:v2',
      workspaceId: 'ws-1',
      targetId: from.targetId,
      exchangeScopeId: 'scope-binance',
      marketSymbol: 'BTCUSDT',
      version: 2,
      qualificationRunId: 'run-2',
      publishedAt: '2026-08-15T21:00:00.000Z',
      publishedBy: 'pipeline-1',
      ...dimensions,
      confidenceSummary: {
        level: 'high',
        score: 0.7,
        sourceRunId: 'run-2',
        rationaleSummary: 'requalify snapshot',
      },
    });
    const compared = toCompareView({ from, to });
    expect(compared.calculatesProfile).toBe(false);
    expect(compared.differences.map((row) => row.field)).toEqual([
      'marketProfileId',
      'version',
      'publishedAt',
      'publishedBy',
      'qualificationRunId',
      'confidenceLevel',
      'confidenceScore',
      'confidenceSourceRunId',
      'rationaleSummary',
    ]);
    expect(compared.differences.find((row) => row.field === 'publishedBy')?.changed).toBe(false);
    expect(compared.differences.find((row) => row.field === 'confidenceLevel')?.changed).toBe(true);
    expect(JSON.stringify(compared)).not.toContain('realized_range');
  });
});
