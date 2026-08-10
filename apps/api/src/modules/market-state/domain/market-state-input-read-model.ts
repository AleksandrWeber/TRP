/**
 * RC-26 Epic 2 — Immutable input read models for Market State.
 *
 * Consumer views of Live Market Data, Market Qualification, and Market Profile.
 * Market State observes and maps — it does not interpret, classify, or score.
 *
 * Authority classes preserved from upstream:
 * - LMD slices → observation (never trading SoT)
 * - Qualification / Profile projections → research_artifact
 *
 * Never market_state_artifact until Epic 3 classification.
 */

import type {
  MarketLatestStateView,
  MarketStreamStatusView,
  MarketSubscriptionView,
} from '../../live-market-data/api/market-data-views';
import type {
  MarketConfidenceProjection,
  MarketHealthProjection,
  QualificationConsumerSummary,
  QualificationLifecycleStatusProjection,
} from '../../market-qualification/domain/market-qualification-consumer-read-model';
import type {
  MarketProfileConsumerProjection,
  ProfileVersionMetadataProjection,
} from '../../market-profile/domain/market-profile-consumer-read-model';

/** Observation authority — Live Market Data remains SoT for ingress observations. */
export const MARKET_STATE_INPUT_OBSERVATION_AUTHORITY = 'observation' as const;

/** Research refs remain research_artifact — never Market State classification SoT. */
export const MARKET_STATE_INPUT_RESEARCH_AUTHORITY = 'research_artifact' as const;

// ─── Queries ───────────────────────────────────────────────────────────────

export type MarketStateLiveMarketDataReadQuery = Readonly<{
  workspaceId: string;
  exchangeScopeId?: string;
  instrument?: string;
  streamId?: string;
  streamIds?: readonly string[];
}>;

export type MarketStateTargetReadQuery = Readonly<{
  workspaceId: string;
  exchangeScopeId: string;
  marketSymbol: string;
}>;

export type MarketStateProfileVersionReadQuery = MarketStateTargetReadQuery &
  Readonly<{
    version: number;
  }>;

// ─── Live Market Data input slices ─────────────────────────────────────────

/** Current market snapshot (latest projection) — not a Market State classification. */
export type MarketSnapshotInput = Readonly<{
  authorityClass: typeof MARKET_STATE_INPUT_OBSERVATION_AUTHORITY;
  workspaceId: string;
  exchangeScopeId?: string;
  streamId: string;
  instrument: string;
  sourceId: string;
  channel: string;
  timeframe?: string;
  latestClose?: number;
  latestMarkPrice?: string;
  freshnessAt: string | null;
  authoritative: false;
  forcesTrade: false;
  isMarketStateClassification: false;
}>;

/** Exchange / subscription metadata. */
export type ExchangeMetadataInput = Readonly<{
  authorityClass: typeof MARKET_STATE_INPUT_OBSERVATION_AUTHORITY;
  workspaceId: string;
  exchangeScopeId?: string;
  sourceId: string;
  instrument: string;
  channel: string;
  streamId: string;
  subscriptionState: string;
  forcesTrade: false;
  isMarketStateClassification: false;
}>;

/** Symbol / stream operational state (connectivity). */
export type SymbolStateInput = Readonly<{
  authorityClass: typeof MARKET_STATE_INPUT_OBSERVATION_AUTHORITY;
  workspaceId: string;
  exchangeScopeId?: string;
  streamId: string;
  instrument: string;
  sourceId: string;
  status: string;
  operationalOnly: true;
  updatedAt: string;
  forcesTrade: false;
  isMarketStateClassification: false;
}>;

export type SymbolStateBundle = Readonly<{
  authorityClass: typeof MARKET_STATE_INPUT_OBSERVATION_AUTHORITY;
  workspaceId: string;
  exchangeScopeId?: string;
  symbols: readonly SymbolStateInput[];
  empty: boolean;
  forcesTrade: false;
  isMarketStateClassification: false;
}>;

// ─── Qualification input views (research_artifact preserved) ───────────────

export type QualificationLifecycleInput = Readonly<{
  authorityClass: typeof MARKET_STATE_INPUT_RESEARCH_AUTHORITY;
  workspaceId: string;
  exchangeScopeId: string;
  marketSymbol: string;
  targetId: string;
  state: string;
  activeRunId?: string;
  latestCompletedRunId?: string;
  updatedAt: string;
  forcesTrade: false;
  authorizesSession: false;
  isQualificationOwnership: false;
  isMarketStateClassification: false;
}>;

