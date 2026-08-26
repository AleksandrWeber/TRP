/**
 * RC-24 Epic 4 — Process-local Reporting artifact store.
 *
 * W3-O01-b: snapshot export/import enables durable persistence on this owner
 * via DurableReportingStore (PERSISTENCE_DRIVER=prisma). Not a new SoT.
 */

import { Injectable } from '@nestjs/common';
import type { AggregationSlice } from '../domain/aggregation-slice';
import type { ReportDefinition } from '../domain/report-definition';
import type { ReportRun } from '../domain/report-run';

export type ReportingStoreDurableState = Readonly<{
  definitions: ReportDefinition[];
  runs: ReportRun[];
  aggregations: Array<readonly [string, readonly AggregationSlice[]]>;
}>;

@Injectable()
export class InMemoryReportingStore {
  private readonly definitions = new Map<string, ReportDefinition>();
  private readonly runs = new Map<string, ReportRun>();
  private readonly aggregations = new Map<string, readonly AggregationSlice[]>();

  clear(): void {
    this.definitions.clear();
    this.runs.clear();
    this.aggregations.clear();
  }

  putDefinition(definition: ReportDefinition): void {
    this.definitions.set(definition.reportDefinitionId, definition);
  }

  getDefinition(reportDefinitionId: string): ReportDefinition | null {
    return this.definitions.get(reportDefinitionId) ?? null;
  }

  listDefinitions(workspaceId: string): ReportDefinition[] {
    return [...this.definitions.values()]
      .filter((d) => d.workspaceId === workspaceId)
      .sort((a, b) =>
        a.reportDefinitionId < b.reportDefinitionId
          ? -1
          : a.reportDefinitionId > b.reportDefinitionId
            ? 1
            : 0,
      );
  }

  putRun(run: ReportRun, slices: readonly AggregationSlice[]): void {
    this.runs.set(run.reportRunId, run);
    this.aggregations.set(run.reportRunId, slices);
  }

  getRun(reportRunId: string): ReportRun | null {
    return this.runs.get(reportRunId) ?? null;
  }

  listRuns(workspaceId: string, reportDefinitionId?: string): ReportRun[] {
    return [...this.runs.values()]
      .filter((run) => run.workspaceId === workspaceId)
      .filter((run) => (reportDefinitionId ? run.reportDefinitionId === reportDefinitionId : true))
      .sort((a, b) => {
        if (a.createdAt !== b.createdAt) {
          return a.createdAt < b.createdAt ? -1 : 1;
        }
        return a.reportRunId < b.reportRunId ? -1 : a.reportRunId > b.reportRunId ? 1 : 0;
      });
  }

  listAggregations(reportRunId: string): readonly AggregationSlice[] {
    return this.aggregations.get(reportRunId) ?? Object.freeze([]);
  }

  exportDurableState(): ReportingStoreDurableState {
    return Object.freeze({
      definitions: [...this.definitions.values()],
      runs: [...this.runs.values()],
      aggregations: [...this.aggregations.entries()].map(([id, slices]) =>
        Object.freeze([id, slices] as const),
      ),
    });
  }

  importDurableState(state: ReportingStoreDurableState): void {
    this.definitions.clear();
    this.runs.clear();
    this.aggregations.clear();
    for (const definition of state.definitions ?? []) {
      this.definitions.set(definition.reportDefinitionId, definition);
    }
    for (const run of state.runs ?? []) {
      this.runs.set(run.reportRunId, run);
    }
    for (const [reportRunId, slices] of state.aggregations ?? []) {
      this.aggregations.set(reportRunId, slices);
    }
  }
}
