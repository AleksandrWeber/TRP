/**
 * RC-25 Epic 6 — Market Qualification consumer read models.
 *
 * Immutable projections for future Orchestrator / Reporting / AI Analytics.
 * Never Source of Truth for consumers. Never authorize trading.
 */

export const MARKET_QUALIFICATION_CONSUMER_INTENDED = Object.freeze([
  'trading-orchestrator',
  'reporting',
  'ai-analytics',
] as const);

export type MarketQualificationConsumerAudience =
  (typeof MARKET_QUALIFICATION_CONSUMER_INTENDED)[number];

/** Optional Lake projection category marker — projection only, never financial SoT. */
export const MARKET_QUALIFICATION_LAKE_PROJECTION_CATEGORY = 'MarketQualification' as const;

export type QualificationLifecycleStatusProjection = Readonly<{
  workspaceId: string;
  exchangeScopeId: string;
  marketSymbol: string;
  targetId: string;
  state: string;
  activeRunId?: string;
  latestCompletedRunId?: string;
  updatedAt: string;
  authorityClass: 'research_artifact';
  forcesTrade: false;
  authorizesSession: false;
  mutable: false;
  consumerWritable: false;
}>;

export type MarketConfidenceProjection = Readonly<{
  workspaceId: string;
  exchangeScopeId: string;
  marketSymbol: string;
  targetId: string;
  level: string;
  score?: number;
  rationaleSummary: string;
  sourceRunId: string;
  asOf: string;
  authorityClass: 'research_artifact';
  forcesTrade: false;
  authorizesSession: false;
  mutable: false;
  consumerWritable: false;
}>;

export type MarketHealthProjection = Readonly<{
  workspaceId: string;
  exchangeScopeId: string;
  marketSymbol: string;
  targetId: string;
  status: string;
  indicatorCount: number;
  sourceRunId: string;
  asOf: string;
  authorityClass: 'research_artifact';
  forcesTrade: false;
  authorizesSession: false;
  mutable: false;
  consumerWritable: false;
}>;

export type QualificationConsumerSummary = Readonly<{
  workspaceId: string;
  exchangeScopeId: string;
  marketSymbol: string;
  targetId: string;
  lifecycle: QualificationLifecycleStatusProjection | null;
  confidence: MarketConfidenceProjection | null;
  health: MarketHealthProjection | null;
  latestRunStatus?: string;
  authorityClass: 'research_artifact';
  forcesTrade: false;
  authorizesSession: false;
  mutable: false;
  consumerWritable: false;
}>;
