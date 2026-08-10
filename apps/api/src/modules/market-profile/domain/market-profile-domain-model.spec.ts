import { describe, expect, it } from 'vitest';
import { createLiquidityProfile } from './liquidity-profile';
import { createMarketProfile } from './market-profile';
import { MARKET_PROFILE_DOMAIN_AUTHORITY_CLASS } from './market-profile-domain-shared';
import { createStructuralCharacteristics } from './structural-characteristics';
import { createTrendProfile } from './trend-profile';
import { createVolatilityProfile } from './volatility-profile';

const baseDimensions = {
  volatility: {
    regimeLabel: 'moderate',
    metrics: { realized_range: 0.02, observation_count: 10 },
    windowSummary: 'latest_snapshot',
  },
  liquidity: {
    regimeLabel: 'low',
    metrics: { volume_level: 'thin', observation_count: 10 },
    windowSummary: 'latest_snapshot',
  },
  trend: {
    regimeLabel: 'unknown',
    metrics: { directional_bias: 'flat', observation_count: 10 },
    windowSummary: 'latest_snapshot',
  },
  structure: {
    characteristics: [
      { key: 'symbol_status', value: 'active' },
      { key: 'timeframe_coverage', value: '1m' },
    ],
  },
} as const;

describe('RC-25 Epic 3 — Market Profile domain model', () => {
  it('creates immutable profile dimensions without calculating scores', () => {
    const volatility = createVolatilityProfile(baseDimensions.volatility);
    const liquidity = createLiquidityProfile(baseDimensions.liquidity);
    const trend = createTrendProfile(baseDimensions.trend);
    const structure = createStructuralCharacteristics(baseDimensions.structure);

    expect(Object.isFrozen(volatility)).toBe(true);
    expect(Object.isFrozen(liquidity)).toBe(true);
    expect(Object.isFrozen(trend)).toBe(true);
    expect(Object.isFrozen(structure)).toBe(true);
    expect(volatility.regimeLabel).toBe('moderate');
    expect(structure.characteristics[0]?.key).toBe('symbol_status');
  });

  it('rejects forbidden / unknown metric keys (no shadow finance authority)', () => {
    expect(() =>
      createVolatilityProfile({
        regimeLabel: 'low',
        metrics: { recomputed_ledger_balance: 1 },
        windowSummary: 'x',
      }),
    ).toThrow(/forbidden metric key/);
    expect(() =>
      createTrendProfile({
        regimeLabel: 'low',
        metrics: { strategy_selection_score: 1 },
        windowSummary: 'x',
      }),
    ).toThrow(/forbidden metric key/);
  });

  it('creates immutable MarketProfile versions with forcesTrade false', () => {
    const profile = createMarketProfile({
      marketProfileId: 'mp-1',
      workspaceId: 'ws-1',
      targetId: 'tgt-1',
      exchangeScopeId: 'scope-binance',
      marketSymbol: 'BTCUSDT',
      version: 1,
      qualificationRunId: 'run-1',
      ...baseDimensions,
      confidenceSummary: {
        level: 'medium',
        score: 0.5,
        sourceRunId: 'run-1',
        rationaleSummary: 'snapshot',
      },
      publishedAt: '2026-08-10T12:00:00.000Z',
      publishedBy: 'pipeline',
    });

    expect(Object.isFrozen(profile)).toBe(true);
    expect(profile.authorityClass).toBe(MARKET_PROFILE_DOMAIN_AUTHORITY_CLASS);
    expect(profile.forcesTrade).toBe(false);
    expect(profile.version).toBe(1);
    expect(profile.volatility.regimeLabel).toBe('moderate');
    expect(() => {
      (profile as { version: number }).version = 2;
    }).toThrow();
  });

  it('requires positive version and venue/market keying; corrections are new versions', () => {
    expect(() =>
      createMarketProfile({
        marketProfileId: 'mp-1',
        workspaceId: 'ws-1',
        targetId: 'tgt-1',
        exchangeScopeId: 'scope-binance',
        marketSymbol: 'BTCUSDT',
        version: 0,
        qualificationRunId: 'run-1',
        ...baseDimensions,
        confidenceSummary: {
          level: 'low',
          sourceRunId: 'run-1',
          rationaleSummary: 'x',
        },
        publishedAt: '2026-08-10T12:00:00.000Z',
        publishedBy: 'pipeline',
      }),
    ).toThrow(/positive integer/);

    const v1 = createMarketProfile({
      marketProfileId: 'mp-1',
      workspaceId: 'ws-1',
      targetId: 'tgt-1',
      exchangeScopeId: 'scope-binance',
      marketSymbol: 'BTCUSDT',
      version: 1,
      qualificationRunId: 'run-1',
      ...baseDimensions,
      confidenceSummary: {
        level: 'low',
        sourceRunId: 'run-1',
        rationaleSummary: 'v1',
      },
      publishedAt: '2026-08-10T12:00:00.000Z',
      publishedBy: 'pipeline',
    });
    const v2 = createMarketProfile({
      marketProfileId: 'mp-2',
      workspaceId: 'ws-1',
      targetId: 'tgt-1',
      exchangeScopeId: 'scope-binance',
      marketSymbol: 'BTCUSDT',
      version: 2,
      qualificationRunId: 'run-2',
      ...baseDimensions,
      confidenceSummary: {
        level: 'high',
        sourceRunId: 'run-2',
        rationaleSummary: 'v2',
      },
      publishedAt: '2026-08-10T13:00:00.000Z',
      publishedBy: 'pipeline',
    });
    expect(v1.version).toBe(1);
    expect(v2.version).toBe(2);
    expect(v1.marketProfileId).not.toBe(v2.marketProfileId);
  });

  it('does not expose calculation / selection helpers on domain modules', async () => {
    const profile = await import('./market-profile');
    const shared = await import('./market-profile-domain-shared');
    expect(profile).not.toHaveProperty('computeVolatility');
    expect(profile).not.toHaveProperty('generateProfile');
    expect(profile).not.toHaveProperty('selectStrategy');
    expect(profile).not.toHaveProperty('expandEnvelope');
    expect(shared).not.toHaveProperty('classifyMarketState');
  });
});
