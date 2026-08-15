/**
 * PC-09 — HTTP product views of existing Market Profile artifacts.
 *
 * Market Profile remains owner. Qualification unchanged. Market State unchanged.
 * Not a new SoT. Not scoring. Not a profile calculator. Not a trade authorization.
 */

import type { MarketProfile } from '../market-profile/domain/market-profile';
import type { LiquidityProfile } from '../market-profile/domain/liquidity-profile';
import type { StructuralCharacteristics } from '../market-profile/domain/structural-characteristics';
import type { TrendProfile } from '../market-profile/domain/trend-profile';
import type { VolatilityProfile } from '../market-profile/domain/volatility-profile';
import type {
  MarketProfileSummary,
  MarketProfileView,
} from '../market-profile/ports/market-profile.port';

export const MARKET_PROFILE_PRODUCT_FLAGS = Object.freeze({
  authorityClass: 'research_artifact' as const,
  forcesTrade: false as const,
  authorizesSession: false as const,
  isMarketQualification: false as const,
  isMarketState: false as const,
  isRiskEngine: false as const,
  isExecutionEngine: false as const,
  isTradingSession: false as const,
  calculatesProfile: false as const,
  scoresMarket: false as const,
});

export type MarketProfileListItemView = Readonly<{
  marketProfileId: string;
  workspaceId: string;
  targetId: string;
  exchangeScopeId: string;
  marketSymbol: string;
  displayName: string;
  version: number;
  versionCount: number;
  qualificationRunId: string;
  publishedAt: string;
  publishedBy: string | null;
  confidenceLevel: string | null;
  isLatest: boolean;
}> &
  typeof MARKET_PROFILE_PRODUCT_FLAGS;

export type MarketProfileWorkspaceView = Readonly<{
  workspaceId: string;
  targetCount: number;
  versionCount: number;
  latestCount: number;
  latest: readonly MarketProfileListItemView[];
  recentVersions: readonly MarketProfileVersionListItemView[];
}> &
  typeof MARKET_PROFILE_PRODUCT_FLAGS;

export type MarketProfilePageView = Readonly<{
  items: readonly MarketProfileListItemView[];
}> &
  typeof MARKET_PROFILE_PRODUCT_FLAGS;

export type MarketProfileVersionListItemView = Readonly<{
  marketProfileId: string;
  workspaceId: string;
  targetId: string;
  exchangeScopeId: string;
  marketSymbol: string;
  version: number;
  qualificationRunId: string;
  publishedAt: string;
  publishedBy: string | null;
  confidenceLevel: string | null;
  isLatest: boolean;
}> &
  typeof MARKET_PROFILE_PRODUCT_FLAGS;

export type MarketProfileVersionPageView = Readonly<{
  items: readonly MarketProfileVersionListItemView[];
}> &
  typeof MARKET_PROFILE_PRODUCT_FLAGS;

export type MarketProfileMetadataView = Readonly<{
  marketProfileId: string;
  workspaceId: string;
  targetId: string;
  exchangeScopeId: string;
  marketSymbol: string;
  version: number;
  publishedAt: string;
  publishedBy: string;
  qualificationRunId: string;
  confidenceLevel: string;
  confidenceScore: number | null;
  confidenceSourceRunId: string;
  rationaleSummary: string;
}> &
  typeof MARKET_PROFILE_PRODUCT_FLAGS;

export type MarketProfilePublishedSourceView = Readonly<{
  qualificationRunId: string;
  sourceRunId: string;
  publishedAt: string;
  publishedBy: string;
  targetId: string;
  exchangeScopeId: string;
  marketSymbol: string;
}> &
  typeof MARKET_PROFILE_PRODUCT_FLAGS;

export type MarketProfileDimensionMetricView = Readonly<{
  key: string;
  value: string;
}>;

export type MarketProfileDimensionView = Readonly<{
  kind: 'volatility' | 'liquidity' | 'trend' | 'structure';
  regimeLabel: string | null;
  windowSummary: string | null;
  notes: string | null;
  metrics: readonly MarketProfileDimensionMetricView[];
}>;

export type MarketProfileDimensionsView = Readonly<{
  marketProfileId: string;
  version: number;
  volatility: MarketProfileDimensionView;
  liquidity: MarketProfileDimensionView;
  trend: MarketProfileDimensionView;
  structure: MarketProfileDimensionView;
}> &
  typeof MARKET_PROFILE_PRODUCT_FLAGS;

export type MarketProfileCompareFieldView = Readonly<{
  field: string;
  from: string;
  to: string;
  changed: boolean;
}>;

export type MarketProfileCompareView = Readonly<{
  targetId: string;
  workspaceId: string;
  exchangeScopeId: string;
  marketSymbol: string;
  fromVersion: number;
  toVersion: number;
  from: MarketProfileMetadataView;
  to: MarketProfileMetadataView;
  differences: readonly MarketProfileCompareFieldView[];
}> &
  typeof MARKET_PROFILE_PRODUCT_FLAGS;

