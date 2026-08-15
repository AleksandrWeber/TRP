/**
 * RC-25 Epic 5 — Market Profile query service.
 *
 * Read-only historical profile version retrieval.
 * Never authorizes trading. Never selects strategies.
 */

import { Inject, Injectable } from '@nestjs/common';
import { deriveQualificationTargetId } from '../market-qualification';
import { InMemoryMarketProfileStore } from './adapters/in-memory-market-profile-store';
import type { MarketProfile } from './domain/market-profile';
import type {
  GetLatestMarketProfile,
  GetMarketProfileByVersion,
  ListMarketProfileVersions,
  ListWorkspaceMarketProfiles,
  MarketProfileQueryPort,
  MarketProfileSummary,
  MarketProfileView,
} from './ports/market-profile.port';

const FLAGS = Object.freeze({
  authorizesSession: false as const,
});

@Injectable()
export class MarketProfileQueryService implements MarketProfileQueryPort {
  constructor(
    @Inject(InMemoryMarketProfileStore)
    private readonly store: InMemoryMarketProfileStore,
  ) {}

  getLatestProfile(query: GetLatestMarketProfile): MarketProfileView | null {
    const targetId = deriveQualificationTargetId(
      query.workspaceId,
      query.exchangeScopeId,
      query.marketSymbol,
    );
    const profile = this.store.getLatest(targetId);
    if (!profile || profile.workspaceId !== query.workspaceId) return null;
    return Object.freeze({ ...profile, ...FLAGS });
  }

  getProfileByVersion(query: GetMarketProfileByVersion): MarketProfileView | null {
    if (!(query.version >= 1) || !Number.isInteger(query.version)) {
      return null;
    }
    const targetId = deriveQualificationTargetId(
      query.workspaceId,
      query.exchangeScopeId,
      query.marketSymbol,
    );
    const profile = this.store.getByVersion(targetId, query.version);
    if (!profile || profile.workspaceId !== query.workspaceId) return null;
    return Object.freeze({ ...profile, ...FLAGS });
  }

  listProfileVersions(query: ListMarketProfileVersions): readonly MarketProfileSummary[] {
    const targetId = deriveQualificationTargetId(
      query.workspaceId,
      query.exchangeScopeId,
      query.marketSymbol,
    );
    const profiles = this.store
      .listByTarget(targetId)
      .filter((p) => p.workspaceId === query.workspaceId);

    return Object.freeze(profiles.map((profile) => toSummary(profile)));
  }

  listWorkspaceProfiles(query: ListWorkspaceMarketProfiles): readonly MarketProfileSummary[] {
    return Object.freeze(
      this.store.listByWorkspace(query.workspaceId).map((profile) => toSummary(profile)),
    );
  }
}

function toSummary(profile: MarketProfile): MarketProfileSummary {
  return Object.freeze({
    marketProfileId: profile.marketProfileId,
    workspaceId: profile.workspaceId,
    targetId: profile.targetId,
    exchangeScopeId: profile.exchangeScopeId,
    marketSymbol: profile.marketSymbol,
    version: profile.version,
    qualificationRunId: profile.qualificationRunId,
    publishedAt: profile.publishedAt,
    authorityClass: 'research_artifact' as const,
    forcesTrade: false as const,
    authorizesSession: false as const,
  });
}
