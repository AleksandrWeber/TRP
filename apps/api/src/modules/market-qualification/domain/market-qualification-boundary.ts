/**
 * RC-25 — Market Qualification boundary + ownership invariants.
 *
 * Architecture Spec v2.0 §5.3 — User-triggered venue/market evaluation.
 * Authority class: research_artifact (research SoT for qualification state /
 * confidence / health / lifecycle within this domain only — never execution SoT).
 *
 * Epic 1: boundary + ownership + inactive ports (no evaluation behaviour).
 * Epic 2: Live Market Data (+ approved Research) read consumption.
 * Epic 3: Domain model entities.
 * Epic 4: Qualification lifecycle + evaluation ports.
 * Epic 5–6: Profile publish integration / consumer reads (sibling Profile module).
 *
 * Mantra: Qualification evaluates. It does not execute, select, or authorize trading.
 */

/** Authority Matrix / Domain Model class for Qualification artifacts. */
export const MARKET_QUALIFICATION_AUTHORITY_CLASS = 'research_artifact' as const;

/** Canonical module identity (code / docs). */
export const MARKET_QUALIFICATION_MODULE_ID = 'market-qualification' as const;

/**
 * Fact families Market Qualification owns (declared in Epic 1;
 * evaluation behaviour activates in later Epics).
 */
export const MARKET_QUALIFICATION_OWNED_CONCERNS = Object.freeze([
  'qualification-boundary',
  'qualification-target',
  'qualification-run',
  'qualification-state',
  'market-confidence',
  'market-health',
  'qualification-lifecycle',
] as const);

export type MarketQualificationOwnedConcern = (typeof MARKET_QUALIFICATION_OWNED_CONCERNS)[number];

/**
 * Surfaces Market Qualification must never absorb.
 */
export const MARKET_QUALIFICATION_NON_OWNED = Object.freeze([
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
  'market-profile-versions',
  'volatility-profile',
  'liquidity-profile',
  'trend-profile',
  'structural-profile',
  'tactical-envelope',
  'live-market-data-ownership',
] as const);

export type MarketQualificationNonOwned = (typeof MARKET_QUALIFICATION_NON_OWNED)[number];

/**
 * Surfaces that remain distinct bounded contexts / aliases.
 */
export const MARKET_QUALIFICATION_DISTINCT_FROM = Object.freeze([
  'market-profile',
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
 * Forbidden Market Qualification capabilities.
 */
export const MARKET_QUALIFICATION_FORBIDDEN_CAPABILITIES = Object.freeze([
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
  'generate-report',
  'generate-narrative',
  'become-execution-source-of-truth',
  'auto-spend-heavy-jobs-without-confirm',
] as const);

export type MarketQualificationForbiddenCapability =
  (typeof MARKET_QUALIFICATION_FORBIDDEN_CAPABILITIES)[number];

/**
 * Immutable boundary descriptor for Market Qualification.
 */
export type MarketQualificationBoundary = Readonly<{
  moduleId: typeof MARKET_QUALIFICATION_MODULE_ID;
  authorityClass: typeof MARKET_QUALIFICATION_AUTHORITY_CLASS;
  ownedConcerns: typeof MARKET_QUALIFICATION_OWNED_CONCERNS;
  nonOwned: typeof MARKET_QUALIFICATION_NON_OWNED;
  distinctFrom: typeof MARKET_QUALIFICATION_DISTINCT_FROM;
  forbiddenCapabilities: typeof MARKET_QUALIFICATION_FORBIDDEN_CAPABILITIES;
  /**
   * Port posture by Epic.
   * Epic 6: lifecycle + query + consumer reads active; no scoring / REST / persistence product.
   */
  activePorts: Readonly<{
    marketQualificationService: true;
    marketQualificationQuery: true;
    liveMarketDataConsumer: true;
    researchOutputConsumer: true;
    consumerRead: true;
    persistence: true;
    rest: false;
  }>;
  /** Live Market Data ingress role. */
  liveMarketDataRole: 'read-only-consumer';
  /** Research outputs role (optional; empty-safe). */
  researchOutputsRole: 'read-only-consumer';
  /** Execution / Session SoT? Never. */
  executionSourceOfTruth: false;
  /** Forces trades? Never. */
  forcesTrade: false;
}>;

export const MARKET_QUALIFICATION_BOUNDARY: MarketQualificationBoundary = Object.freeze({
  moduleId: MARKET_QUALIFICATION_MODULE_ID,
  authorityClass: MARKET_QUALIFICATION_AUTHORITY_CLASS,
  ownedConcerns: MARKET_QUALIFICATION_OWNED_CONCERNS,
  nonOwned: MARKET_QUALIFICATION_NON_OWNED,
  distinctFrom: MARKET_QUALIFICATION_DISTINCT_FROM,
  forbiddenCapabilities: MARKET_QUALIFICATION_FORBIDDEN_CAPABILITIES,
  activePorts: Object.freeze({
    marketQualificationService: true,
    marketQualificationQuery: true,
    liveMarketDataConsumer: true,
    researchOutputConsumer: true,
    consumerRead: true,
    persistence: true,
    rest: false,
  }),
  liveMarketDataRole: 'read-only-consumer',
  researchOutputsRole: 'read-only-consumer',
  executionSourceOfTruth: false,
  forcesTrade: false,
});

export function isMarketQualificationForbiddenCapability(
  value: string,
): value is MarketQualificationForbiddenCapability {
  return (MARKET_QUALIFICATION_FORBIDDEN_CAPABILITIES as readonly string[]).includes(value);
}

export function marketQualificationIsExecutionSourceOfTruth(): false {
  return false;
}

export function marketQualificationForcesTrade(): false {
  return false;
}

export function marketQualificationSelectsStrategies(): false {
  return false;
}

export function marketQualificationCommandsSessions(): false {
  return false;
}

export function marketQualificationReplacesRuntimeEnforcement(): false {
  return false;
}

export function marketQualificationReplacesStrategyLibrary(): false {
  return false;
}

export function marketQualificationOwnsMarketProfileVersions(): false {
  return false;
}
