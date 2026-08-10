/**
 * RC-25 Epic 6 — Market Profile consumer read models.
 *
 * Immutable projections for future Orchestrator / Reporting / AI Analytics.
 * Never Source of Truth for consumers. Never authorize trading.
 */

export const MARKET_PROFILE_CONSUMER_INTENDED = Object.freeze([
  'trading-orchestrator',
  'reporting',
  'ai-analytics',
] as const);

export type MarketProfileConsumerAudience = (typeof MARKET_PROFILE_CONSUMER_INTENDED)[number];

/** Optional Lake projection category marker — projection only, never financial SoT. */
export const MARKET_PROFILE_LAKE_PROJECTION_CATEGORY = 'MarketProfile' as const;

export type ProfileVersionMetadataProjection = Readonly<{
  marketProfileId: string;
  workspaceId: string;
  targetId: string;
  exchangeScopeId: string;
  marketSymbol: string;
  version: number;
  qualificationRunId: string;
  publishedAt: string;
  authorityClass: 'research_artifact';
  forcesTrade: false;
  authorizesSession: false;
  mutable: false;
  consumerWritable: false;
}>;

export type ProfileDimensionSnapshot = Readonly<{
  volatilityRegime: string;
  liquidityRegime: string;
  trendRegime: string;
  structureCharacteristicCount: number;
}>;

export type MarketProfileConsumerProjection = Readonly<{
  marketProfileId: string;
  workspaceId: string;
  targetId: string;
  exchangeScopeId: string;
  marketSymbol: string;
  version: number;
  qualificationRunId: string;
  dimensions: ProfileDimensionSnapshot;
  confidenceLevel: string;
  publishedAt: string;
  authorityClass: 'research_artifact';
  forcesTrade: false;
  authorizesSession: false;
  mutable: false;
  consumerWritable: false;
}>;
