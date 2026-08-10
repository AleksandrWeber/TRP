/**
 * RC-25 Epic 3 — TrendProfile dimension (describes; does not calculate).
 *
 * Domain Model Contract §10.3.
 * Not a live Market State classification engine.
 */

import {
  TREND_METRIC_KEYS,
  assertAllowedMetricMap,
  assertNonEmptyString,
  deepFreeze,
  isMarketProfileRegimeLabel,
  type MarketProfileRegimeLabel,
} from './market-profile-domain-shared';

export type TrendProfile = Readonly<{
  regimeLabel: MarketProfileRegimeLabel;
  metrics: Readonly<Record<string, number | string>>;
  windowSummary: string;
}>;

export type CreateTrendProfileInput = Readonly<{
  regimeLabel: string;
  metrics: Readonly<Record<string, number | string>>;
  windowSummary: string;
}>;

export function createTrendProfile(input: CreateTrendProfileInput): TrendProfile {
  const regimeRaw = assertNonEmptyString(input.regimeLabel, 'regimeLabel');
  if (!isMarketProfileRegimeLabel(regimeRaw)) {
    throw new Error(`regimeLabel must be a known MarketProfileRegimeLabel`);
  }
  const windowSummary = assertNonEmptyString(input.windowSummary, 'windowSummary');
  const metrics = assertAllowedMetricMap(input.metrics, TREND_METRIC_KEYS, 'trend.metrics');
  return deepFreeze({
    regimeLabel: regimeRaw,
    metrics,
    windowSummary,
  });
}
