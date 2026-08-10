/**
 * RC-25 — Market Profile boundary + ownership invariants.
 *
 * Architecture Spec v2.0 §5.3 — Versioned venue qualification artifacts.
 * Authority class: research_artifact (research SoT for _profile versions_
 * within this domain only — never execution SoT; never forces trades).
 *
 * Epic 1: boundary + ownership + inactive ports (no profile calculation).
 * Epic 3: Domain model entities (shared RC timing with Qualification).
 * Epic 5: Profile versioning + dimension publish ports.
 * Epic 6: Consumer read ports for Orchestrator / Reporting / AI.
 *
 * Mantra: Profiles describe. They do not execute, select, or authorize trading.
 */

/** Authority Matrix / Domain Model class for Market Profile artifacts. */
export const MARKET_PROFILE_AUTHORITY_CLASS = 'research_artifact' as const;

/** Canonical module identity (code / docs). */
export const MARKET_PROFILE_MODULE_ID = 'market-profile' as const;

/**
 * Fact families Market Profile owns (declared in Epic 1;
 * versioning / dimension behaviour activates in later Epics).
 */
export const MARKET_PROFILE_OWNED_CONCERNS = Object.freeze([
  'market-profile-boundary',
  'market-profile',
  'profile-versioning',
  'volatility-profile',
  'liquidity-profile',
  'trend-profile',
  'structural-profile',
] as const);

export type MarketProfileOwnedConcern = (typeof MARKET_PROFILE_OWNED_CONCERNS)[number];

/**
 * Surfaces Market Profile must never absorb.
 */
export const MARKET_PROFILE_NON_OWNED = Object.freeze([
  'qualification-decisions',
  'qualification-state',
  'qualification-lifecycle',
  'strategy-selection',
  'trading-orchestrator',
  'market-state-engine',
  'runtime-enforcement',
  'strategy-library',
  'trading-session',
  'strategy-deployment',
  'orders',
  'risk-engine',
  'execution-engine',
  'ledger',
  'reporting',
  'ai-analytics',
  'knowledge-lake',
  'tactical-envelope',
  'live-market-data-ownership',
] as const);

export type MarketProfileNonOwned = (typeof MARKET_PROFILE_NON_OWNED)[number];

/**
 * Surfaces that remain distinct bounded contexts / aliases.
 */
export const MARKET_PROFILE_DISTINCT_FROM = Object.freeze([
  'market-qualification',
  'market-state',
  'trading-orchestrator',
  'runtime-enforcement',
  'strategy-library',
  'trading-session',
  'bot-facade',
  'reporting',
  'ai-analytics',
  'live-market-data',
] as const);

/**
 * Forbidden Market Profile capabilities.
 */
export const MARKET_PROFILE_FORBIDDEN_CAPABILITIES = Object.freeze([
  'select-strategy',
  'select-tactic',
  'force-exchange-choice',
  'force-trade',
  'authorize-deployment',
  'authorize-session-start',
  'command-trading-session',
  'submit-order',
  'approve-risk',
  'submit-execution',
  'mutate-ledger',
  'certify-strategy',
  'expand-tactical-envelope',
  'replace-runtime-enforcement',
  'replace-strategy-library',
  'classify-market-state',
  'make-qualification-decision',
  'generate-report',
  'generate-narrative',
  'become-execution-source-of-truth',
] as const);

export type MarketProfileForbiddenCapability =
  (typeof MARKET_PROFILE_FORBIDDEN_CAPABILITIES)[number];

/**
 * Immutable boundary descriptor for Market Profile.
 */
export type MarketProfileBoundary = Readonly<{
  moduleId: typeof MARKET_PROFILE_MODULE_ID;
  authorityClass: typeof MARKET_PROFILE_AUTHORITY_CLASS;
  ownedConcerns: typeof MARKET_PROFILE_OWNED_CONCERNS;
  nonOwned: typeof MARKET_PROFILE_NON_OWNED;
  distinctFrom: typeof MARKET_PROFILE_DISTINCT_FROM;
  forbiddenCapabilities: typeof MARKET_PROFILE_FORBIDDEN_CAPABILITIES;
  /**
   * Port posture by Epic.
   * Epic 6: profile publish + query + consumer reads active; no calculation / REST / persistence.
   */
  activePorts: Readonly<{
    marketProfileService: true;
    marketProfileQuery: true;
    observationalInputReads: true;
    consumerRead: true;
    persistence: false;
    rest: false;
  }>;
  /** Qualification is upstream consumer of LMD; Profile consumes via Qualification. */
  qualificationRole: 'upstream-read-consumer';
  /** Execution / Session SoT? Never. */
  executionSourceOfTruth: false;
  /** Forces trades? Never. */
  forcesTrade: false;
}>;

export const MARKET_PROFILE_BOUNDARY: MarketProfileBoundary = Object.freeze({
  moduleId: MARKET_PROFILE_MODULE_ID,
  authorityClass: MARKET_PROFILE_AUTHORITY_CLASS,
  ownedConcerns: MARKET_PROFILE_OWNED_CONCERNS,
  nonOwned: MARKET_PROFILE_NON_OWNED,
  distinctFrom: MARKET_PROFILE_DISTINCT_FROM,
  forbiddenCapabilities: MARKET_PROFILE_FORBIDDEN_CAPABILITIES,
  activePorts: Object.freeze({
    marketProfileService: true,
    marketProfileQuery: true,
    observationalInputReads: true,
    consumerRead: true,
    persistence: false,
    rest: false,
  }),
  qualificationRole: 'upstream-read-consumer',
  executionSourceOfTruth: false,
  forcesTrade: false,
});

export function isMarketProfileForbiddenCapability(
  value: string,
): value is MarketProfileForbiddenCapability {
  return (MARKET_PROFILE_FORBIDDEN_CAPABILITIES as readonly string[]).includes(value);
}

export function marketProfileIsExecutionSourceOfTruth(): false {
  return false;
}

export function marketProfileForcesTrade(): false {
  return false;
}

export function marketProfileSelectsStrategies(): false {
  return false;
}

export function marketProfileCommandsSessions(): false {
  return false;
}

export function marketProfileReplacesRuntimeEnforcement(): false {
  return false;
}

export function marketProfileReplacesStrategyLibrary(): false {
  return false;
}

export function marketProfileOwnsQualificationDecisions(): false {
  return false;
}

export function marketProfileExpandsTacticalEnvelope(): false {
  return false;
}