export type QualificationConfidenceInput = Readonly<{
  authorityClass: typeof MARKET_STATE_INPUT_RESEARCH_AUTHORITY;
  workspaceId: string;
  exchangeScopeId: string;
  marketSymbol: string;
  targetId: string;
  level: string;
  score?: number;
  rationaleSummary: string;
  sourceRunId: string;
  asOf: string;
  forcesTrade: false;
  authorizesSession: false;
  isQualificationOwnership: false;
  isMarketStateClassification: false;
}>;

export type QualificationHealthInput = Readonly<{
  authorityClass: typeof MARKET_STATE_INPUT_RESEARCH_AUTHORITY;
  workspaceId: string;
  exchangeScopeId: string;
  marketSymbol: string;
  targetId: string;
  status: string;
  indicatorCount: number;
  sourceRunId: string;
  asOf: string;
  forcesTrade: false;
  authorizesSession: false;
  isQualificationOwnership: false;
  isMarketStateClassification: false;
}>;

export type QualificationSummaryInput = Readonly<{
  authorityClass: typeof MARKET_STATE_INPUT_RESEARCH_AUTHORITY;
  workspaceId: string;
  exchangeScopeId: string;
  marketSymbol: string;
  targetId: string;
  lifecycle: QualificationLifecycleInput | null;
  confidence: QualificationConfidenceInput | null;
  health: QualificationHealthInput | null;
  latestRunStatus?: string;
  forcesTrade: false;
  authorizesSession: false;
  isQualificationOwnership: false;
  isMarketStateClassification: false;
}>;

// ─── Profile input views (research_artifact preserved) ─────────────────────

export type ProfileVersionMetadataInput = Readonly<{
  authorityClass: typeof MARKET_STATE_INPUT_RESEARCH_AUTHORITY;
  marketProfileId: string;
  workspaceId: string;
  targetId: string;
  exchangeScopeId: string;
  marketSymbol: string;
  version: number;
  qualificationRunId: string;
  publishedAt: string;
  forcesTrade: false;
  authorizesSession: false;
  isProfileOwnership: false;
  isMarketStateClassification: false;
}>;

export type ProfileLatestInput = Readonly<{
  authorityClass: typeof MARKET_STATE_INPUT_RESEARCH_AUTHORITY;
  marketProfileId: string;
  workspaceId: string;
  targetId: string;
  exchangeScopeId: string;
  marketSymbol: string;
  version: number;
  qualificationRunId: string;
  dimensions: Readonly<{
    volatilityRegime: string;
    liquidityRegime: string;
    trendRegime: string;
    structureCharacteristicCount: number;
  }>;
  confidenceLevel: string;
  publishedAt: string;
  forcesTrade: false;
  authorizesSession: false;
  isProfileOwnership: false;
  isMarketStateClassification: false;
}>;

// ─── Helpers ───────────────────────────────────────────────────────────────

function deepFreeze<T>(value: T): T {
  if (value === null || typeof value !== 'object') {
    return value;
  }
  if (Object.isFrozen(value)) {
    return value;
  }
  for (const key of Object.keys(value as object)) {
    deepFreeze((value as Record<string, unknown>)[key]);
  }
  return Object.freeze(value);
}

function matchesScope(sourceId: string | undefined, exchangeScopeId: string | undefined): boolean {
  if (!exchangeScopeId) return true;
  if (!sourceId) return false;
  return (
    sourceId === exchangeScopeId ||
    sourceId.includes(exchangeScopeId) ||
    exchangeScopeId.includes(sourceId)
  );
}

function matchesInstrument(instrument: string | undefined, filter: string | undefined): boolean {
  if (!filter) return true;
  if (!instrument) return false;
  return instrument === filter;
}

