/**
 * RC-25 Epic 6 — Market Qualification consumer read port.
 *
 * Read-only façade for future Orchestrator / Reporting / AI.
 * No commands. No callbacks. No mutations.
 */

import type {
  MarketConfidenceProjection,
  MarketHealthProjection,
  QualificationConsumerSummary,
  QualificationLifecycleStatusProjection,
} from '../domain/market-qualification-consumer-read-model';

export const MARKET_QUALIFICATION_CONSUMER_READ_PORT = Symbol(
  'MARKET_QUALIFICATION_CONSUMER_READ_PORT',
);

export type QualificationConsumerTargetQuery = Readonly<{
  workspaceId: string;
  exchangeScopeId: string;
  marketSymbol: string;
}>;

/**
 * Consumer read port — projections only.
 * Does not expose lifecycle commands or evaluation.
 */
export interface MarketQualificationConsumerReadPort {
  getLifecycleStatus(
    query: QualificationConsumerTargetQuery,
  ): QualificationLifecycleStatusProjection | null;
  getConfidenceProjection(
    query: QualificationConsumerTargetQuery,
  ): MarketConfidenceProjection | null;
  getHealthProjection(query: QualificationConsumerTargetQuery): MarketHealthProjection | null;
  getQualificationSummary(
    query: QualificationConsumerTargetQuery,
  ): QualificationConsumerSummary | null;
}
