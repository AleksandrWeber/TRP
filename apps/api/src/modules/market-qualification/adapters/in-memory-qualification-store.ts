/**
 * RC-25 Epic 4 — Process-local Qualification artifact store.
 *
 * Not a persistence product / DB schema (same pattern as Reporting).
 * W3-O01-b: snapshot export/import enables durable persistence on this owner
 * via DurableQualificationStore.
 */

import { Injectable } from '@nestjs/common';
import type { MarketConfidence } from '../domain/market-confidence';
import type { MarketHealth } from '../domain/market-health';
import type { QualificationRun } from '../domain/qualification-run';
import type { QualificationState } from '../domain/qualification-state';
import type { QualificationTarget } from '../domain/qualification-target';

export type QualificationStoreDurableState = Readonly<{
  targets: QualificationTarget[];
  states: QualificationState[];
  runs: QualificationRun[];
  confidence: MarketConfidence[];
  health: MarketHealth[];
}>;

@Injectable()
export class InMemoryQualificationStore {
  private readonly targets = new Map<string, QualificationTarget>();
  private readonly states = new Map<string, QualificationState>();
  private readonly runs = new Map<string, QualificationRun>();
  private readonly confidenceByTarget = new Map<string, MarketConfidence>();
  private readonly healthByTarget = new Map<string, MarketHealth>();

  clear(): void {
    this.targets.clear();
    this.states.clear();
    this.runs.clear();
    this.confidenceByTarget.clear();
    this.healthByTarget.clear();
  }

  putTarget(target: QualificationTarget): void {
    this.targets.set(target.targetId, target);
  }

  getTarget(targetId: string): QualificationTarget | null {
    return this.targets.get(targetId) ?? null;
  }

  findTarget(
    workspaceId: string,
    exchangeScopeId: string,
    marketSymbol: string,
  ): QualificationTarget | null {
    for (const target of this.targets.values()) {
      if (
        target.workspaceId === workspaceId &&
        target.exchangeScopeId === exchangeScopeId &&
        target.marketSymbol === marketSymbol
      ) {
        return target;
      }
    }
    return null;
  }

  listTargets(workspaceId: string): QualificationTarget[] {
    return [...this.targets.values()]
      .filter((target) => target.workspaceId === workspaceId)
      .sort((left, right) => {
        if (left.createdAt !== right.createdAt) {
          return left.createdAt < right.createdAt ? -1 : 1;
        }
        return left.targetId < right.targetId ? -1 : left.targetId > right.targetId ? 1 : 0;
      });
  }

  putState(state: QualificationState): void {
    this.states.set(state.targetId, state);
  }

  getState(targetId: string): QualificationState | null {
    return this.states.get(targetId) ?? null;
  }

  putRun(run: QualificationRun): void {
    this.runs.set(run.qualificationRunId, run);
  }

  getRun(qualificationRunId: string): QualificationRun | null {
    return this.runs.get(qualificationRunId) ?? null;
  }

  listRuns(workspaceId: string, targetId?: string): QualificationRun[] {
    return [...this.runs.values()]
      .filter((run) => run.workspaceId === workspaceId)
      .filter((run) => (targetId ? run.targetId === targetId : true))
      .sort((a, b) => {
        if (a.createdAt !== b.createdAt) {
          return a.createdAt < b.createdAt ? -1 : 1;
        }
        return a.qualificationRunId < b.qualificationRunId
          ? -1
          : a.qualificationRunId > b.qualificationRunId
            ? 1
            : 0;
      });
  }

  putConfidence(confidence: MarketConfidence): void {
    this.confidenceByTarget.set(confidence.targetId, confidence);
  }

  getConfidence(targetId: string): MarketConfidence | null {
    return this.confidenceByTarget.get(targetId) ?? null;
  }

  putHealth(health: MarketHealth): void {
    this.healthByTarget.set(health.targetId, health);
  }

  getHealth(targetId: string): MarketHealth | null {
    return this.healthByTarget.get(targetId) ?? null;
  }

  exportDurableState(): QualificationStoreDurableState {
    return Object.freeze({
      targets: [...this.targets.values()],
      states: [...this.states.values()],
      runs: [...this.runs.values()],
      confidence: [...this.confidenceByTarget.values()],
      health: [...this.healthByTarget.values()],
    });
  }

  importDurableState(state: QualificationStoreDurableState): void {
    this.targets.clear();
    this.states.clear();
    this.runs.clear();
    this.confidenceByTarget.clear();
    this.healthByTarget.clear();
    for (const target of state.targets ?? []) {
      this.targets.set(target.targetId, target);
    }
    for (const row of state.states ?? []) {
      this.states.set(row.targetId, row);
    }
    for (const run of state.runs ?? []) {
      this.runs.set(run.qualificationRunId, run);
    }
    for (const confidence of state.confidence ?? []) {
      this.confidenceByTarget.set(confidence.targetId, confidence);
    }
    for (const health of state.health ?? []) {
      this.healthByTarget.set(health.targetId, health);
    }
  }
}
