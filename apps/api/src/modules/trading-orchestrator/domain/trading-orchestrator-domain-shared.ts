/**
 * RC-26 Epic 4 — Trading Orchestrator domain shared helpers + lifecycle catalog.
 *
 * Domain Model Contract (Epic 4 materialization: plans / intent / lifecycle).
 * Structure + invariant protection only. No workflow / selection / Session handoff.
 */

/** Authority class for all Trading Orchestrator domain artifacts. */
export const TRADING_ORCHESTRATOR_DOMAIN_AUTHORITY_CLASS = 'orchestration_artifact' as const;

/**
 * Orchestration lifecycle statuses (immutable records only).
 * Task: Created → Planned → Ready → Cancelled | Archived.
 */
export const ORCHESTRATION_LIFECYCLE_STATUSES = Object.freeze([
  'created',
  'planned',
  'ready',
  'cancelled',
  'archived',
] as const);

export type OrchestrationLifecycleStatus = (typeof ORCHESTRATION_LIFECYCLE_STATUSES)[number];

/**
 * Allowed lifecycle edges (manual record creation only — no automatic orchestration).
 */
export const ORCHESTRATION_LIFECYCLE_TRANSITIONS: Readonly<
  Record<OrchestrationLifecycleStatus, readonly OrchestrationLifecycleStatus[]>
> = Object.freeze({
  created: Object.freeze(['planned', 'cancelled', 'archived'] as const),
  planned: Object.freeze(['ready', 'cancelled', 'archived'] as const),
  ready: Object.freeze(['cancelled', 'archived'] as const),
  cancelled: Object.freeze(['archived'] as const),
  archived: Object.freeze([] as const),
});

export const ORCHESTRATION_MODE_CONTEXTS = Object.freeze(['lab', 'paper', 'live'] as const);

export type OrchestrationModeContext = (typeof ORCHESTRATION_MODE_CONTEXTS)[number];

export function isOrchestrationLifecycleStatus(
  value: string,
): value is OrchestrationLifecycleStatus {
  return (ORCHESTRATION_LIFECYCLE_STATUSES as readonly string[]).includes(value);
}

export function isOrchestrationModeContext(value: string): value is OrchestrationModeContext {
  return (ORCHESTRATION_MODE_CONTEXTS as readonly string[]).includes(value);
}

export function canTransitionOrchestrationLifecycle(
  from: OrchestrationLifecycleStatus,
  to: OrchestrationLifecycleStatus,
): boolean {
  return ORCHESTRATION_LIFECYCLE_TRANSITIONS[from].includes(to);
}

export function assertOrchestrationLifecycleTransition(
  from: OrchestrationLifecycleStatus,
  to: OrchestrationLifecycleStatus,
): void {
  if (!canTransitionOrchestrationLifecycle(from, to)) {
    throw new Error(`forbidden Orchestration lifecycle transition: ${from} → ${to}`);
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
