/**
 * RC-26 Epic 6 — Market State consumer read models.
 *
 * Immutable projections for Reporting / AI Analytics / Command Center.
 * Never Source of Truth transfer. Never authorize trading.
 */

export const MARKET_STATE_CONSUMER_INTENDED = Object.freeze([
  'reporting',
  'ai-analytics',
  'command-center',
  'trading-orchestrator',
  'multi-exchange',
  'monitoring',
] as const);

export type MarketStateConsumerAudience = (typeof MARKET_STATE_CONSUMER_INTENDED)[number];

export const MARKET_STATE_CONSUMER_FLAGS = Object.freeze({
  authorityClass: 'market_state_artifact' as const,
  forcesTrade: false as const,
  isQualification: false as const,
  isProfile: false as const,
  authorizesRuntime: false as const,
  mutable: false as const,
  consumerWritable: false as const,
});

export type MarketStateProjection = Readonly<{
  marketStateId: string;
  workspaceId: string;
  exchangeScopeId: string;
  marketSymbol: string;
  version: number;
  lifecycleStatus: string;
  regimeLabel?: string;
  volatilityLabel?: string;
  liquidityLabel?: string;
  metadataSummary?: string;
  publishedAt: string;
  publishedBy: string;
  authorityClass: 'market_state_artifact';
  forcesTrade: false;
  isQualification: false;
  isProfile: false;
  authorizesRuntime: false;
  mutable: false;
  consumerWritable: false;
}>;

export type MarketStateTransitionProjection = Readonly<{
  marketStateId: string;
  workspaceId: string;
  exchangeScopeId: string;
  marketSymbol: string;
  fromVersion: number | null;
  toVersion: number;
  fromLifecycle?: string;
  toLifecycle: string;
  transitionedAt: string;
  authorityClass: 'market_state_artifact';
  forcesTrade: false;
  isQualification: false;
  isProfile: false;
  mutable: false;
  consumerWritable: false;
}>;
