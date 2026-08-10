/**
 * RC-25 Epic 3 — LiquidityProfile dimension (describes; does not calculate).
 *
 * Domain Model Contract §10.2.
 */

import {
  LIQUIDITY_METRIC_KEYS,
  assertAllowedMetricMap,
  assertNonEmptyString,
  deepFreeze,
  isMarketProfileRegimeLabel,
  type MarketProfileRegimeLabel,
} from './market-profile-domain-shared';

export type LiquidityProfile = Readonly<{
  regimeLabel: MarketProfileRegimeLabel;
  metrics: Readonly<Record<string, number | string>>;
  windowSummary: string;
}>;

export type CreateLiquidityProfileInput = Readonly<{
  regimeLabel: string;
  metrics: Readonly<Record<string, number | string>>;
  windowSummary: string;
}>;

export function createLiquidityProfile(input: CreateLiquidityProfileInput): LiquidityProfile {
  const regimeRaw = assertNonEmptyString(input.regimeLabel, 'regimeLabel');
  if (!isMarketProfileRegimeLabel(regimeRaw)) {
    throw new Error(`regimeLabel must be a known MarketProfileRegimeLabel`);
  }
  const windowSummary = assertNonEmptyString(input.windowSummary, 'windowSummary');
  const metrics = assertAllowedMetricMap(input.metrics, LIQUIDITY_METRIC_KEYS, 'liquidity.metrics');
  return deepFreeze({
    regimeLabel: regimeRaw,
    metrics,
    windowSummary,
  });
}
