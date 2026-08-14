/**
 * RC-27 — Exchange Scope boundary + ownership invariants.
 *
 * Architecture Spec v2.0 §5.10 — Isolation boundary for one exchange’s
 * resources and policies (UI: Cluster).
 * Authority class: exchange_scope_artifact (isolation SoT for identity /
 * config / context / lifecycle / bindings / policy inputs only).
 *
 * Epic 1: boundary + ownership + inactive ports (no behaviour).
 * Epic 2: Immutable domain model + lifecycle / versioning.
 * Epic 3: Application ports (lifecycle + query).
 * Epic 4: Trading-path keying + isolation (no ownership transfer).
 * Epic 5: Consumer read ports.
 * Epic 6: Authority conformance + readiness.
 *
 * Mantra: Exchange Scope isolates. It never becomes Runtime, Session,
 * Execution Engine, Strategy Library, Risk Engine, or Knowledge Lake.
 */

/** Domain Model / Authority class for Exchange Scope isolation artifacts. */
export const EXCHANGE_SCOPE_AUTHORITY_CLASS = 'exchange_scope_artifact' as const;

/** Canonical module identity (code / docs). */
export const EXCHANGE_SCOPE_MODULE_ID = 'exchange-scope' as const;

/** UI alias (Alias Dictionary). */
export const EXCHANGE_SCOPE_UI_ALIAS = 'Cluster' as const;

/**
 * Fact families Exchange Scope owns (Epic 2: domain entities materialized).
 */
export const EXCHANGE_SCOPE_OWNED_CONCERNS = Object.freeze([
  'exchange-scope-boundary',
  'exchange-scope-identity',
  'exchange-scope',
  'exchange-scope-version',
  'exchange-scope-config',
  'exchange-scope-lifecycle',
  'exchange-scope-context',
  'exchange-scope-metadata',
  'exchange-risk-policy-inputs',
  'trading-account-binding',
  'adapter-binding-context',
] as const);

export type ExchangeScopeOwnedConcern = (typeof EXCHANGE_SCOPE_OWNED_CONCERNS)[number];

/**
 * Surfaces Exchange Scope must never absorb.
 */
export const EXCHANGE_SCOPE_NON_OWNED = Object.freeze([
  'strategy-library',
  'strategy-certification',
  'tactical-envelope-ownership',
  'runtime-enforcement',
  'runtime-enforcement-gate',
  'market-qualification',
  'qualification-decisions',
  'market-profile',
  'market-profile-versions',
  'market-state',
  'market-state-ownership',
  'trading-orchestrator',
  'orchestration-workflow',
  'trading-session',
  'trading-session-lifecycle',
  'strategy-deployment-ownership',
  'strategy-runtime',
  'orders',
  'risk-decisions',
  'risk-engine',
  'execution-engine',
  'execution-adapter',
  'ledger',
  'fills',
  'positions',
  'accounting',
  'reporting',
  'ai-analytics',
  'notification-delivery',
  'knowledge-lake',
  'live-market-data-ownership',
] as const);

export type ExchangeScopeNonOwned = (typeof EXCHANGE_SCOPE_NON_OWNED)[number];

/**
 * Surfaces that remain distinct bounded contexts / aliases.
 */
export const EXCHANGE_SCOPE_DISTINCT_FROM = Object.freeze([
  'strategy-runtime',
  'trading-session',
  'bot-facade',
  'execution-engine',
  'strategy-library',
  'runtime-enforcement',
  'market-qualification',
  'market-profile',
  'market-state',
  'trading-orchestrator',
  'risk-engine',
  'orders',
  'accounting',
  'reporting',
  'ai-analytics',
  'knowledge-lake',
  'notification-delivery',
] as const);

/**
 * Forbidden Exchange Scope capabilities.
 */
export const EXCHANGE_SCOPE_FORBIDDEN_CAPABILITIES = Object.freeze([
  'become-runtime',
  'become-trading-session',
  'become-execution-engine',
  'become-strategy-library',
  'become-risk-engine',
  'become-knowledge-lake',
  'clone-runtime',
  'clone-risk-engine',
  'clone-orders',
  'clone-execution',
  'clone-accounting',
  'clone-reporting',
  'clone-strategy-library',
  'clone-runtime-enforcement',
  'certify-strategy',
  'expand-tactical-envelope',
  'validate-deployment-ownership',
  'soft-pass-enforcement-gate',
  'run-qualification',
  'publish-market-profile',
  'classify-market-state',
  'propose-selection',
  'own-trading-session-lifecycle',
  'approve-risk',
  'trip-kill-switch',
  'submit-order',
  'submit-execution',
  'call-exchange-adapter',
  'mutate-ledger',
  'invent-fill',
  'force-trade',
  'cross-scope-fund-leak',
  'pick-another-exchange-on-ambiguity',
  'generate-ai-trade-decision',
  'generate-report',
  'generate-narrative',
  'become-execution-source-of-truth',
] as const);

