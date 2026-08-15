/**
 * PC-09 — product adapter over existing Market Profile query ports.
 *
 * Delegates reads. Does not own profile versions.
 * Does not publish, calculate dimensions, score markets, or redesign Qualification / Market State.
 */

import { Inject, Injectable } from '@nestjs/common';
import {
  MARKET_PROFILE_QUERY_PORT,
  type MarketProfileQueryPort,
  type MarketProfileSummary,
  type MarketProfileView,
} from '../market-profile/ports/market-profile.port';
import {
  toCompareView,
  toDetailView,
  toListItemView,
  toProfilePageView,
  toTargetDetailView,
  toVersionListItemView,
  toVersionPageView,
  toWorkspaceView,
  type MarketProfileCompareView,
  type MarketProfileDetailView,
  type MarketProfileDimensionsView,
  type MarketProfileListItemView,
  type MarketProfileMetadataView,
  type MarketProfilePageView,
  type MarketProfilePublishedSourceView,
  type MarketProfileTargetDetailView,
  type MarketProfileVersionListItemView,
  type MarketProfileVersionPageView,
  type MarketProfileWorkspaceView,
} from './market-profile.view';

@Injectable()
export class MarketProfileProductService {
  constructor(
    @Inject(MARKET_PROFILE_QUERY_PORT)
    private readonly query: MarketProfileQueryPort,
  ) {}

  getWorkspace(workspaceId: string): MarketProfileWorkspaceView {
    const versions = this.listVersionItems(workspaceId);
    const latest = this.listLatestItems(workspaceId, versions);
    return toWorkspaceView({
      workspaceId,
      latest,
      recentVersions: [...versions].slice().reverse(),
      versionCount: versions.length,
    });
  }

  listLatest(workspaceId: string): MarketProfilePageView {
    return toProfilePageView(this.listLatestItems(workspaceId));
  }

  listHistory(workspaceId: string, targetId?: string): MarketProfileVersionPageView {
    const items = this.listVersionItems(workspaceId, targetId).slice().reverse();
    return toVersionPageView(items);
  }

  getTarget(workspaceId: string, targetId: string): MarketProfileTargetDetailView | null {
    const latest = this.getLatest(workspaceId, targetId);
    if (!latest) return null;
    return toTargetDetailView({ latest, versions: latest.versions });
  }

  getLatest(workspaceId: string, targetId: string): MarketProfileDetailView | null {
    const scoped = this.scopeFor(workspaceId, targetId);
    if (!scoped) return null;
    const profile = this.query.getLatestProfile(scoped);
    if (!profile) return null;
    return this.detailFor(profile);
  }

  getVersion(
    workspaceId: string,
    targetId: string,
    version: number,
  ): MarketProfileDetailView | null {
    const scoped = this.scopeFor(workspaceId, targetId);
    if (!scoped) return null;
    const profile = this.query.getProfileByVersion({ ...scoped, version });
    if (!profile) return null;
    return this.detailFor(profile);
  }

  getMetadata(
    workspaceId: string,
    targetId: string,
    version: number,
  ): MarketProfileMetadataView | null {
    return this.getVersion(workspaceId, targetId, version)?.metadata ?? null;
  }

  getDimensions(
    workspaceId: string,
    targetId: string,
    version: number,
  ): MarketProfileDimensionsView | null {
    return this.getVersion(workspaceId, targetId, version)?.dimensions ?? null;
  }

  getPublishedSource(
    workspaceId: string,
    targetId: string,
    version?: number,
  ): MarketProfilePublishedSourceView | null {
    const detail =
      version !== undefined
        ? this.getVersion(workspaceId, targetId, version)
        : this.getLatest(workspaceId, targetId);
    return detail?.publishedSource ?? null;
  }

  compare(
    workspaceId: string,
    targetId: string,
    fromVersion: number,
    toVersion: number,
  ): MarketProfileCompareView | null {
    const scoped = this.scopeFor(workspaceId, targetId);
    if (!scoped) return null;
    const from = this.query.getProfileByVersion({ ...scoped, version: fromVersion });
    const to = this.query.getProfileByVersion({ ...scoped, version: toVersion });
    if (!from || !to) return null;
    return toCompareView({ from, to });
  }