export type MarketProfileDetailView = Readonly<{
  marketProfileId: string;
  workspaceId: string;
  targetId: string;
  exchangeScopeId: string;
  marketSymbol: string;
  displayName: string;
  version: number;
  isLatest: boolean;
  isCurrentPublished: boolean;
  currentPublishedVersion: number;
  metadata: MarketProfileMetadataView;
  publishedSource: MarketProfilePublishedSourceView;
  dimensions: MarketProfileDimensionsView;
  versions: readonly MarketProfileVersionListItemView[];
}> &
  typeof MARKET_PROFILE_PRODUCT_FLAGS;

export type MarketProfileTargetDetailView = Readonly<{
  targetId: string;
  workspaceId: string;
  exchangeScopeId: string;
  marketSymbol: string;
  displayName: string;
  currentPublishedVersion: number;
  latest: MarketProfileDetailView;
  versions: readonly MarketProfileVersionListItemView[];
}> &
  typeof MARKET_PROFILE_PRODUCT_FLAGS;

export function toVersionListItemView(
  args: Readonly<{
    summary: MarketProfileSummary;
    latestVersion: number;
    publishedBy?: string | null;
    confidenceLevel?: string | null;
  }>,
): MarketProfileVersionListItemView {
  return Object.freeze({
    marketProfileId: args.summary.marketProfileId,
    workspaceId: args.summary.workspaceId,
    targetId: args.summary.targetId,
    exchangeScopeId: args.summary.exchangeScopeId,
    marketSymbol: args.summary.marketSymbol,
    version: args.summary.version,
    qualificationRunId: args.summary.qualificationRunId,
    publishedAt: args.summary.publishedAt,
    publishedBy: args.publishedBy ?? null,
    confidenceLevel: args.confidenceLevel ?? null,
    isLatest: args.summary.version === args.latestVersion,
    ...MARKET_PROFILE_PRODUCT_FLAGS,
  });
}

export function toListItemView(
  args: Readonly<{
    latest: MarketProfile | MarketProfileView;
    versionCount: number;
  }>,
): MarketProfileListItemView {
  return Object.freeze({
    marketProfileId: args.latest.marketProfileId,
    workspaceId: args.latest.workspaceId,
    targetId: args.latest.targetId,
    exchangeScopeId: args.latest.exchangeScopeId,
    marketSymbol: args.latest.marketSymbol,
    displayName: args.latest.marketSymbol,
    version: args.latest.version,
    versionCount: args.versionCount,
    qualificationRunId: args.latest.qualificationRunId,
    publishedAt: args.latest.publishedAt,
    publishedBy: args.latest.publishedBy,
    confidenceLevel: args.latest.confidenceSummary.level,
    isLatest: true,
    ...MARKET_PROFILE_PRODUCT_FLAGS,
  });
}

export function toMetadataView(
  profile: MarketProfile | MarketProfileView,
): MarketProfileMetadataView {
  return Object.freeze({
    marketProfileId: profile.marketProfileId,
    workspaceId: profile.workspaceId,
    targetId: profile.targetId,
    exchangeScopeId: profile.exchangeScopeId,
    marketSymbol: profile.marketSymbol,
    version: profile.version,
    publishedAt: profile.publishedAt,
    publishedBy: profile.publishedBy,
    qualificationRunId: profile.qualificationRunId,
    confidenceLevel: profile.confidenceSummary.level,
    confidenceScore: profile.confidenceSummary.score ?? null,
    confidenceSourceRunId: profile.confidenceSummary.sourceRunId,
    rationaleSummary: profile.confidenceSummary.rationaleSummary,
    ...MARKET_PROFILE_PRODUCT_FLAGS,
  });
}

export function toPublishedSourceView(
  profile: MarketProfile | MarketProfileView,
): MarketProfilePublishedSourceView {
  return Object.freeze({
    qualificationRunId: profile.qualificationRunId,
    sourceRunId: profile.confidenceSummary.sourceRunId,
    publishedAt: profile.publishedAt,
    publishedBy: profile.publishedBy,
    targetId: profile.targetId,
    exchangeScopeId: profile.exchangeScopeId,
    marketSymbol: profile.marketSymbol,
    ...MARKET_PROFILE_PRODUCT_FLAGS,
  });
}

export function toDimensionsView(
  profile: MarketProfile | MarketProfileView,
): MarketProfileDimensionsView {
  return Object.freeze({
    marketProfileId: profile.marketProfileId,
    version: profile.version,
    volatility: toRegimeDimension('volatility', profile.volatility),
    liquidity: toRegimeDimension('liquidity', profile.liquidity),
    trend: toRegimeDimension('trend', profile.trend),
    structure: toStructureDimension(profile.structure),
    ...MARKET_PROFILE_PRODUCT_FLAGS,
  });
}

