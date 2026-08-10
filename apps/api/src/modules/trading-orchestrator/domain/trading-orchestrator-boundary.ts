/**
 * RC-26 — Trading Orchestrator boundary + ownership invariants.
 *
 * Architecture Spec v2.0 §5.5 — Coordinate certified strategy/tactic selection
 * and Session handoff. Authority class: orchestration_artifact (coordination
 * SoT within this domain only — never money/fills, never Gate, never Library).
 *
 * Epic 1: boundary + ownership + inactive ports (no orchestration behaviour).
 * Epic 4: Immutable domain model + lifecycle / plan versioning (no workflow).
 * Epic 5: Workflow ports (Library / Gate / Market State / Risk-read coordination).
 * Epic 6: Consumer read ports for Reporting / AI / Command Center.
 *
 * Mantra: Trading Orchestrator coordinates. It does not execute, certify,
 * enforce, qualify, or replace participating-module ownership.
 */

/** Domain Model / Authority class for Orchestrator coordination artifacts. */
export const TRADING_ORCHESTRATOR_AUTHORITY_CLASS = 'orchestration_artifact' as const;

/** Canonical module identity (code / docs). */
export const TRADING_ORCHESTRATOR_MODULE_ID = 'trading-orchestrator' as const;

/**
 * Fact families Trading Orchestrator owns.
 * Epic 4 materializes identity / plan / intent / lifecycle / metadata.
 * Selection / tactic / Session handoff remain declared for Epic 5+.
 */
export const TRADING_ORCHESTRATOR_OWNED_CONCERNS = Object.freeze([
  'orchestrator-boundary',
  'trading-orchestrator',
  'orchestration-plan',
  'orchestration-plan-version',
  'orchestration-intent',
  'orchestration-lifecycle',
  'orchestration-metadata',
  'orchestration-workflow',
  'orchestration-run',
  'coordination-pipeline',
  'execution-intent-sequencing',
  'selection-decision',
  'tactic-selection',
  'session-handoff-intent',
] as const);

export type TradingOrchestratorOwnedConcern = (typeof TRADING_ORCHESTRATOR_OWNED_CONCERNS)[number];

/**
 * Surfaces Trading Orchestrator must never absorb.
 */
export const TRADING_ORCHESTRATOR_NON_OWNED = Object.freeze([
  'strategy-certification',
  'strategy-eligibility-sot',
  'tactical-envelope-ownership',
  'runtime-enforcement-gate',
  'qualification-decisions',
  'qualification-lifecycle',
  'market-profile-versions',
  'market-state-ownership',
  'trading-session-lifecycle',
  'strategy-deployment-ownership',
  'orders',
  'risk-decisions',
  'risk-engine',
  'execution-engine',
  'execution-adapter',
  'ledger',
  'fills',
  'reporting',
  'ai-analytics',
  'knowledge-lake',
  'live-market-data-ownership',
] as const);

export type TradingOrchestratorNonOwned = (typeof TRADING_ORCHESTRATOR_NON_OWNED)[number];

/**
 * Surfaces that remain distinct bounded contexts / aliases.
 */
export const TRADING_ORCHESTRATOR_DISTINCT_FROM = Object.freeze([
  'market-state',
  'market-qualification',
  'market-profile',
  'runtime-enforcement',
  'strategy-library',
  'trading-session',
  'bot-facade',
  'execution-engine',
  'risk-engine',
  'orders',
  'reporting',
  'ai-analytics',
  'live-market-data',
] as const);

/**
 * Forbidden Trading Orchestrator capabilities.
 */
export const TRADING_ORCHESTRATOR_FORBIDDEN_CAPABILITIES = Object.freeze([
  'certify-strategy',
  'expand-tactical-envelope',
  'invent-envelope-points',
  'silent-strategy-version-change',
  'replace-runtime-enforcement',
  'soft-pass-enforcement-gate',
  'duplicate-validation-gate',
  'run-qualification',
  'publish-market-profile',
  'own-market-state',
  'own-trading-session-lifecycle',
  'approve-risk',
  'trip-kill-switch',
  'submit-order',
  'submit-execution',
  'call-exchange-adapter',
  'mutate-ledger',
  'invent-fill',
  'force-trade',
  'force-exchange-choice',
  'generate-ai-trade-decision',
  'generate-report',
  'generate-narrative',
  'become-execution-source-of-truth',
  'become-execution-engine',
] as const);

export type TradingOrchestratorForbiddenCapability =
  (typeof TRADING_ORCHESTRATOR_FORBIDDEN_CAPABILITIES)[number];

