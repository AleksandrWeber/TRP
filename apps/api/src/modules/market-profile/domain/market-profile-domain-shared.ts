/**
 * RC-25 Epic 3 — Market Profile domain shared helpers + catalogs.
 *
 * Domain Model Contract §§9–10, §13.
 * Structure + invariant protection only. No profile calculation / scoring.
 */

/** Authority class for all Market Profile research artifacts. */
export const MARKET_PROFILE_DOMAIN_AUTHORITY_CLASS = 'research_artifact' as const;

/**
 * Closed regime labels for dimension profiles (not Market State engine labels).
 */
export const MARKET_PROFILE_REGIME_LABELS = Object.freeze([
  'low',
  'moderate',
  'elevated',
  'extreme',
  'unknown',
  'insufficient_data',
] as const);

export type MarketProfileRegimeLabel = (typeof MARKET_PROFILE_REGIME_LABELS)[number];

export const VOLATILITY_METRIC_KEYS = Object.freeze([
  'realized_range',
  'close_dispersion',
  'observation_count',
] as const);

export type VolatilityMetricKey = (typeof VOLATILITY_METRIC_KEYS)[number];

export const LIQUIDITY_METRIC_KEYS = Object.freeze([
  'volume_level',
  'trade_activity',
  'observation_count',
] as const);

export type LiquidityMetricKey = (typeof LIQUIDITY_METRIC_KEYS)[number];

export const TREND_METRIC_KEYS = Object.freeze([
  'directional_bias',
  'persistence',
  'observation_count',
] as const);

export type TrendMetricKey = (typeof TREND_METRIC_KEYS)[number];

export const STRUCTURAL_CHARACTERISTIC_KEYS = Object.freeze([
  'symbol_status',
  'timeframe_coverage',
  'venue_metadata',
  'data_quality_flag',
] as const);

export type StructuralCharacteristicKey = (typeof STRUCTURAL_CHARACTERISTIC_KEYS)[number];

/** Forbidden metric keys that would invent finance/execution authority. */
export const MARKET_PROFILE_FORBIDDEN_METRIC_KEYS = Object.freeze([
  'recomputed_ledger_balance',
  'shadow_cash',
  'force_trade_signal',
  'strategy_selection_score',
  'risk_decision',
] as const);

export function isMarketProfileRegimeLabel(value: string): value is MarketProfileRegimeLabel {
  return (MARKET_PROFILE_REGIME_LABELS as readonly string[]).includes(value);
}

export function isVolatilityMetricKey(value: string): value is VolatilityMetricKey {
  return (VOLATILITY_METRIC_KEYS as readonly string[]).includes(value);
}

export function isLiquidityMetricKey(value: string): value is LiquidityMetricKey {
  return (LIQUIDITY_METRIC_KEYS as readonly string[]).includes(value);
}

export function isTrendMetricKey(value: string): value is TrendMetricKey {
  return (TREND_METRIC_KEYS as readonly string[]).includes(value);
}

export function isStructuralCharacteristicKey(value: string): value is StructuralCharacteristicKey {
  return (STRUCTURAL_CHARACTERISTIC_KEYS as readonly string[]).includes(value);
}

export function isMarketProfileForbiddenMetricKey(value: string): boolean {
  return (MARKET_PROFILE_FORBIDDEN_METRIC_KEYS as readonly string[]).includes(value);
}

export function assertNonEmptyString(value: string, field: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    throw new Error(`${field} must be a non-empty string`);
  }
  return trimmed;
}

export function assertIsoTimestamp(value: string, field: string): string {
  const trimmed = assertNonEmptyString(value, field);
  if (Number.isNaN(Date.parse(trimmed))) {
    throw new Error(`${field} must be an ISO-8601 timestamp`);
  }
  return trimmed;
}

export function assertPositiveVersion(version: number, field = 'version'): number {
  if (!Number.isInteger(version) || version < 1) {
    throw new Error(`${field} must be a positive integer`);
  }
  return version;
}

export function deepFreeze<T>(value: T): T {
  if (value === null || typeof value !== 'object') {
    return value;
  }
  if (Object.isFrozen(value)) {
    return value;
  }
  for (const key of Object.keys(value as object)) {
    deepFreeze((value as Record<string, unknown>)[key]);
  }
  return Object.freeze(value);
}

export function assertAllowedMetricMap(
  metrics: Readonly<Record<string, number | string>>,
  allowed: readonly string[],
  field: string,
): Readonly<Record<string, number | string>> {
  const keys = Object.keys(metrics);
  if (keys.length === 0) {
    throw new Error(`${field} must be a non-empty metrics map`);
  }
  const out: Record<string, number | string> = {};
  for (const key of keys) {
    if (isMarketProfileForbiddenMetricKey(key)) {
      throw new Error(`forbidden metric key in ${field}: ${key}`);
    }
    if (!allowed.includes(key)) {
      throw new Error(`unknown metric key in ${field}: ${key}`);
    }
    out[key] = metrics[key]!;
  }
  return Object.freeze(out);
}
