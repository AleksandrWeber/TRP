/**
 * RC-22 — Strategy Library boundary + ownership invariants.
 *
 * Strategy Library is the authoritative store of certified strategy versions
 * (Architecture Spec v2.0 §5.2). It is the sole owner of certified trading
 * strategy lifecycle facts.
 *
 * Authority class: Source of Truth (for certified membership / envelopes /
 * eligibility status) — NOT a projection warehouse.
 *
 * Knowledge Lake remains a consumer of analytical projections only.
 * The experimental Strategy registry (`strategies`) is NOT the Library.
 *
 * Epic 1: boundary + ownership invariants (no model / ports / persistence).
 * Epic 2: Strategy model (Strategy + StrategyVersion; no certification).
 * Epic 3: Certification & Evidence domain (no eligibility / envelope / ports).
 * Epic 4: Tactical Envelope binding (configuration only; no runtime).
 * Epic 5: Eligibility Gate (domain decision; no runtime integration).
 * Epic 6: Lifecycle / Deprecation / Archive (immutable records; no runtime).
 */

/** Authority Matrix class for Strategy Library certified facts. */
export const STRATEGY_LIBRARY_AUTHORITY_CLASS = 'source_of_truth' as const;

/** Canonical module identity (code / docs). Product UI may say “Strategy Library”. */
export const STRATEGY_LIBRARY_MODULE_ID = 'strategy-library' as const;

/**
 * Fact families Strategy Library owns (references declared in Epic 1;
 * entities / ports activate in later Epics).
 */
export const STRATEGY_LIBRARY_OWNED_CONCERNS = Object.freeze([
  'certified-strategy-lifecycle',
  'strategy-versions',
  'certification-references',
  'eligibility-references',
  'tactical-envelope-binding-references',
] as const);

export type StrategyLibraryOwnedConcern = (typeof STRATEGY_LIBRARY_OWNED_CONCERNS)[number];

/**
 * Classification vocabulary (docs + conformance).
 * Registry `active` ≠ certified.
 */
export const STRATEGY_LIBRARY_CLASSIFICATION = Object.freeze([
  'research-artifact',
  'experimental-strategy',
  'certified-strategy',
  'deprecated-strategy',
  'archived-strategy',
] as const);

export type StrategyLibraryClassification = (typeof STRATEGY_LIBRARY_CLASSIFICATION)[number];

/**
 * Modules / surfaces that own other SoT or projection facts.
 * Library must not absorb these.
 */
export const STRATEGY_LIBRARY_NON_OWNED = Object.freeze([
  'research-experiments',
  'strategy-registry',
  'paper-trading',
  'trading-session',
  'knowledge-lake',
  'execution-engine',
  'orders',
  'risk-engine',
  'ledger',
  'trading-orchestrator',
  'market-state-engine',
] as const);

export type StrategyLibraryNonOwned = (typeof STRATEGY_LIBRARY_NON_OWNED)[number];

/**
 * Surfaces that remain distinct bounded contexts / aliases.
 * Do not rebrand these as Strategy Library.
 */
export const STRATEGY_LIBRARY_DISTINCT_FROM = Object.freeze([
  'strategies',
  'knowledge-lake',
  'tactical-envelope',
  'bot-facade',
  'trading-session',
  'strategy-deployment',
] as const);

/**
 * Forbidden Library capabilities (Epic 1 declares; later Epics must not add these).
 */
export const STRATEGY_LIBRARY_FORBIDDEN_CAPABILITIES = Object.freeze([
  'execute-strategy',
  'mutate-session-lifecycle',
  'mutate-paper-trading',
  'mutate-orders',
  'approve-risk',
  'submit-execution',
  'mutate-knowledge-lake-as-sot',
  'authorize-eligibility-from-lake',
  'invent-envelope-points',
  'auto-certify-without-human',
  'own-research-experiments',
  'implement-orchestrator',
  'implement-market-state',
] as const);

export type StrategyLibraryForbiddenCapability =
  (typeof STRATEGY_LIBRARY_FORBIDDEN_CAPABILITIES)[number];

/**
 * Immutable boundary descriptor for the Strategy Library SoT owner.
 */