export type ExchangeScopeForbiddenCapability =
  (typeof EXCHANGE_SCOPE_FORBIDDEN_CAPABILITIES)[number];

/**
 * Immutable boundary descriptor for Exchange Scope.
 */
export type ExchangeScopeBoundary = Readonly<{
  moduleId: typeof EXCHANGE_SCOPE_MODULE_ID;
  uiAlias: typeof EXCHANGE_SCOPE_UI_ALIAS;
  authorityClass: typeof EXCHANGE_SCOPE_AUTHORITY_CLASS;
  ownedConcerns: typeof EXCHANGE_SCOPE_OWNED_CONCERNS;
  nonOwned: typeof EXCHANGE_SCOPE_NON_OWNED;
  distinctFrom: typeof EXCHANGE_SCOPE_DISTINCT_FROM;
  forbiddenCapabilities: typeof EXCHANGE_SCOPE_FORBIDDEN_CAPABILITIES;
  /**
   * Port posture by Epic.
   * Epic 3: service / query / consumer-read active; persistence/REST/transport inactive.
   */
  activePorts: Readonly<{
    exchangeScopeService: true;
    exchangeScopeQuery: true;
    consumerRead: true;
    persistence: false;
    rest: false;
    transport: false;
  }>;
  /** Isolation role — never a business engine. */
  isolationRole: 'isolation-boundary';
  /** Policy role — inputs only for platform Risk Engine. */
  riskPolicyRole: 'policy-input-owner';
  /** Execution / money SoT? Never. */
  executionSourceOfTruth: false;
  /** Approves risk? Never. */
  approvesRisk: false;
  /** Submits orders? Never. */
  submitsOrders: false;
  /** Is Runtime? Never. */
  isRuntime: false;
  /** Is Trading Session? Never. */
  isTradingSession: false;
  /** Is Execution Engine? Never. */
  isExecutionEngine: false;
  /** Is Strategy Library? Never. */
  isStrategyLibrary: false;
  /** Is Risk Engine? Never. */
  isRiskEngine: false;
  /** Forces trades? Never. */
  forcesTrade: false;
}>;

export const EXCHANGE_SCOPE_BOUNDARY: ExchangeScopeBoundary = Object.freeze({
  moduleId: EXCHANGE_SCOPE_MODULE_ID,
  uiAlias: EXCHANGE_SCOPE_UI_ALIAS,
  authorityClass: EXCHANGE_SCOPE_AUTHORITY_CLASS,
  ownedConcerns: EXCHANGE_SCOPE_OWNED_CONCERNS,
  nonOwned: EXCHANGE_SCOPE_NON_OWNED,
  distinctFrom: EXCHANGE_SCOPE_DISTINCT_FROM,
  forbiddenCapabilities: EXCHANGE_SCOPE_FORBIDDEN_CAPABILITIES,
  activePorts: Object.freeze({
    exchangeScopeService: true,
    exchangeScopeQuery: true,
    consumerRead: true,
    persistence: false,
    rest: false,
    transport: false,
  }),
  isolationRole: 'isolation-boundary',
  riskPolicyRole: 'policy-input-owner',
  executionSourceOfTruth: false,
  approvesRisk: false,
  submitsOrders: false,
  isRuntime: false,
  isTradingSession: false,
  isExecutionEngine: false,
  isStrategyLibrary: false,
  isRiskEngine: false,
  forcesTrade: false,
});

export function isExchangeScopeForbiddenCapability(
  value: string,
): value is ExchangeScopeForbiddenCapability {
  return (EXCHANGE_SCOPE_FORBIDDEN_CAPABILITIES as readonly string[]).includes(value);
}

export function exchangeScopeIsExecutionSourceOfTruth(): false {
  return false;
}

export function exchangeScopeApprovesRisk(): false {
  return false;
}

export function exchangeScopeSubmitsOrders(): false {
  return false;
}

export function exchangeScopeIsRuntime(): false {
  return false;
}

export function exchangeScopeIsTradingSession(): false {
  return false;
}

export function exchangeScopeIsExecutionEngine(): false {
  return false;
}

export function exchangeScopeIsStrategyLibrary(): false {
  return false;
}

export function exchangeScopeIsRiskEngine(): false {
  return false;
}

export function exchangeScopeForcesTrade(): false {
  return false;
}

export function exchangeScopeOwnsSessionLifecycle(): false {
  return false;
}

export function exchangeScopeOwnsStrategyCertification(): false {
  return false;
}
