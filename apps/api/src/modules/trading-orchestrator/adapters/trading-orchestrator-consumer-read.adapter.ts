/**
 * RC-26 Epic 6 — Trading Orchestrator consumer read adapter.
 *
 * Maps coordination store → immutable consumer projections.
 * Read-only. No commands. No callbacks. No Session ownership.
 */

import { Inject, Injectable } from '@nestjs/common';
import { OrchestrationCoordinationStore } from '../application/orchestration-coordination.store';
import {
  TRADING_ORCHESTRATOR_CONSUMER_FLAGS,
  type OrchestrationSummaryProjection,
  type SelectionDecisionProjection,
  type SessionHandoffIntentProjection,
} from '../domain/trading-orchestrator-consumer-read-model';
import type { TradingOrchestratorConsumerReadPort } from '../ports/trading-orchestrator.port';

export type OrchestratorConsumerRunQuery = Readonly<{
  workspaceId: string;
  orchestrationRunId: string;
}>;

export type OrchestratorConsumerSelectionQuery = Readonly<{
  workspaceId: string;
  selectionDecisionId: string;
}>;

export type OrchestratorConsumerHandoffQuery = Readonly<{
  workspaceId: string;
  sessionHandoffIntentId: string;
}>;

@Injectable()
export class TradingOrchestratorConsumerReadAdapter implements TradingOrchestratorConsumerReadPort {
  constructor(
    @Inject(OrchestrationCoordinationStore)
    private readonly store: OrchestrationCoordinationStore,
  ) {}

  getOrchestrationSummary(
    query: OrchestratorConsumerRunQuery,
  ): OrchestrationSummaryProjection | null {
    const run = this.store.getRun(query.orchestrationRunId);
    if (!run || run.workspaceId !== query.workspaceId) return null;

    const handoff = run.sessionHandoffIntentId
      ? this.store.getHandoff(run.sessionHandoffIntentId)
      : undefined;

    return Object.freeze({
      orchestrationRunId: run.orchestrationRunId,
      workspaceId: run.workspaceId,
      exchangeScopeId: run.exchangeScopeId,
      marketSymbol: run.marketSymbol,
      modeContext: run.modeContext,
      status: run.status,
      marketStateId: run.marketStateId,
      ...(run.objective !== undefined ? { intentObjective: run.objective } : {}),
      requiresConfirmation: run.requiresConfirmation,
      ...(run.selectionDecisionId !== undefined
        ? { selectionDecisionId: run.selectionDecisionId }
        : {}),
      ...(run.sessionHandoffIntentId !== undefined
        ? { sessionHandoffIntentId: run.sessionHandoffIntentId }
        : {}),
      ...(handoff ? { handoffStatus: handoff.status } : {}),
      createdAt: run.createdAt,
      updatedAt: run.updatedAt,
      ...TRADING_ORCHESTRATOR_CONSUMER_FLAGS,
    });
  }

  getLatestSelectionProjection(
    query: OrchestratorConsumerSelectionQuery,
  ): SelectionDecisionProjection | null {
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
      mutable: false as const,
      consumerWritable: false as const,
    });
  }

  getHandoffIntentProjection(
    query: OrchestratorConsumerHandoffQuery,
  ): SessionHandoffIntentProjection | null {
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
      mutable: false as const,
      consumerWritable: false as const,
    });
  }
}