export type StrategyLibraryBoundary = Readonly<{
  moduleId: typeof STRATEGY_LIBRARY_MODULE_ID;
  authorityClass: typeof STRATEGY_LIBRARY_AUTHORITY_CLASS;
  ownedConcerns: typeof STRATEGY_LIBRARY_OWNED_CONCERNS;
  classification: typeof STRATEGY_LIBRARY_CLASSIFICATION;
  nonOwned: typeof STRATEGY_LIBRARY_NON_OWNED;
  distinctFrom: typeof STRATEGY_LIBRARY_DISTINCT_FROM;
  forbiddenCapabilities: typeof STRATEGY_LIBRARY_FORBIDDEN_CAPABILITIES;
  /**
   * Port posture by Epic / Product Completion.
   * RC-22: full domain; Nest write ports inactive except as later activated.
   * RC-23 Epic 2: Lookup + Eligibility Nest read ports active (for Enforcement).
   * PC-02: Certification Nest write port active (HTTP product). Registration / Lifecycle remain inactive.
   */
  activePorts: Readonly<{
    registration: false;
    certification: true;
    certificationDomain: true;
    tacticalEnvelopeDomain: true;
    eligibilityDomain: true;
    lifecycleDomain: true;
    lookup: true;
    eligibility: true;
    lifecycle: false;
    persistence: true;
    strategyModel: true;
  }>;
  /** Knowledge Lake relationship: projection consumer only (never Library SoT). */
  knowledgeLakeRole: 'projection-consumer-only';
}>;

/** Sole RC-22 Strategy Library boundary constant. */
export const STRATEGY_LIBRARY_BOUNDARY: StrategyLibraryBoundary = Object.freeze({
  moduleId: STRATEGY_LIBRARY_MODULE_ID,
  authorityClass: STRATEGY_LIBRARY_AUTHORITY_CLASS,
  ownedConcerns: STRATEGY_LIBRARY_OWNED_CONCERNS,
  classification: STRATEGY_LIBRARY_CLASSIFICATION,
  nonOwned: STRATEGY_LIBRARY_NON_OWNED,
  distinctFrom: STRATEGY_LIBRARY_DISTINCT_FROM,
  forbiddenCapabilities: STRATEGY_LIBRARY_FORBIDDEN_CAPABILITIES,
  activePorts: Object.freeze({
    registration: false,
    certification: true,
    certificationDomain: true,
    tacticalEnvelopeDomain: true,
    eligibilityDomain: true,
    lifecycleDomain: true,
    lookup: true,
    eligibility: true,
    lifecycle: false,
    persistence: true,
    strategyModel: true,
  }),
  knowledgeLakeRole: 'projection-consumer-only',
});

/** True when a capability is forbidden for Strategy Library. */
export function isStrategyLibraryForbiddenCapability(
  value: string,
): value is StrategyLibraryForbiddenCapability {
  return (STRATEGY_LIBRARY_FORBIDDEN_CAPABILITIES as readonly string[]).includes(value);
}

/** True when a concern is Library-owned (declared). */
export function isStrategyLibraryOwnedConcern(value: string): value is StrategyLibraryOwnedConcern {
  return (STRATEGY_LIBRARY_OWNED_CONCERNS as readonly string[]).includes(value);
}

/**
 * Registry `active` is never certification.
 * Experimental registry status must not be treated as Library membership.
 */
export function registryActiveMeansCertified(): false {
  return false;
}

/**
 * Knowledge Lake never owns Library membership or eligibility.
 */
export function knowledgeLakeOwnsLibraryMembership(): false {
  return false;
}

/**
 * Library owns certified membership SoT (Authority Matrix / Spec §5.2).
 * It does not own Session lifecycle, Paper, Execution, or Lake warehouse.
 */
export function strategyLibraryOwnsCertifiedMembership(): true {
  return true;
}

/**
 * Conflict rule: on certified membership / envelope disputes,
 * Strategy Library wins over Lake projections and UI caches.
 */
export function resolveLibraryAuthorityConflict(
  concern: 'certified-membership' | 'tactical-envelope' | 'eligibility-status',
): 'strategy-library' {
  void concern;
  return 'strategy-library';
}

/**
 * Conflict rule: on session / paper / execution / lake disputes outside Library facts,
 * those owners win — Library does not absorb them.
 */
export function resolveNonLibraryConflict(
  concern: 'session-lifecycle' | 'paper-trading' | 'execution' | 'knowledge-lake-facts',
): 'trading-session' | 'paper-trading' | 'execution-engine' | 'knowledge-lake-projection' {
  switch (concern) {
    case 'session-lifecycle':
      return 'trading-session';
    case 'paper-trading':
      return 'paper-trading';
    case 'execution':
      return 'execution-engine';
    case 'knowledge-lake-facts':
      return 'knowledge-lake-projection';
  }
}
