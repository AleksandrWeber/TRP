/**
 * PC-10 — product adapter over existing Market State query/refresh surfaces.
 *
 * Delegates reads to the owner projection store and observational consumers.
 * Does not classify markets, select strategies, or redesign Orchestrator.
 */

import { Injectable } from '@nestjs/common';
import { publishNextMarketState } from '../market-state/domain/market-state';
import type { MarketState } from '../market-state/domain/market-state';
import { MarketStateProjectionStore } from '../market-state/domain/market-state-projection.store';
import { MarketStateObservationalReadService } from '../market-state/market-state-observational-read.service';
import {
  deriveMarketStateTargetId,
  toCurrentPageView,
  toDetailView,
  toLifecycleView,
  toListItemView,
  toMetadataView,
  toProfileReferenceView,
  toQualificationReferenceView,
  toRefreshView,
  toTargetDetailView,
  toTransitionPageView,
  toTransitionView,
  toVersionListItemView,
  toVersionPageView,
  toWorkspaceView,
  type MarketStateDetailView,
  type MarketStateLifecycleView,
  type MarketStateListItemView,
  type MarketStateMetadataView,
  type MarketStatePageView,
  type MarketStateProfileReferenceView,
  type MarketStateQualificationReferenceView,
  type MarketStateRefreshView,
  type MarketStateTargetDetailView,
  type MarketStateTransitionPageView,
  type MarketStateVersionListItemView,
  type MarketStateVersionPageView,
  type MarketStateWorkspaceView,
} from './market-state.view';

@Injectable()
export class MarketStateProductService {
  constructor(
    private readonly store: MarketStateProjectionStore,
    private readonly observational: MarketStateObservationalReadService,
  ) {}

  getWorkspace(workspaceId: string): MarketStateWorkspaceView {
    const versions = this.listVersionItems(workspaceId);
    const current = this.listCurrentItems(workspaceId, versions);
    return toWorkspaceView({
      workspaceId,
      current,
      recentVersions: [...versions].slice().reverse(),
      versionCount: versions.length,
    });
  }

  listCurrent(workspaceId: string): MarketStatePageView {
    return toCurrentPageView(this.listCurrentItems(workspaceId));
  }

  listHistory(workspaceId: string, targetId?: string): MarketStateVersionPageView {
    const scoped = targetId ? this.scopeFor(workspaceId, targetId) : null;
    if (targetId && !scoped) return toVersionPageView([]);
    const items = this.listVersionItems(
      workspaceId,
      scoped
        ? { exchangeScopeId: scoped.exchangeScopeId, marketSymbol: scoped.marketSymbol }
        : undefined,
    )
      .slice()
      .reverse();
    return toVersionPageView(items);
  }

  getTarget(workspaceId: string, targetId: string): MarketStateTargetDetailView | null {
    const current = this.getCurrent(workspaceId, targetId);
    if (!current) return null;
    return toTargetDetailView({
      current,
      versions: current.versions,
      transitions: current.transitions,
    });
  }

  getCurrent(workspaceId: string, targetId: string): MarketStateDetailView | null {
    const scoped = this.scopeFor(workspaceId, targetId);
    if (!scoped) return null;
    const state = this.store.getCurrent(scoped);
    if (!state) return null;
    return this.detailFor(state);
  }

  getVersion(workspaceId: string, targetId: string, version: number): MarketStateDetailView | null {
    const scoped = this.scopeFor(workspaceId, targetId);
    if (!scoped) return null;
    const state = this.store.getByVersion({ ...scoped, version });
    if (!state) return null;
    return this.detailFor(state);
  }

  getLifecycle(workspaceId: string, targetId: string): MarketStateLifecycleView | null {
    return this.getCurrent(workspaceId, targetId)?.lifecycle ?? null;
  }

  getMetadata(
    workspaceId: string,
    targetId: string,
    version: number,
  ): MarketStateMetadataView | null {
    return this.getVersion(workspaceId, targetId, version)?.metadata ?? null;
  }

  listTransitions(workspaceId: string, targetId: string): MarketStateTransitionPageView | null {
    const scoped = this.scopeFor(workspaceId, targetId);
    if (!scoped) return null;
    const items = this.store.listTransitions(scoped).map(toTransitionView);
    return toTransitionPageView(items);
  }

  getQualification(
    workspaceId: string,
    targetId: string,
  ): MarketStateQualificationReferenceView | null {
    return this.getCurrent(workspaceId, targetId)?.qualification ?? null;
  }

  getProfile(workspaceId: string, targetId: string): MarketStateProfileReferenceView | null {
    return this.getCurrent(workspaceId, targetId)?.profile ?? null;
  }