/** Map LMD latest states → immutable market snapshots. */
export function toMarketSnapshotInputs(
  workspaceId: string,
  latest: readonly MarketLatestStateView[],
  exchangeScopeId?: string,
  instrument?: string,
  streamId?: string,
): readonly MarketSnapshotInput[] {
  const slices = latest
    .filter((row) => {
      if (row.workspaceId !== workspaceId) return false;
      if (!matchesScope(row.sourceId, exchangeScopeId)) return false;
      if (!matchesInstrument(row.instrument, instrument)) return false;
      if (streamId && row.streamId !== streamId) return false;
      return true;
    })
    .map((row) =>
      deepFreeze({
        authorityClass: MARKET_STATE_INPUT_OBSERVATION_AUTHORITY,
        workspaceId,
        exchangeScopeId,
        streamId: row.streamId,
        instrument: row.instrument,
        sourceId: row.sourceId,
        channel: row.channel,
        timeframe: row.timeframe,
        latestClose: row.latestClosedCandle?.close,
        latestMarkPrice: row.latestMarkPrice?.price,
        freshnessAt: row.freshnessAt,
        authoritative: false as const,
        forcesTrade: false as const,
        isMarketStateClassification: false as const,
      }),
    );
  return Object.freeze(slices);
}

/** Map LMD subscriptions → exchange metadata inputs. */
export function toExchangeMetadataInputs(
  workspaceId: string,
  subscriptions: readonly MarketSubscriptionView[],
  exchangeScopeId?: string,
  instrument?: string,
): readonly ExchangeMetadataInput[] {
  const slices = subscriptions
    .filter((row) => {
      if (row.workspaceId !== workspaceId) return false;
      if (!matchesScope(row.sourceId, exchangeScopeId)) return false;
      if (!matchesInstrument(row.instrument, instrument)) return false;
      return true;
    })
    .map((row) =>
      deepFreeze({
        authorityClass: MARKET_STATE_INPUT_OBSERVATION_AUTHORITY,
        workspaceId,
        exchangeScopeId,
        sourceId: row.sourceId,
        instrument: row.instrument,
        channel: row.channel,
        streamId: row.streamId,
        subscriptionState: row.state,
        forcesTrade: false as const,
        isMarketStateClassification: false as const,
      }),
    );
  return Object.freeze(slices);
}

/** Map LMD statuses → symbol-state bundle. */
export function toSymbolStateBundle(
  workspaceId: string,
  statuses: readonly MarketStreamStatusView[],
  exchangeScopeId?: string,
  streamIds?: readonly string[],
): SymbolStateBundle {
  const filtered = statuses.filter((row) => {
    if (row.workspaceId !== workspaceId) return false;
    if (!matchesScope(row.sourceId, exchangeScopeId)) return false;
    if (streamIds && streamIds.length > 0 && !streamIds.includes(row.streamId)) {
      return false;
    }
    return true;
  });

  return deepFreeze({
    authorityClass: MARKET_STATE_INPUT_OBSERVATION_AUTHORITY,
    workspaceId,
    exchangeScopeId,
    symbols: filtered.map((row) =>
      Object.freeze({
        authorityClass: MARKET_STATE_INPUT_OBSERVATION_AUTHORITY,
        workspaceId,
        exchangeScopeId,
        streamId: row.streamId,
        instrument: row.instrument,
        sourceId: row.sourceId,
        status: row.status,
        operationalOnly: true as const,
        updatedAt: row.updatedAt,
        forcesTrade: false as const,
        isMarketStateClassification: false as const,
      }),
    ),
    empty: filtered.length === 0,
    forcesTrade: false as const,
    isMarketStateClassification: false as const,
  });
}

function mapLifecycle(p: QualificationLifecycleStatusProjection): QualificationLifecycleInput {
  return deepFreeze({
    authorityClass: MARKET_STATE_INPUT_RESEARCH_AUTHORITY,
    workspaceId: p.workspaceId,
    exchangeScopeId: p.exchangeScopeId,
    marketSymbol: p.marketSymbol,
    targetId: p.targetId,
    state: p.state,
    activeRunId: p.activeRunId,
    latestCompletedRunId: p.latestCompletedRunId,
    updatedAt: p.updatedAt,
    forcesTrade: false as const,
    authorizesSession: false as const,
    isQualificationOwnership: false as const,
    isMarketStateClassification: false as const,
  });
}

function mapConfidence(p: MarketConfidenceProjection): QualificationConfidenceInput {
  return deepFreeze({
    authorityClass: MARKET_STATE_INPUT_RESEARCH_AUTHORITY,
    workspaceId: p.workspaceId,
    exchangeScopeId: p.exchangeScopeId,
    marketSymbol: p.marketSymbol,
    targetId: p.targetId,
    level: p.level,
    score: p.score,
    rationaleSummary: p.rationaleSummary,
    sourceRunId: p.sourceRunId,
    asOf: p.asOf,
    forcesTrade: false as const,
    authorizesSession: false as const,
    isQualificationOwnership: false as const,
    isMarketStateClassification: false as const,
  });
}

