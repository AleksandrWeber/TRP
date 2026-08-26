/**
 * RC-25 Epic 5 — Market Profile application ports.
 *
 * Contract: docs/project/rc-25-api-contract.md §§6–7
 *
 * Epic 5: immutable profile version publish + query.
 * No calculation / scoring / REST / persistence product.
 */

import type { CreateLiquidityProfileInput, LiquidityProfile } from '../domain/liquidity-profile';
import type { MarketProfile } from '../domain/market-profile';
import type {
  CreateStructuralCharacteristicsInput,
  StructuralCharacteristics,
} from '../domain/structural-characteristics';
import type { CreateTrendProfileInput, TrendProfile } from '../domain/trend-profile';
import type { CreateVolatilityProfileInput, VolatilityProfile } from '../domain/volatility-profile';

/** Nest injection token for MarketProfileServicePort (Epic 5+). */
export const MARKET_PROFILE_SERVICE_PORT = Symbol('MARKET_PROFILE_SERVICE_PORT');

/** Nest injection token for MarketProfileQueryPort (Epic 5+). */
export const MARKET_PROFILE_QUERY_PORT = Symbol('MARKET_PROFILE_QUERY_PORT');

export type PublishMarketProfile = Readonly<{
  workspaceId: string;
  exchangeScopeId: string;
  marketSymbol: string;
  qualificationRunId: string;
  volatility: CreateVolatilityProfileInput | VolatilityProfile;
  liquidity: CreateLiquidityProfileInput | LiquidityProfile;
  trend: CreateTrendProfileInput | TrendProfile;
  structure: CreateStructuralCharacteristicsInput | StructuralCharacteristics;
  confidenceSummary: Readonly<{
    level: string;
    score?: number;
    sourceRunId: string;
    rationaleSummary: string;
  }>;
  publishedBy: string;
  publishedAt?: string;
  /** Optional override; otherwise derived as mkt-profile:{targetId}:v{n}. */
  marketProfileId?: string;
}>;

export type PublishProfileResult = Readonly<{
  outcome: 'published' | 'rejected';
  marketProfileId: string;
  version: number;
  marketProfile?: MarketProfile;
  rejectionReasons?: readonly string[];
  forcesTrade: false;
  authorizesSession: false;
}>;

export type GetLatestMarketProfile = Readonly<{
  workspaceId: string;
  exchangeScopeId: string;
  marketSymbol: string;
}>;

export type GetMarketProfileByVersion = Readonly<{
  workspaceId: string;
  exchangeScopeId: string;
  marketSymbol: string;
  version: number;
}>;

export type ListMarketProfileVersions = Readonly<{
  workspaceId: string;
  exchangeScopeId: string;
  marketSymbol: string;
}>;

export type ListWorkspaceMarketProfiles = Readonly<{
  workspaceId: string;
}>;

export type MarketProfileView = MarketProfile &
  Readonly<{
    authorizesSession: false;
  }>;

export type MarketProfileSummary = Readonly<{
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
}>;

/**
 * Market Profile service port (API Contract §6).
 * Publishes immutable versions from caller-supplied dimension payloads.
 * Does not calculate profiles. Does not authorize trading.
 */
export interface MarketProfileServicePort {
  publishProfileVersion(cmd: PublishMarketProfile): PublishProfileResult;
}

/**
 * Market Profile query port (API Contract §7).
 */
export interface MarketProfileQueryPort {
  getLatestProfile(query: GetLatestMarketProfile): MarketProfileView | null;
  getProfileByVersion(query: GetMarketProfileByVersion): MarketProfileView | null;
  listProfileVersions(query: ListMarketProfileVersions): readonly MarketProfileSummary[];
  /** Additive read of versions already in the process-local store. */
  listWorkspaceProfiles(query: ListWorkspaceMarketProfiles): readonly MarketProfileSummary[];
}

/** Epic 6 posture: publish + query + consumer reads active; no calculation / REST / persistence. */
export const MARKET_PROFILE_PORTS_ACTIVE = Object.freeze({
  marketProfileService: true,
  marketProfileQuery: true,
  observationalInputReads: true,
  consumerRead: true,
  persistence: true,
  rest: false,
} as const);
