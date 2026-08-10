/**
 * RC-24 — Reporting boundary + ownership invariants.
 *
 * Reporting is the human-facing analytical projection owner
 * (Architecture Spec v2.0 §5.14). It aggregates and explains projections.
 * It is NEVER Source of Truth for money, lifecycle, certification, or enforcement.
 *
 * Knowledge Lake remains the analytical data source (consume later).
 * Lake never depends on Reporting.
 *
 * Epic 1: boundary + ownership invariants + inactive ports (no behaviour).
 * Epic 2: Knowledge Lake Query Port consumption (read-only; no report generation).
 * Epic 3: Reporting Domain Model entities (immutable; no generation behaviour).
 * Epic 4: deterministic report generation + query ports.
 * Epic 5: AI Analytics narrative layer (sibling module).
 * Epic 6: Historical reporting + authority conformance + close readiness.
 */

/** Authority Matrix class for Reporting & AI Analytics (Reporting side). */
export const REPORTING_AUTHORITY_CLASS = 'projection' as const;

/** Canonical module identity (code / docs). Product UI may say “Reporting”. */
export const REPORTING_MODULE_ID = 'reporting' as const;

/**
 * Fact families Reporting owns (declared in Epic 1;
 * generation / aggregation behaviour activates in later Epics).
 */
export const REPORTING_OWNED_CONCERNS = Object.freeze([
  'report-generation-boundary',
  'analytical-projection-boundary',
  'report-definition',
  'report-run',
  'aggregation-slice',
  'historical-window',
] as const);

export type ReportingOwnedConcern = (typeof REPORTING_OWNED_CONCERNS)[number];

/**
 * Modules / surfaces that own other SoT or warehouse facts.
 * Reporting must not absorb these.
 */
export const REPORTING_NON_OWNED = Object.freeze([
  'trading-decisions',
  'strategy-validation',
  'strategy-certification',
  'strategy-eligibility',
  'strategy-library',
  'runtime-enforcement',
  'trading-session',
  'strategy-deployment',
  'orders',
  'risk-engine',
  'execution-engine',
  'ledger',
  'position',
  'fill',
  'knowledge-lake',
  'accounting',
  'ai-analytics',
  'trading-orchestrator',
  'market-state-engine',
  'strategy-selection',
  'paper-trading',
] as const);

export type ReportingNonOwned = (typeof REPORTING_NON_OWNED)[number];

/**
 * Surfaces that remain distinct bounded contexts / aliases.
 * Do not rebrand these as Reporting.
 */
export const REPORTING_DISTINCT_FROM = Object.freeze([
  'knowledge-lake',
  'strategy-library',
  'runtime-enforcement',
  'trading-session',
  'ai-analytics',
  'ai',
  'bot-facade',
  'research-report',
  'trading-orchestrator',
  'strategy-selection',
] as const);

/**
 * Forbidden Reporting capabilities (Epic 1 declares; later Epics must not add these).
 */
export const REPORTING_FORBIDDEN_CAPABILITIES = Object.freeze([
  'authorize-deployment',
  'authorize-session-start',
  'submit-order',
  'approve-risk',
  'submit-execution',
  'validate-strategies',
  'certify-strategy',
  'mutate-eligibility',
  'mutate-session-lifecycle',
  'mutate-ledger',
  'shadow-accounting',
  'recompute-authoritative-balances',
  'replace-runtime-enforcement',
  'replace-strategy-library',
  'become-source-of-truth',
  'command-sot-feedback',
  'trade',
] as const);

export type ReportingForbiddenCapability = (typeof REPORTING_FORBIDDEN_CAPABILITIES)[number];

/**
 * Immutable boundary descriptor for the Reporting projection owner.
 */
export type ReportingBoundary = Readonly<{
  moduleId: typeof REPORTING_MODULE_ID;
  authorityClass: typeof REPORTING_AUTHORITY_CLASS;
  ownedConcerns: typeof REPORTING_OWNED_CONCERNS;
  nonOwned: typeof REPORTING_NON_OWNED;
  distinctFrom: typeof REPORTING_DISTINCT_FROM;
  forbiddenCapabilities: typeof REPORTING_FORBIDDEN_CAPABILITIES;
  /**
   * Port posture by Epic.
   * Epic 4: Lake consumer + report generation service/query active.
   */
  activePorts: Readonly<{
    reportingService: true;
    reportingQuery: true;
    knowledgeLakeConsumer: true;
    historyReads: false;
    persistence: false;
    rest: false;
  }>;
  /** Knowledge Lake relationship: read-only consumer (active Epic 2+). */
  knowledgeLakeRole: 'read-only-consumer';
  /** Reporting never becomes SoT. */
  sourceOfTruth: false;
}>;

/** Sole RC-24 Reporting boundary constant. */
export const REPORTING_BOUNDARY: ReportingBoundary = Object.freeze({
  moduleId: REPORTING_MODULE_ID,
  authorityClass: REPORTING_AUTHORITY_CLASS,
  ownedConcerns: REPORTING_OWNED_CONCERNS,
  nonOwned: REPORTING_NON_OWNED,
  distinctFrom: REPORTING_DISTINCT_FROM,
  forbiddenCapabilities: REPORTING_FORBIDDEN_CAPABILITIES,
  activePorts: Object.freeze({
    reportingService: true,
    reportingQuery: true,
    knowledgeLakeConsumer: true,
    historyReads: false,
    persistence: false,
    rest: false,
  }),
  knowledgeLakeRole: 'read-only-consumer',
  sourceOfTruth: false,
});

/** True when a capability is forbidden for Reporting. */
export function isReportingForbiddenCapability(
  value: string,
): value is ReportingForbiddenCapability {
  return (REPORTING_FORBIDDEN_CAPABILITIES as readonly string[]).includes(value);
}

/** True when a concern is Reporting-owned (declared). */
export function isReportingOwnedConcern(value: string): value is ReportingOwnedConcern {
  return (REPORTING_OWNED_CONCERNS as readonly string[]).includes(value);
}

/** Reporting never owns business / finance / lifecycle SoT. */
export function reportingOwnsBusinessState(): false {
  return false;
}

/** Reporting never becomes Source of Truth. */
export function reportingIsSourceOfTruth(): false {
  return false;
}

/** Reporting never authorizes deployment or capital. */
export function reportingAuthorizes(): false {
  return false;
}

/** Reporting never trades. */
export function reportingTrades(): false {
  return false;
}

/** Reporting never validates / certifies strategies. */
export function reportingValidatesStrategies(): false {
  return false;
}

/**
 * Conflict rule: on cash / fills / orders / lifecycle disputes, SoT wins.
 * Reporting projections lose by design.
 */
export function resolveReportingAuthorityConflict(
  concern: 'cash' | 'fills' | 'orders' | 'session-lifecycle' | 'certification',
): 'source-of-truth' {
  void concern;
  return 'source-of-truth';
}

/**
 * Conflict rule: Knowledge Lake remains analytical warehouse;
 * Reporting never owns Lake storage.
 */
export function resolveLakeStorageConflict(): 'knowledge-lake' {
  return 'knowledge-lake';
}

/**
 * Conflict rule: Runtime Enforcement remains the Gate;
 * Reporting never substitutes enforcement.
 */
export function resolveEnforcementConflict(): 'runtime-enforcement' {
  return 'runtime-enforcement';
}

/**
 * Conflict rule: Strategy Library remains certification SoT;
 * Reporting may cite later, never certify.
 */
export function resolveLibraryConflict(): 'strategy-library' {
  return 'strategy-library';
}
