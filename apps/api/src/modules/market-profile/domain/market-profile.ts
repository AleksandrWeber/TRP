/**
 * RC-25 Epic 3 — MarketProfile (immutable versioned venue artifact).
 *
 * Domain Model Contract §9.
 * Product alias: Profile Version ≡ one MarketProfile row (immutable after publish).
 * Structure only — does not calculate dimensions or force trades.
 */

import {
  MARKET_PROFILE_DOMAIN_AUTHORITY_CLASS,
  assertIsoTimestamp,
  assertNonEmptyString,
  assertPositiveVersion,
  deepFreeze,
} from './market-profile-domain-shared';
import {
  createLiquidityProfile,
  type CreateLiquidityProfileInput,
  type LiquidityProfile,
} from './liquidity-profile';
import {
  createStructuralCharacteristics,
  type CreateStructuralCharacteristicsInput,
  type StructuralCharacteristics,
} from './structural-characteristics';
import {
  createTrendProfile,
  type CreateTrendProfileInput,
  type TrendProfile,
} from './trend-profile';
import {
  createVolatilityProfile,
  type CreateVolatilityProfileInput,
  type VolatilityProfile,
} from './volatility-profile';

export type MarketProfileConfidenceSummary = Readonly<{
  level: string;
  score?: number;
  sourceRunId: string;
  rationaleSummary: string;
}>;

export type MarketProfile = Readonly<{
  marketProfileId: string;
  workspaceId: string;
  targetId: string;
  exchangeScopeId: string;
  marketSymbol: string;
  version: number;
  qualificationRunId: string;
  volatility: VolatilityProfile;
  liquidity: LiquidityProfile;
  trend: TrendProfile;
  structure: StructuralCharacteristics;
  confidenceSummary: MarketProfileConfidenceSummary;
  publishedAt: string;
  publishedBy: string;
  authorityClass: typeof MARKET_PROFILE_DOMAIN_AUTHORITY_CLASS;
  forcesTrade: false;
}>;

export type CreateMarketProfileInput = Readonly<{
  marketProfileId: string;
  workspaceId: string;
  targetId: string;
  exchangeScopeId: string;
  marketSymbol: string;
  version: number;
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
  publishedAt: string;
  publishedBy: string;
}>;

function resolveVolatility(
  value: CreateVolatilityProfileInput | VolatilityProfile,
): VolatilityProfile {
  if (Object.isFrozen(value) && 'regimeLabel' in value && 'metrics' in value) {
    return value as VolatilityProfile;
  }
  return createVolatilityProfile(value as CreateVolatilityProfileInput);
}

function resolveLiquidity(value: CreateLiquidityProfileInput | LiquidityProfile): LiquidityProfile {
  if (Object.isFrozen(value) && 'regimeLabel' in value && 'metrics' in value) {
    return value as LiquidityProfile;
  }
  return createLiquidityProfile(value as CreateLiquidityProfileInput);
}

function resolveTrend(value: CreateTrendProfileInput | TrendProfile): TrendProfile {
  if (Object.isFrozen(value) && 'regimeLabel' in value && 'metrics' in value) {
    return value as TrendProfile;
  }
  return createTrendProfile(value as CreateTrendProfileInput);
}

function resolveStructure(
  value: CreateStructuralCharacteristicsInput | StructuralCharacteristics,
): StructuralCharacteristics {
  if (Object.isFrozen(value) && 'characteristics' in value) {
    return value as StructuralCharacteristics;
  }
  return createStructuralCharacteristics(value as CreateStructuralCharacteristicsInput);
}

/**
 * Create an immutable MarketProfile version.
 * Does not compute dimensions. forcesTrade is always false.
 * Corrections require a new version (new create call) — never mutate this object.
 */
export function createMarketProfile(input: CreateMarketProfileInput): MarketProfile {
  const marketProfileId = assertNonEmptyString(input.marketProfileId, 'marketProfileId');
  const workspaceId = assertNonEmptyString(input.workspaceId, 'workspaceId');
  const targetId = assertNonEmptyString(input.targetId, 'targetId');
  const exchangeScopeId = assertNonEmptyString(input.exchangeScopeId, 'exchangeScopeId');
  const marketSymbol = assertNonEmptyString(input.marketSymbol, 'marketSymbol');
  const qualificationRunId = assertNonEmptyString(input.qualificationRunId, 'qualificationRunId');
  const publishedBy = assertNonEmptyString(input.publishedBy, 'publishedBy');
  const publishedAt = assertIsoTimestamp(input.publishedAt, 'publishedAt');
  const version = assertPositiveVersion(input.version);

  const level = assertNonEmptyString(input.confidenceSummary.level, 'confidenceSummary.level');
  const sourceRunId = assertNonEmptyString(
    input.confidenceSummary.sourceRunId,
    'confidenceSummary.sourceRunId',
  );
  const rationaleSummary = assertNonEmptyString(
    input.confidenceSummary.rationaleSummary,
    'confidenceSummary.rationaleSummary',
  );
  if (
    input.confidenceSummary.score !== undefined &&
    !(input.confidenceSummary.score >= 0 && input.confidenceSummary.score <= 1)
  ) {
    throw new Error('confidenceSummary.score must be in [0, 1] when provided');
  }

  return deepFreeze({
    marketProfileId,
    workspaceId,
    targetId,
    exchangeScopeId,
    marketSymbol,
    version,
    qualificationRunId,
    volatility: resolveVolatility(input.volatility),
    liquidity: resolveLiquidity(input.liquidity),
    trend: resolveTrend(input.trend),
    structure: resolveStructure(input.structure),
    confidenceSummary: Object.freeze({
      level,
      ...(input.confidenceSummary.score !== undefined
        ? { score: input.confidenceSummary.score }
        : {}),
      sourceRunId,
      rationaleSummary,
    }),
    publishedAt,
    publishedBy,
    authorityClass: MARKET_PROFILE_DOMAIN_AUTHORITY_CLASS,
    forcesTrade: false as const,
  });
}
