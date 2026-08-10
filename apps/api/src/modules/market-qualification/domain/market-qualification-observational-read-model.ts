/**
 * RC-25 Epic 2 — Immutable observational read models for Market Qualification.
 *
 * Consumer views of Live Market Data and approved Research outputs.
 * Never execution SoT. Never mutated after construction.
 * Provider payloads must not leak as domain truth.
 *
 * No evaluation / scoring / confidence calculation in this epic.
 */

import type {
  MarketLatestStateView,
  MarketStreamStatusView,
  MarketSubscriptionView,
} from '../../live-market-data/api/market-data-views';
import type { AnalyticalFact } from '../../knowledge-lake/domain/analytical-fact-admission';

/** Observation authority — Live Market Data remains authoritative for market observations. */
export const MARKET_OBSERVATION_AUTHORITY_CLASS = 'observation' as const;

/** Research refs remain research_artifact / projection — never execution SoT. */
export const RESEARCH_OUTPUT_REF_AUTHORITY_CLASS = 'research_artifact' as const;

export type ConnectivityHealthView = Readonly<{
  authorityClass: typeof MARKET_OBSERVATION_AUTHORITY_CLASS;
  workspaceId: string;
  exchangeScopeId?: string;
  streams: readonly Readonly<{
    streamId: string;
    instrument: string;
    sourceId: string;
    status: string;
    operationalOnly: true;
    updatedAt: string;
  }>[];
  /** True when no statuses were available for the query. */
  empty: boolean;
}>;

export type MarketObservationSlice = Readonly<{
  authorityClass: typeof MARKET_OBSERVATION_AUTHORITY_CLASS;
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
  /** Live Market Data marks latest projections non-authoritative for trading. */
  authoritative: false;
}>;

export type ExchangeMetadataSlice = Readonly<{
  authorityClass: typeof MARKET_OBSERVATION_AUTHORITY_CLASS;
  workspaceId: string;
  exchangeScopeId?: string;
  sourceId: string;
  instrument: string;
  channel: string;
  streamId: string;
  subscriptionState: string;
}>;

/**
 * Historical / structural observation inputs for later profile work.
 * Epic 2: derived from latest observations when history windows are unavailable —
 * empty-safe; never invents volatility/liquidity/trend scores.
 */
export type HistoricalCharacteristicSlice = Readonly<{
  authorityClass: typeof MARKET_OBSERVATION_AUTHORITY_CLASS;
  workspaceId: string;
  exchangeScopeId?: string;
  instrument: string;
  streamId: string;
  kind: 'latest_snapshot' | 'empty';
  windowSummary: string;
  close?: number;
  volume?: number;
  markPrice?: string;
}>;

export type ResearchOutputRef = Readonly<{
  authorityClass: typeof RESEARCH_OUTPUT_REF_AUTHORITY_CLASS;
  eventId: string;
  workspaceId: string;
  exchangeScopeId?: string;
  producer: string;
  category: string;
  occurredAt: string;
  sourceRefKind?: string;
  sourceRefId?: string;
}>;

export type LiveMarketDataReadQuery = Readonly<{
  workspaceId: string;
  exchangeScopeId?: string;
  instrument?: string;
  streamId?: string;
  streamIds?: readonly string[];
}>;

export type ResearchOutputReadQuery = Readonly<{
  workspaceId: string;
  exchangeScopeId?: string;
  limit?: number;
}>;

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

/** Map Live Market Data statuses → immutable connectivity health. */
export function toConnectivityHealthView(
  workspaceId: string,
  statuses: readonly MarketStreamStatusView[],
  exchangeScopeId?: string,
  streamIds?: readonly string[],
): ConnectivityHealthView {
  const filtered = statuses.filter((row) => {
    if (row.workspaceId !== workspaceId) return false;
    if (!matchesScope(row.sourceId, exchangeScopeId)) return false;
    if (streamIds && streamIds.length > 0 && !streamIds.includes(row.streamId)) {
      return false;
    }
    return true;
  });

  return deepFreeze({
    authorityClass: MARKET_OBSERVATION_AUTHORITY_CLASS,
    workspaceId,
    exchangeScopeId,
    streams: filtered.map((row) =>
      Object.freeze({
        streamId: row.streamId,
        instrument: row.instrument,
        sourceId: row.sourceId,
        status: row.status,
        operationalOnly: true as const,
        updatedAt: row.updatedAt,
      }),
    ),
    empty: filtered.length === 0,
  });
}

/** Map Live Market Data latest states → immutable observation slices. */
export function toMarketObservationSlices(
  workspaceId: string,
  latest: readonly MarketLatestStateView[],
  exchangeScopeId?: string,
  instrument?: string,
  streamId?: string,
): readonly MarketObservationSlice[] {
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
        authorityClass: MARKET_OBSERVATION_AUTHORITY_CLASS,
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
      }),
    );
  return Object.freeze(slices);
}

/** Map subscriptions → exchange/symbol metadata slices. */
export function toExchangeMetadataSlices(
  workspaceId: string,
  subscriptions: readonly MarketSubscriptionView[],
  exchangeScopeId?: string,
  instrument?: string,
): readonly ExchangeMetadataSlice[] {
  const slices = subscriptions
    .filter((row) => {
      if (row.workspaceId !== workspaceId) return false;
      if (!matchesScope(row.sourceId, exchangeScopeId)) return false;
      if (!matchesInstrument(row.instrument, instrument)) return false;
      return true;
    })
    .map((row) =>
      deepFreeze({
        authorityClass: MARKET_OBSERVATION_AUTHORITY_CLASS,
        workspaceId,
        exchangeScopeId,
        sourceId: row.sourceId,
        instrument: row.instrument,
        channel: row.channel,
        streamId: row.streamId,
        subscriptionState: row.state,
      }),
    );
  return Object.freeze(slices);
}

/**
 * Derive historical characteristic inputs from latest observations.
 * Does not compute volatility/liquidity/trend scores.
 */
export function toHistoricalCharacteristicSlices(
  observations: readonly MarketObservationSlice[],
): readonly HistoricalCharacteristicSlice[] {
  if (observations.length === 0) {
    return Object.freeze([]);
  }
  return Object.freeze(
    observations.map((obs) =>
      deepFreeze({
        authorityClass: MARKET_OBSERVATION_AUTHORITY_CLASS,
        workspaceId: obs.workspaceId,
        exchangeScopeId: obs.exchangeScopeId,
        instrument: obs.instrument,
        streamId: obs.streamId,
        kind: 'latest_snapshot' as const,
        windowSummary: obs.freshnessAt ? `latest_as_of:${obs.freshnessAt}` : 'latest_snapshot',
        close: obs.latestClose,
        markPrice: obs.latestMarkPrice,
      }),
    ),
  );
}

/**
 * Map Knowledge Lake Research-category facts → approved research output refs.
 * Policy (Epic 2): category `Research` projections are the approved-read surface.
 */
export function toResearchOutputRefs(
  facts: readonly AnalyticalFact[],
): readonly ResearchOutputRef[] {
  return Object.freeze(
    facts
      .filter((fact) => fact.category === 'Research')
      .map((fact) =>
        deepFreeze({
          authorityClass: RESEARCH_OUTPUT_REF_AUTHORITY_CLASS,
          eventId: fact.eventId,
          workspaceId: fact.workspaceId,
          exchangeScopeId: fact.exchangeScopeId,
          producer: fact.producer,
          category: fact.category,
          occurredAt: fact.occurredAt,
          sourceRefKind: fact.sourceRef?.ownerType,
          sourceRefId: fact.sourceRef?.id,
        }),
      ),
  );
}
