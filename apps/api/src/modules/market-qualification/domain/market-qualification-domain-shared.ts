/**
 * RC-25 Epic 3 — Market Qualification domain shared helpers + catalogs.
 *
 * Domain Model Contract §§4–8, §13.
 * Structure + invariant protection only. No evaluation / scoring behaviour.
 */

/** Authority class for all Qualification research artifacts. */
export const MARKET_QUALIFICATION_DOMAIN_AUTHORITY_CLASS = 'research_artifact' as const;

export const QUALIFICATION_MODE_CONTEXTS = Object.freeze(['lab', 'paper', 'live'] as const);

export type QualificationModeContext = (typeof QUALIFICATION_MODE_CONTEXTS)[number];

export const QUALIFICATION_RUN_STATUSES = Object.freeze([
  'requested',
  'confirmed',
  'running',
  'completed',
  'failed',
  'cancelled',
  'rejected',
] as const);

export type QualificationRunStatus = (typeof QUALIFICATION_RUN_STATUSES)[number];

export const QUALIFICATION_RUN_TERMINAL_STATUSES = Object.freeze([
  'completed',
  'failed',
  'cancelled',
  'rejected',
] as const);

export type QualificationRunTerminalStatus = (typeof QUALIFICATION_RUN_TERMINAL_STATUSES)[number];

export const QUALIFICATION_LIFECYCLE_STATES = Object.freeze([
  'not_qualified',
  'pending_confirm',
  'qualifying',
  'qualified',
  'degraded',
  'expired',
  'failed',
] as const);

export type QualificationLifecycleState = (typeof QUALIFICATION_LIFECYCLE_STATES)[number];

export const MARKET_CONFIDENCE_LEVELS = Object.freeze([
  'low',
  'medium',
  'high',
  'unknown',
] as const);

export type MarketConfidenceLevel = (typeof MARKET_CONFIDENCE_LEVELS)[number];

export const MARKET_HEALTH_STATUSES = Object.freeze([
  'healthy',
  'watch',
  'unhealthy',
  'unknown',
] as const);

export type MarketHealthStatus = (typeof MARKET_HEALTH_STATUSES)[number];

/**
 * Closed Epic 3 health indicator keys (additive later via plan amendment).
 * Describe data quality / venue behaviour — never Kill Switch / ledger.
 */
export const MARKET_HEALTH_INDICATOR_KEYS = Object.freeze([
  'data_freshness',
  'stream_continuity',
  'symbol_availability',
  'exchange_connectivity',
  'observation_coverage',
] as const);

export type MarketHealthIndicatorKey = (typeof MARKET_HEALTH_INDICATOR_KEYS)[number];

export function isQualificationModeContext(value: string): value is QualificationModeContext {
  return (QUALIFICATION_MODE_CONTEXTS as readonly string[]).includes(value);
}

export function isQualificationRunStatus(value: string): value is QualificationRunStatus {
  return (QUALIFICATION_RUN_STATUSES as readonly string[]).includes(value);
}

export function isQualificationRunTerminalStatus(
  value: string,
): value is QualificationRunTerminalStatus {
  return (QUALIFICATION_RUN_TERMINAL_STATUSES as readonly string[]).includes(value);
}

export function isQualificationLifecycleState(value: string): value is QualificationLifecycleState {
  return (QUALIFICATION_LIFECYCLE_STATES as readonly string[]).includes(value);
}

export function isMarketConfidenceLevel(value: string): value is MarketConfidenceLevel {
  return (MARKET_CONFIDENCE_LEVELS as readonly string[]).includes(value);
}

export function isMarketHealthStatus(value: string): value is MarketHealthStatus {
  return (MARKET_HEALTH_STATUSES as readonly string[]).includes(value);
}

export function isMarketHealthIndicatorKey(value: string): value is MarketHealthIndicatorKey {
  return (MARKET_HEALTH_INDICATOR_KEYS as readonly string[]).includes(value);
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

/**
 * Allowed QualificationState transitions (Domain Model Contract §6.1).
 * Pure invariant check — does not mutate state or run evaluation.
 */
export const QUALIFICATION_STATE_TRANSITIONS: Readonly<
  Record<QualificationLifecycleState, readonly QualificationLifecycleState[]>
> = Object.freeze({
  not_qualified: Object.freeze(['pending_confirm'] as const),
  pending_confirm: Object.freeze(['qualifying', 'failed'] as const),
  qualifying: Object.freeze(['qualified', 'failed'] as const),
  qualified: Object.freeze(['degraded', 'expired', 'qualifying'] as const),
  degraded: Object.freeze(['pending_confirm'] as const),
  expired: Object.freeze(['pending_confirm'] as const),
  failed: Object.freeze(['pending_confirm'] as const),
});

export function canTransitionQualificationState(
  from: QualificationLifecycleState,
  to: QualificationLifecycleState,
): boolean {
  return QUALIFICATION_STATE_TRANSITIONS[from].includes(to);
}

export function assertQualificationStateTransition(
  from: QualificationLifecycleState,
  to: QualificationLifecycleState,
): void {
  if (!canTransitionQualificationState(from, to)) {
    throw new Error(`forbidden QualificationState transition: ${from} → ${to}`);
  }
}