  refresh(
    workspaceId: string,
    targetId: string,
    requestedBy: string,
    notes?: string,
  ): MarketStateRefreshView | null {
    const scoped = this.scopeFor(workspaceId, targetId);
    if (!scoped) return null;
    const current = this.store.getCurrent(scoped);
    if (!current) return null;
    const history = this.store.listHistory(scoped);
    const nextVersion = current.version.version + 1;
    const publishedAt = new Date().toISOString();
    const refs = this.observationalRefs(scoped);
    const published = publishNextMarketState({
      history,
      next: {
        marketStateId: `${deriveMarketStateTargetId(
          current.workspaceId,
          current.exchangeScopeId,
          current.marketSymbol,
        )}:v${nextVersion}`,
        workspaceId: current.workspaceId,
        exchangeScopeId: current.exchangeScopeId,
        marketSymbol: current.marketSymbol,
        versionNumber: nextVersion,
        publishedAt,
        publishedBy: requestedBy,
        snapshot: {
          regime: current.snapshot.regime,
          ...(current.snapshot.volatilityClass
            ? { volatilityClass: current.snapshot.volatilityClass }
            : {}),
          ...(current.snapshot.liquidityClass
            ? { liquidityClass: current.snapshot.liquidityClass }
            : {}),
          narrativeSummary: current.snapshot.narrativeSummary,
        },
        metadata: {
          observationAsOf: publishedAt,
          ...(refs.confidenceRef ? { confidenceRef: refs.confidenceRef } : {}),
          ...(refs.profileRef ? { profileRef: refs.profileRef } : {}),
          inputSummary: refs.inputSummary,
          notes:
            notes?.trim() || 'operator refresh — snapshot unchanged, observational refs updated',
        },
      },
    });
    this.store.seed(published.next, published.previous);
    const detail = this.detailFor(published.next);
    return toRefreshView(detail);
  }

  private listCurrentItems(
    workspaceId: string,
    versions = this.listVersionItems(workspaceId),
  ): readonly MarketStateListItemView[] {
    return this.store.listCurrent(workspaceId).map((state) => {
      const versionCount = versions.filter(
        (row) =>
          row.exchangeScopeId === state.exchangeScopeId && row.marketSymbol === state.marketSymbol,
      ).length;
      return toListItemView({ current: state, versionCount });
    });
  }

  private listVersionItems(
    workspaceId: string,
    target?: { exchangeScopeId: string; marketSymbol: string },
  ): readonly MarketStateVersionListItemView[] {
    const history = this.store.listHistory({
      workspaceId,
      ...(target ?? {}),
    });
    const currentByTarget = new Map<string, number>();
    for (const state of this.store.listCurrent(workspaceId)) {
      currentByTarget.set(`${state.exchangeScopeId}|${state.marketSymbol}`, state.version.version);
    }
    return history.map((state) =>
      toVersionListItemView({
        state,
        currentVersion:
          currentByTarget.get(`${state.exchangeScopeId}|${state.marketSymbol}`) ??
          state.version.version,
      }),
    );
  }

  private scopeFor(workspaceId: string, targetId: string) {
    const match = this.store.listWorkspace(workspaceId).find((row) => {
      return (
        deriveMarketStateTargetId(row.workspaceId, row.exchangeScopeId, row.marketSymbol) ===
        targetId
      );
    });
    if (!match) return null;
    return {
      workspaceId,
      exchangeScopeId: match.exchangeScopeId,
      marketSymbol: match.marketSymbol,
    };
  }

  private detailFor(state: MarketState): MarketStateDetailView {
    const scoped = {
      workspaceId: state.workspaceId,
      exchangeScopeId: state.exchangeScopeId,
      marketSymbol: state.marketSymbol,
    };
    const history = this.store.listHistory(scoped);
    const current = this.store.getCurrent(scoped);
    const currentVersion = current?.version.version ?? state.version.version;
    const versions = history.map((row) => toVersionListItemView({ state: row, currentVersion }));
    const transitions = this.store.listTransitions(scoped).map(toTransitionView);
    const refs = this.observationalRefs(scoped);
    return toDetailView({
      state,
      currentVersion,
      versions,
      transitions,
      qualification: refs.qualification,
      profile: refs.profile,
    });
  }

  private observationalRefs(scoped: {
    workspaceId: string;
    exchangeScopeId: string;
    marketSymbol: string;
  }) {
    const qualification = toQualificationReferenceView(
      this.observational.getQualificationSummary(scoped),
    );
    const profile = toProfileReferenceView(this.observational.getLatestProfile(scoped));
    const confidenceRef = qualification.sourceRunId;
    const profileRef = profile.marketProfileId;
    const parts = [
      qualification.present
        ? `qualification ${qualification.lifecycleState ?? 'observed'}`
        : 'qualification absent',
      profile.present ? `profile v${profile.version}` : 'profile absent',
    ];
    return {
      qualification,
      profile,
      confidenceRef,
      profileRef,
      inputSummary: parts.join('; '),
    };
  }
}
