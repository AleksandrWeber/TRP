/**
 * RC-26 — Market State application ports.
 *
 * Contract: docs/project/rc-26-api-contract.md §§4–5, §8–9
 *
 * Epic 2: Live Market Data / Qualification / Profile consumers active.
 * Epic 3: Domain factories active; classify/query Nest ports remain inactive.
 * Epic 6: Downstream consumer read activation.
 */

import type {
  ExchangeMetadataInput,
  MarketSnapshotInput,
  MarketStateLiveMarketDataReadQuery,
  MarketStateProfileVersionReadQuery,
  MarketStateTargetReadQuery,
  ProfileLatestInput,
  ProfileVersionMetadataInput,
  QualificationConfidenceInput,
  QualificationHealthInput,
  QualificationLifecycleInput,
  QualificationSummaryInput,
  SymbolStateBundle,
} from '../domain/market-state-input-read-model';
import type {
  MarketStateProjection,
  MarketStateTransitionProjection,
} from '../domain/market-state-consumer-read-model';

/** Nest injection token for MarketStateServicePort (classify deferred). */
export const MARKET_STATE_SERVICE_PORT = Symbol('MARKET_STATE_SERVICE_PORT');

/** Nest injection token for MarketStateQueryPort (classify deferred). */
export const MARKET_STATE_QUERY_PORT = Symbol('MARKET_STATE_QUERY_PORT');

/** Live Market Data consumer token (Epic 2+). */
export const MARKET_STATE_LIVE_MARKET_DATA_READ_CONSUMER = Symbol(
  'MARKET_STATE_LIVE_MARKET_DATA_READ_CONSUMER',
);

/** Market Qualification consumer read token (Epic 2+). */
export const MARKET_STATE_QUALIFICATION_CONSUMER = Symbol('MARKET_STATE_QUALIFICATION_CONSUMER');

/** Market Profile consumer read token (Epic 2+). */
export const MARKET_STATE_PROFILE_CONSUMER = Symbol('MARKET_STATE_PROFILE_CONSUMER');

/** Downstream consumer read token (Epic 6+). */
export const MARKET_STATE_CONSUMER_READ_PORT = Symbol('MARKET_STATE_CONSUMER_READ_PORT');

/**
 * Classify / refresh / expire — Nest inactive (no classification algorithms).
 */
export interface MarketStateServicePort {
  classifyMarketState(cmd: unknown): unknown;
  refreshMarketState(cmd: unknown): unknown;
  expireMarketState(cmd: unknown): unknown;
}

/**
 * Query Nest inactive — consumer-read uses projection store for Epic 6.
 */
export interface MarketStateQueryPort {
  getCurrentMarketState(query: unknown): unknown;
  listMarketStateTransitions(query: unknown): unknown;
  getMarketStateTransition(query: unknown): unknown;
}

export interface MarketStateLiveMarketDataReadPort {
  getCurrentMarketSnapshots(
    query: MarketStateLiveMarketDataReadQuery,
  ): readonly MarketSnapshotInput[];
  getExchangeMetadata(query: MarketStateLiveMarketDataReadQuery): readonly ExchangeMetadataInput[];
  getSymbolState(query: MarketStateLiveMarketDataReadQuery): SymbolStateBundle;
}

export interface MarketStateQualificationConsumerPort {
  getLifecycleStatus(query: MarketStateTargetReadQuery): QualificationLifecycleInput | null;
  getConfidence(query: MarketStateTargetReadQuery): QualificationConfidenceInput | null;
  getHealth(query: MarketStateTargetReadQuery): QualificationHealthInput | null;
  getQualificationSummary(query: MarketStateTargetReadQuery): QualificationSummaryInput | null;
}

export interface MarketStateProfileConsumerPort {
  getLatestProfile(query: MarketStateTargetReadQuery): ProfileLatestInput | null;
  getProfileHistory(query: MarketStateTargetReadQuery): readonly ProfileVersionMetadataInput[];
  getProfileVersionMetadata(
    query: MarketStateProfileVersionReadQuery,
  ): ProfileVersionMetadataInput | null;
}

export type MarketStateConsumerReadQuery = Readonly<{
  workspaceId: string;
  exchangeScopeId: string;
  marketSymbol: string;
  marketStateId?: string;
  limit?: number;
}>;

/**
 * Epic 6 — Read-only façade for Reporting / AI / Command Center.
 */
export interface MarketStateConsumerReadPort {
  getCurrentStateProjection(query: MarketStateConsumerReadQuery): MarketStateProjection | null;
  listRecentTransitions(
    query: MarketStateConsumerReadQuery,
  ): readonly MarketStateTransitionProjection[];
}

/** Epic 6 posture — consumer-read active; classify/query still inactive. */
export const MARKET_STATE_PORTS_ACTIVE = Object.freeze({
  marketStateService: false,
  marketStateQuery: false,
  liveMarketDataConsumer: true,
  qualificationConsumer: true,
  profileConsumer: true,
  consumerRead: true,
  persistence: true,
  rest: false,
} as const);
