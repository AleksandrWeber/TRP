/**
 * RC-25 Epic 6 — Profile consumer read adapter.
 *
 * Maps QueryPort views → immutable consumer projections.
 * Never mutates Profile versions.
 */

import { Inject, Injectable } from '@nestjs/common';
import {
  type MarketProfileConsumerProjection,
  type ProfileVersionMetadataProjection,
} from '../domain/market-profile-consumer-read-model';
import type {
  MarketProfileConsumerReadPort,
  ProfileConsumerTargetQuery,
  ProfileConsumerVersionQuery,
} from '../ports/market-profile-consumer.port';
import {
  MARKET_PROFILE_QUERY_PORT,
  type MarketProfileQueryPort,
} from '../ports/market-profile.port';

const CONSUMER_FLAGS = Object.freeze({
  authorityClass: 'research_artifact' as const,
  forcesTrade: false as const,
  authorizesSession: false as const,
  mutable: false as const,
  consumerWritable: false as const,
});

@Injectable()
export class MarketProfileConsumerReadAdapter implements MarketProfileConsumerReadPort {
  constructor(
    @Inject(MARKET_PROFILE_QUERY_PORT)
    private readonly query: MarketProfileQueryPort,
  ) {}

  getLatestProfileProjection(
    query: ProfileConsumerTargetQuery,
  ): MarketProfileConsumerProjection | null {
    const profile = this.query.getLatestProfile(query);
    if (!profile) return null;
    return toProfileProjection(profile);
  }

  getProfileHistory(
    query: ProfileConsumerTargetQuery,
  ): readonly ProfileVersionMetadataProjection[] {
    return Object.freeze(
      this.query.listProfileVersions(query).map((summary) =>
        Object.freeze({
          marketProfileId: summary.marketProfileId,
          workspaceId: summary.workspaceId,
          targetId: summary.targetId,
          exchangeScopeId: summary.exchangeScopeId,
          marketSymbol: summary.marketSymbol,
          version: summary.version,
          qualificationRunId: summary.qualificationRunId,
          publishedAt: summary.publishedAt,
          ...CONSUMER_FLAGS,
        }),
      ),
    );
  }

  getProfileVersionMetadata(
    query: ProfileConsumerVersionQuery,
  ): ProfileVersionMetadataProjection | null {
    const profile = this.query.getProfileByVersion(query);
    if (!profile) return null;
    return Object.freeze({
      marketProfileId: profile.marketProfileId,
      workspaceId: profile.workspaceId,
      targetId: profile.targetId,
      exchangeScopeId: profile.exchangeScopeId,
      marketSymbol: profile.marketSymbol,
      version: profile.version,
      qualificationRunId: profile.qualificationRunId,
      publishedAt: profile.publishedAt,
      ...CONSUMER_FLAGS,
    });
  }
}

function toProfileProjection(
  profile: NonNullable<ReturnType<MarketProfileQueryPort['getLatestProfile']>>,
): MarketProfileConsumerProjection {
  return Object.freeze({
    marketProfileId: profile.marketProfileId,
    workspaceId: profile.workspaceId,
    targetId: profile.targetId,
    exchangeScopeId: profile.exchangeScopeId,
    marketSymbol: profile.marketSymbol,
    version: profile.version,
    qualificationRunId: profile.qualificationRunId,
    dimensions: Object.freeze({
      volatilityRegime: profile.volatility.regimeLabel,
      liquidityRegime: profile.liquidity.regimeLabel,
      trendRegime: profile.trend.regimeLabel,
      structureCharacteristicCount: profile.structure.characteristics.length,
    }),
    confidenceLevel: profile.confidenceSummary.level,
    publishedAt: profile.publishedAt,
    ...CONSUMER_FLAGS,
  });
}
