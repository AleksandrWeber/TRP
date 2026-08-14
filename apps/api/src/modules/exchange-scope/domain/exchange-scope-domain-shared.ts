/**
 * RC-27 Epic 2 — Exchange Scope domain shared helpers + lifecycle catalog.
 *
 * Domain Model Contract §§4–7 (Epic 2 materialization).
 * Structure + invariant protection only. No trading-path behaviour.
 */

/** Authority class for Exchange Scope isolation artifacts. */
export const EXCHANGE_SCOPE_DOMAIN_AUTHORITY_CLASS = 'exchange_scope_artifact' as const;

/** Authority class for Exchange Risk Policy inputs (never Risk Decision). */
export const EXCHANGE_POLICY_INPUT_AUTHORITY_CLASS = 'exchange_policy_input' as const;

/**
 * Exchange Scope lifecycle statuses (immutable records only).
 * Created → Active ↔ Suspended → Archived.
 */
export const EXCHANGE_SCOPE_LIFECYCLE_STATUSES = Object.freeze([
  'created',
  'active',
  'suspended',
  'archived',
] as const);

export type ExchangeScopeLifecycleStatus = (typeof EXCHANGE_SCOPE_LIFECYCLE_STATUSES)[number];

/**
 * Allowed lifecycle edges (manual record creation only — no automatic transitions).
 */
export const EXCHANGE_SCOPE_LIFECYCLE_TRANSITIONS: Readonly<
  Record<ExchangeScopeLifecycleStatus, readonly ExchangeScopeLifecycleStatus[]>
> = Object.freeze({
  created: Object.freeze(['active', 'archived'] as const),
  active: Object.freeze(['suspended', 'archived'] as const),
  suspended: Object.freeze(['active', 'archived'] as const),
  archived: Object.freeze([] as const),
});

/** Known venue codes (illustrative closed set; extensible via string validation). */
export const EXCHANGE_SCOPE_VENUE_CODES = Object.freeze([
  'binance',
  'bybit',
  'kraken',
  'okx',
] as const);

export type ExchangeScopeVenueCode = (typeof EXCHANGE_SCOPE_VENUE_CODES)[number];

/** Mode context labels — live remains label-only until future ADR. */
export const EXCHANGE_SCOPE_MODE_CONTEXTS = Object.freeze(['lab', 'paper', 'live'] as const);

export type ExchangeScopeModeContext = (typeof EXCHANGE_SCOPE_MODE_CONTEXTS)[number];

export function isExchangeScopeLifecycleStatus(
  value: string,
): value is ExchangeScopeLifecycleStatus {
  return (EXCHANGE_SCOPE_LIFECYCLE_STATUSES as readonly string[]).includes(value);
}

export function isExchangeScopeVenueCode(value: string): value is ExchangeScopeVenueCode {
  return (EXCHANGE_SCOPE_VENUE_CODES as readonly string[]).includes(value);
}

export function isExchangeScopeModeContext(value: string): value is ExchangeScopeModeContext {
  return (EXCHANGE_SCOPE_MODE_CONTEXTS as readonly string[]).includes(value);
}

export function canTransitionExchangeScopeLifecycle(
  from: ExchangeScopeLifecycleStatus,
  to: ExchangeScopeLifecycleStatus,
): boolean {
  return EXCHANGE_SCOPE_LIFECYCLE_TRANSITIONS[from].includes(to);
}

export function assertExchangeScopeLifecycleTransition(
  from: ExchangeScopeLifecycleStatus,
  to: ExchangeScopeLifecycleStatus,
): void {
  if (!canTransitionExchangeScopeLifecycle(from, to)) {
    throw new Error(`forbidden ExchangeScope lifecycle transition: ${from} → ${to}`);
  }
}

/**
 * Suspended / archived scopes must block new Session capacity claims
 * (capacity input semantics — Session remains lifecycle SoT).
 */
export function exchangeScopeBlocksNewSessionCapacity(
  status: ExchangeScopeLifecycleStatus,
): boolean {
  return status === 'suspended' || status === 'archived';
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

export function assertNonNegativeInteger(value: number, field: string): number {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`${field} must be a non-negative integer`);
  }
  return value;
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