  private listLatestItems(
    workspaceId: string,
    versions = this.listVersionItems(workspaceId),
  ): readonly MarketProfileListItemView[] {
    const latestByTarget = new Map<string, MarketProfileVersionListItemView>();
    for (const item of versions) {
      const current = latestByTarget.get(item.targetId);
      if (!current || item.version > current.version) {
        latestByTarget.set(item.targetId, item);
      }
    }
    return [...latestByTarget.values()]
      .sort((left, right) => right.publishedAt.localeCompare(left.publishedAt))
      .map((item) => {
        const profile = this.query.getLatestProfile({
          workspaceId,
          exchangeScopeId: item.exchangeScopeId,
          marketSymbol: item.marketSymbol,
        });
        const versionCount = versions.filter((row) => row.targetId === item.targetId).length;
        return profile
          ? toListItemView({ latest: profile, versionCount })
          : toListItemFromVersion(item, versionCount);
      });
  }

  private listVersionItems(
    workspaceId: string,
    targetId?: string,
  ): readonly MarketProfileVersionListItemView[] {
    const summaries = this.query
      .listWorkspaceProfiles({ workspaceId })
      .filter((summary) => (targetId ? summary.targetId === targetId : true));
    const latestByTarget = latestVersionByTarget(summaries);
    return summaries.map((summary) => {
      const latestVersion = latestByTarget.get(summary.targetId) ?? summary.version;
      const profile = this.query.getProfileByVersion({
        workspaceId,
        exchangeScopeId: summary.exchangeScopeId,
        marketSymbol: summary.marketSymbol,
        version: summary.version,
      });
      return toVersionListItemView({
        summary,
        latestVersion,
        publishedBy: profile?.publishedBy ?? null,
        confidenceLevel: profile?.confidenceSummary.level ?? null,
      });
    });
  }

  private scopeFor(workspaceId: string, targetId: string) {
    const summary = this.query
      .listWorkspaceProfiles({ workspaceId })
      .find((item) => item.targetId === targetId);
    if (!summary) return null;
    return {
      workspaceId,
      exchangeScopeId: summary.exchangeScopeId,
      marketSymbol: summary.marketSymbol,
    };
  }

  private detailFor(profile: MarketProfileView): MarketProfileDetailView {
    const versions = this.query.listProfileVersions({
      workspaceId: profile.workspaceId,
      exchangeScopeId: profile.exchangeScopeId,
      marketSymbol: profile.marketSymbol,
    });
    const latestVersion = versions.at(-1)?.version ?? profile.version;
    const versionItems = versions.map((summary) => {
      const row =
        summary.version === profile.version
          ? profile
          : this.query.getProfileByVersion({
              workspaceId: profile.workspaceId,
              exchangeScopeId: profile.exchangeScopeId,
              marketSymbol: profile.marketSymbol,
              version: summary.version,
            });
      return toVersionListItemView({
        summary,
        latestVersion,
        publishedBy: row?.publishedBy ?? null,
        confidenceLevel: row?.confidenceSummary.level ?? null,
      });
    });
    return toDetailView({ profile, latestVersion, versions: versionItems });
  }
}

function latestVersionByTarget(summaries: readonly MarketProfileSummary[]): Map<string, number> {
  const latest = new Map<string, number>();
  for (const summary of summaries) {
    const current = latest.get(summary.targetId) ?? 0;
    if (summary.version > current) latest.set(summary.targetId, summary.version);
  }
  return latest;
}

function toListItemFromVersion(
  item: MarketProfileVersionListItemView,
  versionCount: number,
): MarketProfileListItemView {
  return Object.freeze({
    marketProfileId: item.marketProfileId,
    workspaceId: item.workspaceId,
    targetId: item.targetId,
    exchangeScopeId: item.exchangeScopeId,
    marketSymbol: item.marketSymbol,
    displayName: item.marketSymbol,
    version: item.version,
    versionCount,
    qualificationRunId: item.qualificationRunId,
    publishedAt: item.publishedAt,
    publishedBy: item.publishedBy,
    confidenceLevel: item.confidenceLevel,
    isLatest: true,
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
}
