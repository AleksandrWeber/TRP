/**
 * RC-26 Epic 5 — Process-local coordination store.
 *
 * Product-visible history of existing plan / run / decision / intent records.
 * Not a new Source of Truth. Not a database product. Not Session ownership.
 */

import { Injectable } from '@nestjs/common';
import type { OrchestrationPlan } from '../domain/orchestration-plan';
import type { OrchestrationRun } from '../domain/orchestration-run';
import type { SelectionDecision } from '../domain/selection-decision';
import type { SessionHandoffIntent } from '../domain/session-handoff-intent';

@Injectable()
export class OrchestrationCoordinationStore {
  private readonly plans = new Map<string, OrchestrationPlan>();
  private readonly runs = new Map<string, OrchestrationRun>();
  private readonly selections = new Map<string, SelectionDecision>();
  private readonly handoffs = new Map<string, SessionHandoffIntent>();
  private readonly runPlanIds = new Map<string, string>();
  private seq = 0;

  clear(): void {
    this.plans.clear();
    this.runs.clear();
    this.selections.clear();
    this.handoffs.clear();
    this.runPlanIds.clear();
    this.seq = 0;
  }

  nextId(prefix: string): string {
    this.seq += 1;
    return `${prefix}-${this.seq}`;
  }

  putRun(run: OrchestrationRun): void {
    this.runs.set(run.orchestrationRunId, run);
  }

  getRun(orchestrationRunId: string): OrchestrationRun | undefined {
    return this.runs.get(orchestrationRunId);
  }

  listRuns(workspaceId: string): OrchestrationRun[] {
    return [...this.runs.values()].filter((run) => run.workspaceId === workspaceId);
  }

  putSelection(selection: SelectionDecision): void {
    this.selections.set(selection.selectionDecisionId, selection);
  }

  getSelection(selectionDecisionId: string): SelectionDecision | undefined {
    return this.selections.get(selectionDecisionId);
  }

  putHandoff(intent: SessionHandoffIntent): void {
    this.handoffs.set(intent.sessionHandoffIntentId, intent);
  }

  getHandoff(sessionHandoffIntentId: string): SessionHandoffIntent | undefined {
    return this.handoffs.get(sessionHandoffIntentId);
  }

  putPlan(plan: OrchestrationPlan): void {
    this.plans.set(plan.orchestrationPlanId, plan);
  }

  getPlan(orchestrationPlanId: string): OrchestrationPlan | undefined {
    return this.plans.get(orchestrationPlanId);
  }

  listPlans(workspaceId: string): OrchestrationPlan[] {
    return [...this.plans.values()].filter((plan) => plan.workspaceId === workspaceId);
  }

  linkRunToPlan(orchestrationRunId: string, orchestrationPlanId: string): void {
    this.runPlanIds.set(orchestrationRunId, orchestrationPlanId);
  }

  getPlanIdForRun(orchestrationRunId: string): string | undefined {
    return this.runPlanIds.get(orchestrationRunId);
  }
}
