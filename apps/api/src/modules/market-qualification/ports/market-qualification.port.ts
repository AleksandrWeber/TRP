/**
 * RC-25 Epic 4 — Market Qualification application ports.
 *
 * Contract: docs/project/rc-25-api-contract.md §§4–5, §8
 *
 * Epic 4: lifecycle service + query ports active.
 * No evaluation algorithms. No confidence/profile calculation.
 */

import type { MarketConfidence } from '../domain/market-confidence';
import type { MarketHealth } from '../domain/market-health';
import type {
  ConnectivityHealthView,
  ExchangeMetadataSlice,
  HistoricalCharacteristicSlice,
  LiveMarketDataReadQuery,
  MarketObservationSlice,
  ResearchOutputReadQuery,
  ResearchOutputRef,
} from '../domain/market-qualification-observational-read-model';
import type { QualificationRun } from '../domain/qualification-run';
import type { QualificationState } from '../domain/qualification-state';
import type { QualificationTarget } from '../domain/qualification-target';
import type { CreateMarketConfidenceInput } from '../domain/market-confidence';
import type { CreateMarketHealthInput } from '../domain/market-health';

/** Nest injection token for MarketQualificationServicePort (Epic 4+). */
export const MARKET_QUALIFICATION_SERVICE_PORT = Symbol('MARKET_QUALIFICATION_SERVICE_PORT');

/** Nest injection token for MarketQualificationQueryPort (Epic 4+). */
export const MARKET_QUALIFICATION_QUERY_PORT = Symbol('MARKET_QUALIFICATION_QUERY_PORT');

/** Live Market Data consumer token (Epic 2+). */
export const LIVE_MARKET_DATA_READ_CONSUMER = Symbol('LIVE_MARKET_DATA_READ_CONSUMER');

/** Approved Research output consumer token (Epic 2+). */
export const RESEARCH_OUTPUT_READ_CONSUMER = Symbol('RESEARCH_OUTPUT_READ_CONSUMER');

export type RequestQualificationRun = Readonly<{
  workspaceId: string;
  exchangeScopeId: string;
  marketSymbol: string;
  modeContext: string;
  requestedBy: string;
  requestedAt?: string;
  notes?: string;
  qualificationRunId?: string;
}>;

export type ConfirmQualificationRun = Readonly<{
  workspaceId: string;
  qualificationRunId: string;
  confirmedBy: string;
  confirmedAt?: string;
}>;

export type CancelQualificationRun = Readonly<{
  workspaceId: string;
  qualificationRunId: string;
  cancelledBy?: string;
  cancelledAt?: string;
  reasons?: readonly string[];
}>;

export type CompleteQualificationRun = Readonly<{
  workspaceId: string;
  qualificationRunId: string;
  completedAt?: string;
  /**
   * Optional caller-supplied snapshots only (Epic 4 does not calculate these).
   * Structure validated via domain factories when present.
   */
  confidence?: Omit<CreateMarketConfidenceInput, 'targetId' | 'workspaceId' | 'sourceRunId'>;
  health?: Omit<CreateMarketHealthInput, 'targetId' | 'workspaceId' | 'sourceRunId'>;
}>;

export type FailQualificationRun = Readonly<{
  workspaceId: string;
  qualificationRunId: string;
  failedAt?: string;
  reasons: readonly string[];
}>;

export type QualificationRunResult = Readonly<{
  outcome: 'accepted' | 'running' | 'completed' | 'failed' | 'rejected' | 'cancelled';
  qualificationRunId: string;
  qualificationState: QualificationState | null;
  marketConfidence?: MarketConfidence;
  marketHealth?: MarketHealth;
  publishedProfileId?: string;
  rejectionReasons?: readonly string[];
  forcesTrade: false;
  authorizesSession: false;
}>;

export type GetQualificationTarget = Readonly<{
  workspaceId: string;
  exchangeScopeId: string;
  marketSymbol: string;
}>;

export type GetQualificationState = Readonly<{
  workspaceId: string;
  exchangeScopeId: string;
  marketSymbol: string;
}>;

