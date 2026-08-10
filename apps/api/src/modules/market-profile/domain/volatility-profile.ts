/**
 * RC-25 Epic 3 — VolatilityProfile dimension (describes; does not calculate).
 *
 * Domain Model Contract §10.1.
 */

import {
  VOLATILITY_METRIC_KEYS,
  assertAllowedMetricMap,
  assertNonEmptyString,
  deepFreeze,
  isMarketProfileRegimeLabel,
  type MarketProfileRegimeLabel,
} from './market-profile-domain-shared';

export type VolatilityProfile = Readonly<{
  regimeLabel: MarketProfileRegimeLabel;
  metrics: Readonly<Record<string, number | string>>;
  windowSummary: string;
}>;

export type CreateVolatilityProfileInput = Readonly<{
  regimeLabel: string;
  metrics: Readonly<Record<string, number | string>>;
  windowSummary: string;
}>;

export function createVolatilityProfile(input: CreateVolatilityProfileInput): VolatilityProfile {
  const regimeRaw = assertNonEmptyString(input.regimeLabel, 'regimeLabel');
  if (!isMarketProfileRegimeLabel(regimeRaw)) {
    throw new Error(`regimeLabel must be a known MarketProfileRegimeLabel`);
  }
  const windowSummary = assertNonEmptyString(input.windowSummary, 'windowSummary');
  const metrics = assertAllowedMetricMap(
    input.metrics,
    VOLATILITY_METRIC_KEYS,
    'volatility.metrics',
  );
  return deepFreeze({
    regimeLabel: regimeRaw,
    metrics,
    windowSummary,
  });
}
