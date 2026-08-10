/**
 * RC-26 — Market State boundary + ownership invariants.
 *
 * Architecture Spec v2.0 §5.4 — Classify current market conditions.
 * Authority class: market_state_artifact (current-condition SoT for
 * classifications within this domain only — never Qualification, never
 * Profile versions, never execution SoT).
 *
 * Epic 1: boundary + ownership + inactive ports (no classification behaviour).
 * Epic 2: Live Market Data + Qualification + Profile read consumption.
 * Epic 3: Immutable domain model + lifecycle / versioning (no classification algorithms).
 * Epic 6: Consumer read ports for Reporting / AI / Command Center.
 *
 * Mantra: Market State describes. It does not qualify, select, or execute.
 */

/** Domain Model / Authority class for Market State artifacts. */
export const MARKET_STATE_AUTHORITY_CLASS = 'market_state_artifact' as const;

/** Canonical module identity (code / docs). */
export const MARKET_STATE_MODULE_ID = 'market-state' as const;

/**
 * Fact families Market State owns (Epic 3: domain entities materialized;
 * classification algorithms remain deferred).
 */
export const MARKET_STATE_OWNED_CONCERNS = Object.freeze([
  'market-state-boundary',
  'market-state',
  'market-state-version',
  'market-state-lifecycle',
  'market-state-snapshot',
  'market-state-metadata',
  'market-state-transition',
  'current-state-snapshot',
] as const);

export type MarketStateOwnedConcern = (typeof MARKET_STATE_OWNED_CONCERNS)[number];

/**
 * Surfaces Market State must never absorb.
 */
export const MARKET_STATE_NON_OWNED = Object.freeze([
  'qualification-decisions',
  'qualification-state',
  'qualification-lifecycle',
  'qualification-run',
  'market-confidence-ownership',
  'market-health-ownership',
  'market-profile-versions',
  'volatility-profile',
  'liquidity-profile',
  'trend-profile',
  'structural-profile',
  'strategy-selection',
  'tactic-selection',
  'trading-orchestrator',
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

export type MarketStateNonOwned = (typeof MARKET_STATE_NON_OWNED)[number];

/**
 * Surfaces that remain distinct bounded contexts / aliases.
 */
export const MARKET_STATE_DISTINCT_FROM = Object.freeze([
  'market-qualification',
  'market-profile',
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
 * Forbidden Market State capabilities.
 */
export const MARKET_STATE_FORBIDDEN_CAPABILITIES = Object.freeze([
  'run-qualification',
  'publish-market-profile',
  'make-qualification-decision',
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
  'become-second-qualification',
  'generate-report',
  'generate-narrative',
  'become-execution-source-of-truth',
] as const);

export type MarketStateForbiddenCapability = (typeof MARKET_STATE_FORBIDDEN_CAPABILITIES)[number];

/**
 * Immutable boundary descriptor for Market State.
 */
export type MarketStateBoundary = Readonly<{
  moduleId: typeof MARKET_STATE_MODULE_ID;
  authorityClass: typeof MARKET_STATE_AUTHORITY_CLASS;
  ownedConcerns: typeof MARKET_STATE_OWNED_CONCERNS;
  nonOwned: typeof MARKET_STATE_NON_OWNED;
  distinctFrom: typeof MARKET_STATE_DISTINCT_FROM;
  forbiddenCapabilities: typeof MARKET_STATE_FORBIDDEN_CAPABILITIES;
  /**
   * Port posture by Epic.
   * Epic 6: consumer-read active; classify/query still inactive.
   */
  activePorts: Readonly<{
    marketStateService: false;
    marketStateQuery: false;
    liveMarketDataConsumer: true;
    qualificationConsumer: true;
    profileConsumer: true;
    consumerRead: true;
    persistence: false;
    rest: false;
  }>;
  /** Live Market Data ingress role (Epic 2+). */
  liveMarketDataRole: 'read-only-consumer';
  /** Qualification / Profile confidence role (Epic 2+). */
  researchConfidenceRole: 'read-only-consumer';
  /** Execution / Session SoT? Never. */
  executionSourceOfTruth: false;
  /** Forces trades? Never. */
  forcesTrade: false;
  /** Is Market Qualification? Never. */
  isQualification: false;
  /** Is Market Profile? Never. */
  isProfile: false;
}>;

export const MARKET_STATE_BOUNDARY: MarketStateBoundary = Object.freeze({
  moduleId: MARKET_STATE_MODULE_ID,
  authorityClass: MARKET_STATE_AUTHORITY_CLASS,
  ownedConcerns: MARKET_STATE_OWNED_CONCERNS,
  nonOwned: MARKET_STATE_NON_OWNED,
  distinctFrom: MARKET_STATE_DISTINCT_FROM,
  forbiddenCapabilities: MARKET_STATE_FORBIDDEN_CAPABILITIES,
  activePorts: Object.freeze({
    marketStateService: false,
    marketStateQuery: false,
    liveMarketDataConsumer: true,
    qualificationConsumer: true,
    profileConsumer: true,
    consumerRead: true,
    persistence: false,
    rest: false,
  }),
  liveMarketDataRole: 'read-only-consumer',
  researchConfidenceRole: 'read-only-consumer',
  executionSourceOfTruth: false,
  forcesTrade: false,
  isQualification: false,
  isProfile: false,
});

export function isMarketStateForbiddenCapability(
  value: string,
): value is MarketStateForbiddenCapability {
  return (MARKET_STATE_FORBIDDEN_CAPABILITIES as readonly string[]).includes(value);
}

export function marketStateIsExecutionSourceOfTruth(): false {
  return false;
}

export function marketStateForcesTrade(): false {
  return false;
}

export function marketStateSelectsStrategies(): false {
  return false;
}

export function marketStateCommandsSessions(): false {
  return false;
}

export function marketStateIsQualification(): false {
  return false;
}

export function marketStateIsProfile(): false {
  return false;
}

export function marketStateOwnsQualificationDecisions(): false {
  return false;
}

export function marketStateOwnsProfileVersions(): false {
  return false;
}