export function toDetailView(
  args: Readonly<{
    profile: MarketProfile | MarketProfileView;
    latestVersion: number;
    versions: readonly MarketProfileVersionListItemView[];
  }>,
): MarketProfileDetailView {
  return Object.freeze({
    marketProfileId: args.profile.marketProfileId,
    workspaceId: args.profile.workspaceId,
    targetId: args.profile.targetId,
    exchangeScopeId: args.profile.exchangeScopeId,
    marketSymbol: args.profile.marketSymbol,
    displayName: args.profile.marketSymbol,
    version: args.profile.version,
    isLatest: args.profile.version === args.latestVersion,
    isCurrentPublished: args.profile.version === args.latestVersion,
    currentPublishedVersion: args.latestVersion,
    metadata: toMetadataView(args.profile),
    publishedSource: toPublishedSourceView(args.profile),
    dimensions: toDimensionsView(args.profile),
    versions: Object.freeze([...args.versions]),
    ...MARKET_PROFILE_PRODUCT_FLAGS,
  });
}

export function toTargetDetailView(
  args: Readonly<{
    latest: MarketProfileDetailView;
    versions: readonly MarketProfileVersionListItemView[];
  }>,
): MarketProfileTargetDetailView {
  return Object.freeze({
    targetId: args.latest.targetId,
    workspaceId: args.latest.workspaceId,
    exchangeScopeId: args.latest.exchangeScopeId,
    marketSymbol: args.latest.marketSymbol,
    displayName: args.latest.displayName,
    currentPublishedVersion: args.latest.currentPublishedVersion,
    latest: args.latest,
    versions: Object.freeze([...args.versions]),
    ...MARKET_PROFILE_PRODUCT_FLAGS,
  });
}

export function toWorkspaceView(
  args: Readonly<{
    workspaceId: string;
    latest: readonly MarketProfileListItemView[];
    recentVersions: readonly MarketProfileVersionListItemView[];
    versionCount: number;
  }>,
): MarketProfileWorkspaceView {
  return Object.freeze({
    workspaceId: args.workspaceId,
    targetCount: args.latest.length,
    versionCount: args.versionCount,
    latestCount: args.latest.length,
    latest: Object.freeze([...args.latest]),
    recentVersions: Object.freeze(args.recentVersions.slice(0, 8)),
    ...MARKET_PROFILE_PRODUCT_FLAGS,
  });
}

export function toProfilePageView(
  items: readonly MarketProfileListItemView[],
): MarketProfilePageView {
  return Object.freeze({
    items: Object.freeze([...items]),
    ...MARKET_PROFILE_PRODUCT_FLAGS,
  });
}

export function toVersionPageView(
  items: readonly MarketProfileVersionListItemView[],
): MarketProfileVersionPageView {
  return Object.freeze({
    items: Object.freeze([...items]),
    ...MARKET_PROFILE_PRODUCT_FLAGS,
  });
}

export function toCompareView(
  args: Readonly<{
    from: MarketProfile | MarketProfileView;
    to: MarketProfile | MarketProfileView;
  }>,
): MarketProfileCompareView {
  const from = toMetadataView(args.from);
  const to = toMetadataView(args.to);
  const fields: readonly (keyof Pick<
    MarketProfileMetadataView,
    | 'marketProfileId'
    | 'version'
    | 'publishedAt'
    | 'publishedBy'
    | 'qualificationRunId'
    | 'confidenceLevel'
    | 'confidenceScore'
    | 'confidenceSourceRunId'
    | 'rationaleSummary'
  >)[] = [
    'marketProfileId',
    'version',
    'publishedAt',
    'publishedBy',
    'qualificationRunId',
    'confidenceLevel',
    'confidenceScore',
    'confidenceSourceRunId',
    'rationaleSummary',
  ];
  return Object.freeze({
    targetId: from.targetId,
    workspaceId: from.workspaceId,
    exchangeScopeId: from.exchangeScopeId,
    marketSymbol: from.marketSymbol,
    fromVersion: from.version,
    toVersion: to.version,
    from,
    to,
    differences: Object.freeze(
      fields.map((field) => {
        const left = stringifyMeta(from[field]);
        const right = stringifyMeta(to[field]);
        return Object.freeze({
          field,
          from: left,
          to: right,
          changed: left !== right,
        });
      }),
    ),
    ...MARKET_PROFILE_PRODUCT_FLAGS,
  });
}

function toRegimeDimension(
  kind: 'volatility' | 'liquidity' | 'trend',
  dimension: VolatilityProfile | LiquidityProfile | TrendProfile,
): MarketProfileDimensionView {
  return Object.freeze({
    kind,
    regimeLabel: dimension.regimeLabel,
    windowSummary: dimension.windowSummary,
    notes: null,
    metrics: Object.freeze(
      Object.entries(dimension.metrics).map(([key, value]) =>
        Object.freeze({ key, value: String(value) }),
      ),
    ),
  });
}

function toStructureDimension(structure: StructuralCharacteristics): MarketProfileDimensionView {
  return Object.freeze({
    kind: 'structure' as const,
    regimeLabel: null,
    windowSummary: null,
    notes: structure.notes ?? null,
    metrics: Object.freeze(
      structure.characteristics.map((entry) =>
        Object.freeze({ key: entry.key, value: entry.value }),
      ),
    ),
  });
}

function stringifyMeta(value: string | number | null): string {
  return value === null ? '—' : String(value);
}
