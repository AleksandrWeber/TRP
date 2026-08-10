/**
 * RC-25 Epic 6 — Market Profile consumer read port.
 *
 * Read-only façade for future Orchestrator / Reporting / AI.
 * No commands. No callbacks. No mutations.
 */

import type {
  MarketProfileConsumerProjection,
  ProfileVersionMetadataProjection,
} from '../domain/market-profile-consumer-read-model';

export const MARKET_PROFILE_CONSUMER_READ_PORT = Symbol('MARKET_PROFILE_CONSUMER_READ_PORT');

export type ProfileConsumerTargetQuery = Readonly<{
  workspaceId: string;
  exchangeScopeId: string;
  marketSymbol: string;
}>;

export type ProfileConsumerVersionQuery = ProfileConsumerTargetQuery &
  Readonly<{
    version: number;
  }>;

/**
 * Consumer read port — projections only.
 * Does not expose publish commands or calculation.
 */
export interface MarketProfileConsumerReadPort {
  getLatestProfileProjection(
    query: ProfileConsumerTargetQuery,
  ): MarketProfileConsumerProjection | null;
  getProfileHistory(query: ProfileConsumerTargetQuery): readonly ProfileVersionMetadataProjection[];
  getProfileVersionMetadata(
    query: ProfileConsumerVersionQuery,
  ): ProfileVersionMetadataProjection | null;
}