export type GetMarketConfidence = Readonly<{
  workspaceId: string;
  exchangeScopeId: string;
  marketSymbol: string;
}>;

export type GetMarketHealth = Readonly<{
  workspaceId: string;
  exchangeScopeId: string;
  marketSymbol: string;
}>;

export type ListQualificationTargets = Readonly<{
  workspaceId: string;
}>;

export type ListQualificationRuns = Readonly<{
  workspaceId: string;
  exchangeScopeId?: string;
  marketSymbol?: string;
  targetId?: string;
}>;

export type GetQualificationRun = Readonly<{
  workspaceId: string;
  qualificationRunId: string;
}>;

export type QualificationAuthorityFlags = Readonly<{
  authorityClass: 'research_artifact';
  forcesTrade: false;
  authorizesSession: false;
}>;

export type QualificationTargetView = QualificationTarget & QualificationAuthorityFlags;
export type QualificationStateView = QualificationState & QualificationAuthorityFlags;
export type MarketConfidenceView = MarketConfidence & QualificationAuthorityFlags;
export type MarketHealthView = MarketHealth & {
  authorityClass: 'research_artifact';
  forcesTrade: false;
  authorizesSession: false;
};
export type QualificationRunView = QualificationRun & QualificationAuthorityFlags;
export type QualificationRunSummary = Readonly<{
  qualificationRunId: string;
  workspaceId: string;
  targetId: string;
  status: string;
  modeContext: string;
  createdAt: string;
  authorityClass: 'research_artifact';
  forcesTrade: false;
  authorizesSession: false;
}>;

/**
 * Market Qualification service port (API Contract §4).
 * Lifecycle management only — never scores / selects / authorizes trading.
 */
export interface MarketQualificationServicePort {
  requestQualificationRun(cmd: RequestQualificationRun): QualificationRunResult;
  confirmQualificationRun(cmd: ConfirmQualificationRun): QualificationRunResult;
  cancelQualificationRun(cmd: CancelQualificationRun): QualificationRunResult;
  completeQualificationRun(cmd: CompleteQualificationRun): QualificationRunResult;
  failQualificationRun(cmd: FailQualificationRun): QualificationRunResult;
}

/**
 * Market Qualification query port (API Contract §5).
 */
export interface MarketQualificationQueryPort {
  getQualificationTarget(query: GetQualificationTarget): QualificationTargetView | null;
  getQualificationState(query: GetQualificationState): QualificationStateView | null;
  getMarketConfidence(query: GetMarketConfidence): MarketConfidenceView | null;
  getMarketHealth(query: GetMarketHealth): MarketHealthView | null;
  listQualificationTargets(query: ListQualificationTargets): readonly QualificationTargetView[];
  listQualificationRuns(query: ListQualificationRuns): readonly QualificationRunSummary[];
  getQualificationRun(query: GetQualificationRun): QualificationRunView | null;
}

/**
 * Live Market Data read consumer (API Contract §8.1).
 */
export interface LiveMarketDataReadPort {
  getConnectivityHealth(query: LiveMarketDataReadQuery): ConnectivityHealthView;
  getMarketObservations(query: LiveMarketDataReadQuery): readonly MarketObservationSlice[];
  getExchangeMetadata(query: LiveMarketDataReadQuery): readonly ExchangeMetadataSlice[];
  getHistoricalCharacteristics(
    query: LiveMarketDataReadQuery,
  ): readonly HistoricalCharacteristicSlice[];
}

/**
 * Approved Research output read consumer (API Contract §8.2).
 */
export interface ResearchOutputReadPort {
  getApprovedResearchOutputs(query: ResearchOutputReadQuery): readonly ResearchOutputRef[];
}

/** Epic 6 posture: lifecycle + query + consumer reads active; no REST/persistence product. */
export const MARKET_QUALIFICATION_PORTS_ACTIVE = Object.freeze({
  marketQualificationService: true,
  marketQualificationQuery: true,
  liveMarketDataConsumer: true,
  researchOutputConsumer: true,
  consumerRead: true,
  persistence: true,
  rest: false,
} as const);
