/**
 * RC-24 Epic 3 — Reporting domain shared helpers + mode / metric catalogs.
 *
 * Domain Model Contract §§9–11.
 * No report generation. No aggregation behaviour. Structure only.
 */

/** Authority class for all Reporting domain projections. */
export const REPORTING_DOMAIN_AUTHORITY_CLASS = 'projection' as const;

export const REPORTING_FACT_MODES = Object.freeze(['paper', 'live', 'research', 'system'] as const);

export type ReportingFactMode = (typeof REPORTING_FACT_MODES)[number];

export const REPORT_DEFINITION_KINDS = Object.freeze([
  'ops_daily',
  'ops_weekly',
  'research_summary',
  'custom',
] as const);

export type ReportDefinitionKind = (typeof REPORT_DEFINITION_KINDS)[number];

export const REPORT_RUN_STATUSES = Object.freeze(['completed', 'empty', 'rejected'] as const);

export type ReportRunStatus = (typeof REPORT_RUN_STATUSES)[number];

export const HISTORICAL_WINDOW_PRESETS = Object.freeze(['daily', 'weekly', 'custom'] as const);

export type HistoricalWindowPreset = (typeof HISTORICAL_WINDOW_PRESETS)[number];

export const AGGREGATION_VISUALIZATION_HINTS = Object.freeze([
  'timeseries',
  'table',
  'kpi',
  'comparison',
] as const);

export type AggregationVisualizationHint = (typeof AGGREGATION_VISUALIZATION_HINTS)[number];

/**
 * Closed Epic 3 metric-key allowlist (additive later via plan amendment).
 * Must not include ad-hoc recomputed ledger balance keys.
 */
export const REPORTING_ALLOWED_METRIC_KEYS = Object.freeze([
  'fact_count',
  'facts_by_category',
  'facts_by_producer',
  'facts_by_mode',
  'session_activity',
  'scope_activity',
  'correlation_coverage',
  'paper_vs_live_count',
  'display_pnl_projection',
  'display_fees_projection',
  'display_exposure_projection',
] as const);

export type ReportingMetricKey = (typeof REPORTING_ALLOWED_METRIC_KEYS)[number];

/** Metrics that display money-adjacent projections — mode labeling mandatory. */
export const REPORTING_MONEY_ADJACENT_METRIC_KEYS = Object.freeze([
  'display_pnl_projection',
  'display_fees_projection',
  'display_exposure_projection',
  'paper_vs_live_count',
] as const);

/**
 * Explicitly forbidden metric keys (shadow accounting / dual finance authority).
 * Domain factories must reject these.
 */
export const REPORTING_FORBIDDEN_METRIC_KEYS = Object.freeze([
  'recomputed_ledger_balance',
  'shadow_cash',
  'shadow_position_qty',
  'authoritative_pnl',
  'force_fill_recalc',
] as const);

export function isReportingFactMode(value: string): value is ReportingFactMode {
  return (REPORTING_FACT_MODES as readonly string[]).includes(value);
}

export function isReportDefinitionKind(value: string): value is ReportDefinitionKind {
  return (REPORT_DEFINITION_KINDS as readonly string[]).includes(value);
}

export function isReportingAllowedMetricKey(value: string): value is ReportingMetricKey {
  return (REPORTING_ALLOWED_METRIC_KEYS as readonly string[]).includes(value);
}

export function isReportingForbiddenMetricKey(value: string): boolean {
  return (REPORTING_FORBIDDEN_METRIC_KEYS as readonly string[]).includes(value);
}

export function isMoneyAdjacentMetricKey(value: string): boolean {
  return (REPORTING_MONEY_ADJACENT_METRIC_KEYS as readonly string[]).includes(value);
}

export function assertNonEmptyString(value: string, field: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    throw new Error(`${field} is required`);
  }
  return trimmed;
}

export function assertIsoTimestamp(value: string, field: string): string {
  const trimmed = assertNonEmptyString(value, field);
  if (Number.isNaN(Date.parse(trimmed))) {
    throw new Error(`${field} must be an ISO timestamp`);
  }
  return trimmed;
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
