/**
 * RC-24 — AI Analytics boundary + ownership invariants.
 *
 * Architecture Spec v2.0 §5.15 — Narrative research and explanation support.
 * Authority class: Narrative.
 *
 * Epic 1: reserve the bounded context.
 * Epic 5: deterministic narratives over Reporting query ports only.
 */

/** Authority Matrix class for AI Analyst / Assistant text. */
export const AI_ANALYTICS_AUTHORITY_CLASS = 'narrative' as const;

/** Canonical module identity (code / docs). Product UI may say “AI Analytics”. */
export const AI_ANALYTICS_MODULE_ID = 'ai-analytics' as const;

/**
 * Fact families AI Analytics owns.
 */
export const AI_ANALYTICS_OWNED_CONCERNS = Object.freeze([
  'analytical-narrative-boundary',
  'analytical-narrative',
] as const);

export type AiAnalyticsOwnedConcern = (typeof AI_ANALYTICS_OWNED_CONCERNS)[number];

/**
 * Surfaces AI Analytics must never absorb / query as SoT.
 */
export const AI_ANALYTICS_NON_OWNED = Object.freeze([
  'trading-decisions',
  'orders',
  'risk-engine',
  'execution-engine',
  'ledger',
  'trading-session',
  'strategy-library',
  'runtime-enforcement',
  'knowledge-lake',
  'reporting-reports',
  'trading-orchestrator',
  'strategy-selection',
] as const);

/**
 * Distinct from Reporting (projection owner of reports) and the existing AI Gateway (`ai`).
 */
export const AI_ANALYTICS_DISTINCT_FROM = Object.freeze([
  'reporting',
  'ai',
  'knowledge-lake',
  'runtime-enforcement',
  'strategy-library',
  'bot-facade',
] as const);

/**
 * Forbidden AI Analytics capabilities (Spec §10 deny list).
 */
export const AI_ANALYTICS_FORBIDDEN_CAPABILITIES = Object.freeze([
  'execute-trades',
  'approve-trades',
  'mutate-orders',
  'mutate-fills',
  'mutate-positions',
  'mutate-ledger',
  'certify-strategy',
  'replace-runtime-enforcement',
  'replace-strategy-library',
  'become-source-of-truth',
  'silent-config-change',
  'bypass-risk',
  'telegram-control-plane',
  'modify-report-run',
  'query-knowledge-lake-directly',
  'query-trading-session',
  'query-strategy-library',
  'query-runtime-enforcement',
  'query-orders',
  'query-ledger',
] as const);

export type AiAnalyticsForbiddenCapability = (typeof AI_ANALYTICS_FORBIDDEN_CAPABILITIES)[number];

export type AiAnalyticsBoundary = Readonly<{
  moduleId: typeof AI_ANALYTICS_MODULE_ID;
  authorityClass: typeof AI_ANALYTICS_AUTHORITY_CLASS;
  ownedConcerns: typeof AI_ANALYTICS_OWNED_CONCERNS;
  nonOwned: typeof AI_ANALYTICS_NON_OWNED;
  distinctFrom: typeof AI_ANALYTICS_DISTINCT_FROM;
  forbiddenCapabilities: typeof AI_ANALYTICS_FORBIDDEN_CAPABILITIES;
  /** Epic 5: narrative ports active over Reporting reads. */
  activePorts: Readonly<{
    explain: true;
    summarize: true;
    identifyTrends: true;
    generateNarrative: true;
    persistence: false;
    rest: false;
  }>;
  /** Analytical data ingress: Reporting query only. */
  reportingRole: 'read-only-consumer';
  knowledgeLakeRole: 'never-direct';
  sourceOfTruth: false;
}>;

export const AI_ANALYTICS_BOUNDARY: AiAnalyticsBoundary = Object.freeze({
  moduleId: AI_ANALYTICS_MODULE_ID,
  authorityClass: AI_ANALYTICS_AUTHORITY_CLASS,
  ownedConcerns: AI_ANALYTICS_OWNED_CONCERNS,
  nonOwned: AI_ANALYTICS_NON_OWNED,
  distinctFrom: AI_ANALYTICS_DISTINCT_FROM,
  forbiddenCapabilities: AI_ANALYTICS_FORBIDDEN_CAPABILITIES,
  activePorts: Object.freeze({
    explain: true,
    summarize: true,
    identifyTrends: true,
    generateNarrative: true,
    persistence: false,
    rest: false,
  }),
  reportingRole: 'read-only-consumer',
  knowledgeLakeRole: 'never-direct',
  sourceOfTruth: false,
});

export function isAiAnalyticsForbiddenCapability(
  value: string,
): value is AiAnalyticsForbiddenCapability {
  return (AI_ANALYTICS_FORBIDDEN_CAPABILITIES as readonly string[]).includes(value);
}

export function aiAnalyticsIsSourceOfTruth(): false {
  return false;
}

export function aiAnalyticsMakesTradingDecisions(): false {
  return false;
}

export function aiAnalyticsReplacesRuntimeEnforcement(): false {
  return false;
}

export function aiAnalyticsReplacesStrategyLibrary(): false {
  return false;
}

export function aiAnalyticsQueriesKnowledgeLakeDirectly(): false {
  return false;
}

export function aiAnalyticsModifiesReports(): false {
  return false;
}
