import type { OrchestrationPlan } from './domain/orchestration-plan';
import type { OrchestrationRun } from './domain/orchestration-run';
import type {
  OrchestrationCommandResult,
  SelectionDecisionView,
  SessionHandoffIntentView,
} from './ports/trading-orchestrator.port';

/**
 * PC-11 — HTTP product views of existing Orchestrator artifacts.
 * Does not own Session. Does not execute. createsSession remains false.
 */

export type OrchestrationPlanView = {
  orchestrationPlanId: string;
  tradingOrchestratorId: string;
  workspaceId: string;
  exchangeScopeId: string;
  marketSymbol: string;
  modeContext: OrchestrationPlan['modeContext'];
  version: number;
  publishedAt: string;
  publishedBy: string;
  lifecycleStatus: OrchestrationPlan['lifecycle']['status'];
  lifecycleUpdatedAt: string;
  lifecycleReason: string;
  objective: string;
  rationaleSummary: string;
  inputSummary: string;
  authorityClass: 'orchestration_artifact';
  createsSession: false;
  forcesTrade: false;
  submitsOrders: false;
  approvesRisk: false;
};

export type OrchestrationRunView = {
  orchestrationRunId: string;
  workspaceId: string;
  exchangeScopeId: string;
  marketSymbol: string;
  modeContext: OrchestrationRun['modeContext'];
  status: string;
  marketStateId: string;
  orchestrationPlanId: string | null;
  selectionDecisionId: string | null;
  sessionHandoffIntentId: string | null;
  objective: string | null;
  rejectionReasons: readonly string[];
  requiresConfirmation: boolean;
  createdAt: string;
  updatedAt: string;
  authorityClass: 'orchestration_artifact';
  forcesTrade: false;
  approvesRisk: false;
  submitsOrders: false;
  ownsSessionLifecycle: false;
};

export type OrchestrationRunDetailView = OrchestrationRunView & {
  selection: SelectionDecisionView | null;
  handoff: SessionHandoffIntentView | null;
};

export type OrchestrationCommandView = OrchestrationCommandResult;

export type OrchestrationHistoryView = {
  items: OrchestrationRunView[];
};

export type OrchestrationPlanListView = {
  items: OrchestrationPlanView[];
};

export function toOrchestrationPlanView(plan: OrchestrationPlan): OrchestrationPlanView {
  return {
    orchestrationPlanId: plan.orchestrationPlanId,
    tradingOrchestratorId: plan.tradingOrchestratorId,
    workspaceId: plan.workspaceId,
    exchangeScopeId: plan.exchangeScopeId,
    marketSymbol: plan.marketSymbol,
    modeContext: plan.modeContext,
    version: plan.version.version,
    publishedAt: plan.version.publishedAt,
    publishedBy: plan.version.publishedBy,
    lifecycleStatus: plan.lifecycle.status,
    lifecycleUpdatedAt: plan.lifecycle.updatedAt,
    lifecycleReason: plan.lifecycle.reason,
    objective: plan.intent.objective,
    rationaleSummary: plan.intent.rationaleSummary,
    inputSummary: plan.metadata.inputSummary,
    authorityClass: 'orchestration_artifact',
    createsSession: false,
    forcesTrade: false,
    submitsOrders: false,
    approvesRisk: false,
  };
}

export function toOrchestrationRunView(
  run: OrchestrationRun,
  orchestrationPlanId: string | null,
): OrchestrationRunView {
  return {
    orchestrationRunId: run.orchestrationRunId,
    workspaceId: run.workspaceId,
    exchangeScopeId: run.exchangeScopeId,
    marketSymbol: run.marketSymbol,
    modeContext: run.modeContext,
    status: run.status,
    marketStateId: run.marketStateId,
    orchestrationPlanId,
    selectionDecisionId: run.selectionDecisionId ?? null,
    sessionHandoffIntentId: run.sessionHandoffIntentId ?? null,
    objective: run.objective ?? null,
    rejectionReasons: run.rejectionReasons ? [...run.rejectionReasons] : [],
    requiresConfirmation: run.requiresConfirmation,
    createdAt: run.createdAt,
    updatedAt: run.updatedAt,
    authorityClass: 'orchestration_artifact',
    forcesTrade: false,
    approvesRisk: false,
    submitsOrders: false,
    ownsSessionLifecycle: false,
  };
}

export function toOrchestrationHistoryView(
  items: readonly OrchestrationRunView[],
): OrchestrationHistoryView {
  return { items: [...items] };
}

export function toOrchestrationPlanListView(
  items: readonly OrchestrationPlanView[],
): OrchestrationPlanListView {
  return { items: [...items] };
}
