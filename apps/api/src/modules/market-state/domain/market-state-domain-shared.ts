/**
 * RC-26 Epic 3 — Market State domain shared helpers + lifecycle catalog.
 *
 * Domain Model Contract §§4–5 (Epic 3 materialization).
 * Structure + invariant protection only. No classification algorithms.
 */

/** Authority class for all Market State domain artifacts. */
export const MARKET_STATE_DOMAIN_AUTHORITY_CLASS = 'market_state_artifact' as const;

/**
 * Market State lifecycle statuses (immutable records only).
 * Task: Created → Active → Superseded → Archived.
 */
export const MARKET_STATE_LIFECYCLE_STATUSES = Object.freeze([
  'created',
  'active',
  'superseded',
  'archived',
] as const);

export type MarketStateLifecycleStatus = (typeof MARKET_STATE_LIFECYCLE_STATUSES)[number];

/**
 * Allowed lifecycle edges (manual record creation only — no automatic transitions).
 */
export const MARKET_STATE_LIFECYCLE_TRANSITIONS: Readonly<
  Record<MarketStateLifecycleStatus, readonly MarketStateLifecycleStatus[]>
> = Object.freeze({
  created: Object.freeze(['active', 'archived'] as const),
  active: Object.freeze(['superseded', 'archived'] as const),
  superseded: Object.freeze(['archived'] as const),
  archived: Object.freeze([] as const),
});

/** Opaque descriptive regime labels — caller-supplied; never computed here. */
export const MARKET_STATE_REGIME_LABELS = Object.freeze([
  'unknown',
  'insufficient_data',
  'quiet',
  'trending',
  'volatile',
  'illiquid',
  'mixed',
] as const);

export type MarketStateRegimeLabel = (typeof MARKET_STATE_REGIME_LABELS)[number];

export function isMarketStateLifecycleStatus(value: string): value is MarketStateLifecycleStatus {
  return (MARKET_STATE_LIFECYCLE_STATUSES as readonly string[]).includes(value);
}

export function isMarketStateRegimeLabel(value: string): value is MarketStateRegimeLabel {
  return (MARKET_STATE_REGIME_LABELS as readonly string[]).includes(value);
}

export function canTransitionMarketStateLifecycle(
  from: MarketStateLifecycleStatus,
  to: MarketStateLifecycleStatus,
): boolean {
  return MARKET_STATE_LIFECYCLE_TRANSITIONS[from].includes(to);
}

export function assertMarketStateLifecycleTransition(
  from: MarketStateLifecycleStatus,
  to: MarketStateLifecycleStatus,
): void {
  if (!canTransitionMarketStateLifecycle(from, to)) {
    throw new Error(`forbidden MarketState lifecycle transition: ${from} → ${to}`);
  }
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
