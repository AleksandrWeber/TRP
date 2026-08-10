/**
 * RC-25 Epic 4 — Market Qualification query service.
 *
 * Read-only views of qualification artifacts.
 * Never authorizes trading. Never selects strategies.
 */

import { Inject, Injectable } from '@nestjs/common';
import { InMemoryQualificationStore } from './adapters/in-memory-qualification-store';
import { deriveQualificationTargetId } from './lifecycle/derive-qualification-ids';
import type {
  GetMarketConfidence,
  GetMarketHealth,
  GetQualificationRun,
  GetQualificationState,
  GetQualificationTarget,
  ListQualificationRuns,
  MarketConfidenceView,
  MarketHealthView,
  MarketQualificationQueryPort,
  QualificationRunSummary,
  QualificationRunView,
  QualificationStateView,
  QualificationTargetView,
} from './ports/market-qualification.port';

const FLAGS = Object.freeze({
  forcesTrade: false as const,
  authorizesSession: false as const,
});

@Injectable()
export class MarketQualificationQueryService implements MarketQualificationQueryPort {
  constructor(
    @Inject(InMemoryQualificationStore)
    private readonly store: InMemoryQualificationStore,
  ) {}

  getQualificationTarget(query: GetQualificationTarget): QualificationTargetView | null {
    const target = this.store.findTarget(
      query.workspaceId,
      query.exchangeScopeId,
      query.marketSymbol,
    );
    if (!target) return null;
    return Object.freeze({ ...target, ...FLAGS });
  }

  getQualificationState(query: GetQualificationState): QualificationStateView | null {
    const targetId = deriveQualificationTargetId(
      query.workspaceId,
      query.exchangeScopeId,
      query.marketSymbol,
    );
    const state = this.store.getState(targetId);
    if (!state || state.workspaceId !== query.workspaceId) return null;
    return Object.freeze({ ...state, ...FLAGS });
  }

  getMarketConfidence(query: GetMarketConfidence): MarketConfidenceView | null {
    const targetId = deriveQualificationTargetId(
      query.workspaceId,
      query.exchangeScopeId,
      query.marketSymbol,
    );
    const confidence = this.store.getConfidence(targetId);
    if (!confidence || confidence.workspaceId !== query.workspaceId) return null;
    return Object.freeze({ ...confidence, ...FLAGS });
  }

  getMarketHealth(query: GetMarketHealth): MarketHealthView | null {
    const targetId = deriveQualificationTargetId(
      query.workspaceId,
      query.exchangeScopeId,
      query.marketSymbol,
    );
    const health = this.store.getHealth(targetId);
    if (!health || health.workspaceId !== query.workspaceId) return null;
    return Object.freeze({
      ...health,
      forcesTrade: false as const,
      authorizesSession: false as const,
    });
  }

  listQualificationRuns(query: ListQualificationRuns): readonly QualificationRunSummary[] {
    let targetId = query.targetId;
    if (!targetId && query.exchangeScopeId && query.marketSymbol) {
      targetId = deriveQualificationTargetId(
        query.workspaceId,
        query.exchangeScopeId,
        query.marketSymbol,
      );
    }
    const runs = this.store.listRuns(query.workspaceId, targetId);
    return Object.freeze(
      runs.map((run) =>
        Object.freeze({
          qualificationRunId: run.qualificationRunId,
          workspaceId: run.workspaceId,
          targetId: run.targetId,
          status: run.status,
          modeContext: run.modeContext,
          createdAt: run.createdAt,
          authorityClass: 'research_artifact' as const,
          ...FLAGS,
        }),
      ),
    );
  }

  getQualificationRun(query: GetQualificationRun): QualificationRunView | null {
    const run = this.store.getRun(query.qualificationRunId);
    if (!run || run.workspaceId !== query.workspaceId) return null;
    return Object.freeze({ ...run, ...FLAGS });
  }
}
