/**
 * PC-11 — product adapter over existing Trading Orchestrator service/query ports.
 *
 * Delegates coordination commands. Stores plans with existing domain factories.
 * Seeds a consumer current-condition view when Market State product is absent.
 * Does not create Sessions, Orders, Execution, or Risk approvals.
 */

import { Inject, Injectable } from '@nestjs/common';
import { InMemoryOrchestratorMarketStateAdapter } from './adapters/in-memory-market-state.adapter';
import { OrchestrationCoordinationStore } from './application/orchestration-coordination.store';
import { publishNextOrchestrationPlan } from './domain/orchestration-plan';
import { OrchestrationRejectedError } from './orchestration-rejected.error';
import {
  TRADING_ORCHESTRATOR_QUERY_PORT,
  TRADING_ORCHESTRATOR_SERVICE_PORT,
  type CancelOrchestrationRun,
  type ConfirmOrchestrationRun,
  type EmitSessionHandoff,
  type OrchestrationCommandResult,
  type OrchestrationModeContextLabel,
  type ProposeSelection,
  type RequestOrchestrationRun,
  type SelectionDecisionView,
  type SessionHandoffIntentView,
  type TradingOrchestratorQueryPort,
  type TradingOrchestratorServicePort,
} from './ports/trading-orchestrator.port';
import {
  toOrchestrationPlanView,
  toOrchestrationRunView,
  type OrchestrationPlanView,
  type OrchestrationRunDetailView,
  type OrchestrationRunView,
} from './trading-orchestrator.view';

export type CreateOrchestrationPlanCommand = Readonly<{
  workspaceId: string;
  requestedBy: string;
  marketSymbol: string;
  exchangeScopeId?: string;
  modeContext?: OrchestrationModeContextLabel;
  objective: string;
  rationaleSummary?: string;
}>;

export type RequestOrchestrationRunCommand = Readonly<{
  workspaceId: string;
  requestedBy: string;
  marketSymbol: string;
  exchangeScopeId?: string;
  modeContext?: OrchestrationModeContextLabel;
  objective?: string;
  orchestrationPlanId?: string;
  marketStateId?: string;
  requiresConfirmation?: boolean;
}>;

const DEFAULT_EXCHANGE_SCOPE_ID = 'binance-spot';
const DEFAULT_ORCHESTRATOR_ID = 'orch-default';

@Injectable()
export class TradingOrchestratorProductService {
  constructor(
    @Inject(TRADING_ORCHESTRATOR_SERVICE_PORT)
    private readonly commands: TradingOrchestratorServicePort,
    @Inject(TRADING_ORCHESTRATOR_QUERY_PORT)
    private readonly queries: TradingOrchestratorQueryPort,
    @Inject(OrchestrationCoordinationStore)
    private readonly store: OrchestrationCoordinationStore,
    @Inject(InMemoryOrchestratorMarketStateAdapter)
    private readonly marketState: InMemoryOrchestratorMarketStateAdapter,
  ) {}

  createPlan(cmd: CreateOrchestrationPlanCommand): OrchestrationPlanView {
    const asOf = new Date().toISOString();
    const exchangeScopeId = cmd.exchangeScopeId?.trim() || DEFAULT_EXCHANGE_SCOPE_ID;
    const marketSymbol = cmd.marketSymbol.trim();
    const modeContext = cmd.modeContext ?? 'paper';
    const history = this.store
      .listPlans(cmd.workspaceId)
      .filter(
        (plan) =>
          plan.tradingOrchestratorId === DEFAULT_ORCHESTRATOR_ID &&
          plan.exchangeScopeId === exchangeScopeId &&
          plan.marketSymbol === marketSymbol,
      );
    const nextVersion = history.reduce((max, plan) => Math.max(max, plan.version.version), 0) + 1;
    const published = publishNextOrchestrationPlan({
      history,
      next: {
        orchestrationPlanId: this.store.nextId('plan'),
        tradingOrchestratorId: DEFAULT_ORCHESTRATOR_ID,
        workspaceId: cmd.workspaceId,
        exchangeScopeId,
        marketSymbol,
        modeContext,
        versionNumber: nextVersion,
        publishedAt: asOf,
        publishedBy: cmd.requestedBy,
        intent: {
          objective: cmd.objective.trim(),
          rationaleSummary:
            cmd.rationaleSummary?.trim() || 'Paper coordination request. Does not start a Session.',
        },
        metadata: {
          asOf,
          inputSummary: `${exchangeScopeId} ${marketSymbol} ${modeContext} coordination`,
        },
      },
    });
    if (published.previous) this.store.putPlan(published.previous);
    this.store.putPlan(published.next);
    return toOrchestrationPlanView(published.next);
  }

  listPlans(workspaceId: string): OrchestrationPlanView[] {
    return this.store
      .listPlans(workspaceId)
      .sort((a, b) => b.version.publishedAt.localeCompare(a.version.publishedAt))
      .map(toOrchestrationPlanView);
  }