/**
 * Immutable boundary descriptor for Trading Orchestrator.
 */
export type TradingOrchestratorBoundary = Readonly<{
  moduleId: typeof TRADING_ORCHESTRATOR_MODULE_ID;
  authorityClass: typeof TRADING_ORCHESTRATOR_AUTHORITY_CLASS;
  ownedConcerns: typeof TRADING_ORCHESTRATOR_OWNED_CONCERNS;
  nonOwned: typeof TRADING_ORCHESTRATOR_NON_OWNED;
  distinctFrom: typeof TRADING_ORCHESTRATOR_DISTINCT_FROM;
  forbiddenCapabilities: typeof TRADING_ORCHESTRATOR_FORBIDDEN_CAPABILITIES;
  /**
   * Port posture by Epic.
   * Epic 5: service/query + Library/Gate/State/Risk-read + handoff intent active.
   */
  activePorts: Readonly<{
    tradingOrchestratorService: true;
    tradingOrchestratorQuery: true;
    strategyLibraryConsumer: true;
    runtimeEnforcementConsumer: true;
    riskPolicyConsumer: true;
    marketStateConsumer: true;
    qualificationConsumer: false;
    profileConsumer: false;
    sessionHandoff: true;
    consumerRead: true;
    persistence: false;
    rest: false;
  }>;
  /** Upstream module roles (Epic 5). */
  strategyLibraryRole: 'read-only-consumer';
  runtimeEnforcementRole: 'gate-consumer';
  riskEngineRole: 'policy-read-consumer';
  marketStateRole: 'read-only-consumer';
  tradingSessionRole: 'handoff-intent-emitter';
  /** Execution / money SoT? Never. */
  executionSourceOfTruth: false;
  /** Approves risk? Never. */
  approvesRisk: false;
  /** Submits orders? Never. */
  submitsOrders: false;
  /** Forces trades? Never. */
  forcesTrade: false;
}>;

export const TRADING_ORCHESTRATOR_BOUNDARY: TradingOrchestratorBoundary = Object.freeze({
  moduleId: TRADING_ORCHESTRATOR_MODULE_ID,
  authorityClass: TRADING_ORCHESTRATOR_AUTHORITY_CLASS,
  ownedConcerns: TRADING_ORCHESTRATOR_OWNED_CONCERNS,
  nonOwned: TRADING_ORCHESTRATOR_NON_OWNED,
  distinctFrom: TRADING_ORCHESTRATOR_DISTINCT_FROM,
  forbiddenCapabilities: TRADING_ORCHESTRATOR_FORBIDDEN_CAPABILITIES,
  activePorts: Object.freeze({
    tradingOrchestratorService: true,
    tradingOrchestratorQuery: true,
    strategyLibraryConsumer: true,
    runtimeEnforcementConsumer: true,
    riskPolicyConsumer: true,
    marketStateConsumer: true,
    qualificationConsumer: false,
    profileConsumer: false,
    sessionHandoff: true,
    consumerRead: true,
    persistence: false,
    rest: false,
  }),
  strategyLibraryRole: 'read-only-consumer',
  runtimeEnforcementRole: 'gate-consumer',
  riskEngineRole: 'policy-read-consumer',
  marketStateRole: 'read-only-consumer',
  tradingSessionRole: 'handoff-intent-emitter',
  executionSourceOfTruth: false,
  approvesRisk: false,
  submitsOrders: false,
  forcesTrade: false,
});

export function isTradingOrchestratorForbiddenCapability(
  value: string,
): value is TradingOrchestratorForbiddenCapability {
  return (TRADING_ORCHESTRATOR_FORBIDDEN_CAPABILITIES as readonly string[]).includes(value);
}

export function tradingOrchestratorIsExecutionSourceOfTruth(): false {
  return false;
}

export function tradingOrchestratorForcesTrade(): false {
  return false;
}

export function tradingOrchestratorApprovesRisk(): false {
  return false;
}

export function tradingOrchestratorSubmitsOrders(): false {
  return false;
}

export function tradingOrchestratorOwnsSessionLifecycle(): false {
  return false;
}

export function tradingOrchestratorReplacesRuntimeEnforcement(): false {
  return false;
}

export function tradingOrchestratorReplacesStrategyLibrary(): false {
  return false;
}

export function tradingOrchestratorOwnsQualification(): false {
  return false;
}

export function tradingOrchestratorOwnsMarketProfile(): false {
  return false;
}

export function tradingOrchestratorOwnsMarketState(): false {
  return false;
}

export function tradingOrchestratorIsExecutionEngine(): false {
  return false;
}
