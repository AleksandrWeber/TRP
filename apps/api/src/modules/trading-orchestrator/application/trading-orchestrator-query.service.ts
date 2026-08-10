/**
 * RC-26 Epic 5 — TradingOrchestratorQueryPort Nest adapter.
 */

import { Inject, Injectable } from '@nestjs/common';
import { OrchestrationCoordinationStore } from './orchestration-coordination.store';
import type {
  GetOrchestrationRun,
  GetSelectionDecision,
  GetSessionHandoffIntent,
  ListOrchestrationRuns,
  OrchestrationRunView,
  SelectionDecisionView,
  SessionHandoffIntentView,
  TradingOrchestratorQueryPort,
} from '../ports/trading-orchestrator.port';

@Injectable()
export class TradingOrchestratorQueryService implements TradingOrchestratorQueryPort {
  constructor(
    @Inject(OrchestrationCoordinationStore)
    private readonly store: OrchestrationCoordinationStore,
  ) {}

  getOrchestrationRun(query: GetOrchestrationRun): OrchestrationRunView | null {
    const run = this.store.getRun(query.orchestrationRunId);
    if (!run || run.workspaceId !== query.workspaceId) return null;
    return toRunView(run);
  }

  listOrchestrationRuns(query: ListOrchestrationRuns): readonly OrchestrationRunView[] {
    let rows = this.store.listRuns(query.workspaceId);
    if (query.exchangeScopeId) {
      rows = rows.filter((r) => r.exchangeScopeId === query.exchangeScopeId);
    }
    if (query.marketSymbol) {
      rows = rows.filter((r) => r.marketSymbol === query.marketSymbol);
    }
    const limit = query.limit ?? 50;
    return Object.freeze(rows.slice(0, limit).map(toRunView));
  }

  getSelectionDecision(query: GetSelectionDecision): SelectionDecisionView | null {
    const selection = this.store.getSelection(query.selectionDecisionId);
    if (!selection || selection.workspaceId !== query.workspaceId) return null;
    return Object.freeze({
      selectionDecisionId: selection.selectionDecisionId,
      orchestrationRunId: selection.orchestrationRunId,
      workspaceId: selection.workspaceId,
      libraryEntryId: selection.libraryEntryId,
      strategyVersionId: selection.strategyVersionId,
      envelopeVersion: selection.envelopeVersion,
      tacticPoint: selection.tacticPoint,
      selectedAt: selection.selectedAt,
      authorityClass: 'orchestration_artifact' as const,
      forcesTrade: false as const,
      inventsStrategy: false as const,
    });
  }

  getSessionHandoffIntent(query: GetSessionHandoffIntent): SessionHandoffIntentView | null {
    const intent = this.store.getHandoff(query.sessionHandoffIntentId);
    if (!intent || intent.workspaceId !== query.workspaceId) return null;
    return Object.freeze({
      sessionHandoffIntentId: intent.sessionHandoffIntentId,
      orchestrationRunId: intent.orchestrationRunId,
      selectionDecisionId: intent.selectionDecisionId,
      workspaceId: intent.workspaceId,
      deploymentBindRef: intent.deploymentBindRef,
      enforcementDecisionRef: intent.enforcementDecisionRef,
      status: intent.status,
      proposedAt: intent.proposedAt,
      authorityClass: 'orchestration_artifact' as const,
      isOrder: false as const,
      isRiskDecision: false as const,
      createsSession: false as const,
    });
  }
}

function toRunView(run: {
  orchestrationRunId: string;
  workspaceId: string;
  exchangeScopeId: string;
  marketSymbol: string;
  modeContext: 'lab' | 'paper' | 'live';
  status: string;
  marketStateId: string;
  selectionDecisionId?: string;
  sessionHandoffIntentId?: string;
  requiresConfirmation: boolean;
  createdAt: string;
  updatedAt: string;
}): OrchestrationRunView {
  return Object.freeze({
    orchestrationRunId: run.orchestrationRunId,
    workspaceId: run.workspaceId,
    exchangeScopeId: run.exchangeScopeId,
    marketSymbol: run.marketSymbol,
    modeContext: run.modeContext,
    status: run.status,
    marketStateId: run.marketStateId,
    ...(run.selectionDecisionId !== undefined
      ? { selectionDecisionId: run.selectionDecisionId }
      : {}),
    ...(run.sessionHandoffIntentId !== undefined
      ? { sessionHandoffIntentId: run.sessionHandoffIntentId }
      : {}),
    requiresConfirmation: run.requiresConfirmation,
    createdAt: run.createdAt,
    updatedAt: run.updatedAt,
    authorityClass: 'orchestration_artifact' as const,
    forcesTrade: false as const,
    approvesRisk: false as const,
    submitsOrders: false as const,
  });
}