  getPlan(workspaceId: string, orchestrationPlanId: string): OrchestrationPlanView | null {
    const plan = this.store.getPlan(orchestrationPlanId);
    if (!plan || plan.workspaceId !== workspaceId) return null;
    return toOrchestrationPlanView(plan);
  }

  requestRun(cmd: RequestOrchestrationRunCommand): OrchestrationCommandResult {
    const exchangeScopeId = cmd.exchangeScopeId?.trim() || DEFAULT_EXCHANGE_SCOPE_ID;
    const marketSymbol = cmd.marketSymbol.trim();
    const modeContext = cmd.modeContext ?? 'paper';
    this.ensureCurrentMarketState({
      workspaceId: cmd.workspaceId,
      exchangeScopeId,
      marketSymbol,
      marketStateId: cmd.marketStateId,
    });
    const result = this.commands.requestOrchestrationRun({
      workspaceId: cmd.workspaceId,
      exchangeScopeId,
      marketSymbol,
      modeContext,
      requestedBy: cmd.requestedBy,
      objective: cmd.objective,
      marketStateId: cmd.marketStateId,
      requiresConfirmation: cmd.requiresConfirmation,
    } satisfies RequestOrchestrationRun);
    this.assertAccepted(result);
    const planId = cmd.orchestrationPlanId?.trim();
    if (planId && result.orchestrationRunId) {
      const plan = this.store.getPlan(planId);
      if (plan && plan.workspaceId === cmd.workspaceId) {
        this.store.linkRunToPlan(result.orchestrationRunId, plan.orchestrationPlanId);
      }
    }
    return result;
  }

  confirmRun(cmd: ConfirmOrchestrationRun): OrchestrationCommandResult {
    const result = this.commands.confirmOrchestrationRun(cmd);
    this.assertAccepted(result);
    return result;
  }

  cancelRun(cmd: CancelOrchestrationRun): OrchestrationCommandResult {
    const result = this.commands.cancelOrchestrationRun(cmd);
    if (result.outcome !== 'cancelled') {
      throw new OrchestrationRejectedError(result);
    }
    return result;
  }

  proposeSelection(cmd: ProposeSelection): OrchestrationCommandResult {
    const result = this.commands.proposeSelection(cmd);
    this.assertAccepted(result, 'proposed');
    return result;
  }

  emitHandoff(cmd: EmitSessionHandoff): OrchestrationCommandResult {
    const result = this.commands.emitSessionHandoff(cmd);
    if (result.outcome !== 'handed_off') {
      throw new OrchestrationRejectedError(result);
    }
    return result;
  }

  getRun(workspaceId: string, orchestrationRunId: string): OrchestrationRunDetailView | null {
    const run = this.store.getRun(orchestrationRunId);
    if (!run || run.workspaceId !== workspaceId) return null;
    const selection = run.selectionDecisionId
      ? this.queries.getSelectionDecision({
          workspaceId,
          selectionDecisionId: run.selectionDecisionId,
        })
      : null;
    const handoff = run.sessionHandoffIntentId
      ? this.queries.getSessionHandoffIntent({
          workspaceId,
          sessionHandoffIntentId: run.sessionHandoffIntentId,
        })
      : null;
    return {
      ...toOrchestrationRunView(run, this.store.getPlanIdForRun(run.orchestrationRunId) ?? null),
      selection,
      handoff,
    };
  }

  listRuns(workspaceId: string, limit = 50): OrchestrationRunView[] {
    return this.store
      .listRuns(workspaceId)
      .sort(
        (a, b) =>
          b.createdAt.localeCompare(a.createdAt) ||
          b.orchestrationRunId.localeCompare(a.orchestrationRunId),
      )
      .slice(0, limit)
      .map((run) =>
        toOrchestrationRunView(run, this.store.getPlanIdForRun(run.orchestrationRunId) ?? null),
      );
  }

  getSelection(workspaceId: string, selectionDecisionId: string): SelectionDecisionView | null {
    return this.queries.getSelectionDecision({ workspaceId, selectionDecisionId });
  }

  getHandoff(workspaceId: string, sessionHandoffIntentId: string): SessionHandoffIntentView | null {
    return this.queries.getSessionHandoffIntent({ workspaceId, sessionHandoffIntentId });
  }

  private ensureCurrentMarketState(query: {
    workspaceId: string;
    exchangeScopeId: string;
    marketSymbol: string;
    marketStateId?: string;
  }): void {
    const existing = this.marketState.getCurrentMarketState(query);
    if (existing) return;
    this.marketState.seedCurrent({
      marketStateId: query.marketStateId?.trim() || this.store.nextId('ms'),
      workspaceId: query.workspaceId,
      exchangeScopeId: query.exchangeScopeId,
      marketSymbol: query.marketSymbol,
      version: 1,
      lifecycleStatus: 'active',
      authorityClass: 'market_state_artifact',
      forcesTrade: false,
      isQualification: false,
      isProfile: false,
    });
  }

  private assertAccepted(
    result: OrchestrationCommandResult,
    expected: OrchestrationCommandResult['outcome'] = 'accepted',
  ): void {
    if (result.outcome !== expected) {
      throw new OrchestrationRejectedError(result);
    }
  }
}