function mapHealth(p: MarketHealthProjection): QualificationHealthInput {
  return deepFreeze({
    authorityClass: MARKET_STATE_INPUT_RESEARCH_AUTHORITY,
    workspaceId: p.workspaceId,
    exchangeScopeId: p.exchangeScopeId,
    marketSymbol: p.marketSymbol,
    targetId: p.targetId,
    status: p.status,
    indicatorCount: p.indicatorCount,
    sourceRunId: p.sourceRunId,
    asOf: p.asOf,
    forcesTrade: false as const,
    authorizesSession: false as const,
    isQualificationOwnership: false as const,
    isMarketStateClassification: false as const,
  });
}

/** Map Qualification consumer projection → Market State input (no ownership transfer). */
export function toQualificationLifecycleInput(
  projection: QualificationLifecycleStatusProjection | null,
): QualificationLifecycleInput | null {
  return projection ? mapLifecycle(projection) : null;
}

export function toQualificationConfidenceInput(
  projection: MarketConfidenceProjection | null,
): QualificationConfidenceInput | null {
  return projection ? mapConfidence(projection) : null;
}

export function toQualificationHealthInput(
  projection: MarketHealthProjection | null,
): QualificationHealthInput | null {
  return projection ? mapHealth(projection) : null;
}

export function toQualificationSummaryInput(
  summary: QualificationConsumerSummary | null,
): QualificationSummaryInput | null {
  if (!summary) return null;
  return deepFreeze({
    authorityClass: MARKET_STATE_INPUT_RESEARCH_AUTHORITY,
    workspaceId: summary.workspaceId,
    exchangeScopeId: summary.exchangeScopeId,
    marketSymbol: summary.marketSymbol,
    targetId: summary.targetId,
    lifecycle: summary.lifecycle ? mapLifecycle(summary.lifecycle) : null,
    confidence: summary.confidence ? mapConfidence(summary.confidence) : null,
    health: summary.health ? mapHealth(summary.health) : null,
    latestRunStatus: summary.latestRunStatus,
    forcesTrade: false as const,
    authorizesSession: false as const,
    isQualificationOwnership: false as const,
    isMarketStateClassification: false as const,
  });
}

/** Map Profile consumer projection → Market State input (no ownership transfer). */
export function toProfileLatestInput(
  projection: MarketProfileConsumerProjection | null,
): ProfileLatestInput | null {
  if (!projection) return null;
  return deepFreeze({
    authorityClass: MARKET_STATE_INPUT_RESEARCH_AUTHORITY,
    marketProfileId: projection.marketProfileId,
    workspaceId: projection.workspaceId,
    targetId: projection.targetId,
    exchangeScopeId: projection.exchangeScopeId,
    marketSymbol: projection.marketSymbol,
    version: projection.version,
    qualificationRunId: projection.qualificationRunId,
    dimensions: Object.freeze({ ...projection.dimensions }),
    confidenceLevel: projection.confidenceLevel,
    publishedAt: projection.publishedAt,
    forcesTrade: false as const,
    authorizesSession: false as const,
    isProfileOwnership: false as const,
    isMarketStateClassification: false as const,
  });
}

export function toProfileVersionMetadataInput(
  projection: ProfileVersionMetadataProjection | null,
): ProfileVersionMetadataInput | null {
  if (!projection) return null;
  return deepFreeze({
    authorityClass: MARKET_STATE_INPUT_RESEARCH_AUTHORITY,
    marketProfileId: projection.marketProfileId,
    workspaceId: projection.workspaceId,
    targetId: projection.targetId,
    exchangeScopeId: projection.exchangeScopeId,
    marketSymbol: projection.marketSymbol,
    version: projection.version,
    qualificationRunId: projection.qualificationRunId,
    publishedAt: projection.publishedAt,
    forcesTrade: false as const,
    authorizesSession: false as const,
    isProfileOwnership: false as const,
    isMarketStateClassification: false as const,
  });
}

export function toProfileVersionMetadataInputs(
  history: readonly ProfileVersionMetadataProjection[],
): readonly ProfileVersionMetadataInput[] {
  return Object.freeze(
    history
      .map((row) => toProfileVersionMetadataInput(row))
      .filter((row): row is ProfileVersionMetadataInput => row !== null),
  );
}
