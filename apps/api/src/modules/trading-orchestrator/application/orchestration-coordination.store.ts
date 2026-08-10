/**
 * RC-26 Epic 5 — Process-local coordination store.
 *
 * In-memory only — not a persistence product / DB / REST.
 */

import { Injectable } from '@nestjs/common';
import type { OrchestrationRun } from '../domain/orchestration-run';
import type { SelectionDecision } from '../domain/selection-decision';
import type { SessionHandoffIntent } from '../domain/session-handoff-intent';

@Injectable()
export class OrchestrationCoordinationStore {
  private readonly runs = new Map<string, OrchestrationRun>();
  private readonly selections = new Map<string, SelectionDecision>();
  private readonly handoffs = new Map<string, SessionHandoffIntent>();
  private seq = 0;

  clear(): void {
    this.runs.clear();
    this.selections.clear();
    this.handoffs.clear();
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
}
