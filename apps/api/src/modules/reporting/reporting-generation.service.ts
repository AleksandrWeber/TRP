/**
 * RC-24 Epic 4 — Report Generation Service.
 *
 * Deterministic report creation from Reporting domain models + Knowledge Lake
 * projections via ReportingKnowledgeLakeReadService only.
 *
 * Forbidden: AI narratives, Strategy Library / Session / Orders / Enforcement reads,
 * REST, persistence product, shadow ledger recompute.
 */

import { Inject, Injectable } from '@nestjs/common';
import { InMemoryReportingStore } from './adapters/in-memory-reporting-store';
import { createHistoricalWindow, type HistoricalWindow } from './domain/historical-window';
import { createReportDefinition, type ReportDefinition } from './domain/report-definition';
import { createReportRun } from './domain/report-run';
import type { ReportingAnalyticalFact } from './domain/reporting-analytical-read-model';
import {
  REPORTING_DOMAIN_AUTHORITY_CLASS,
  isReportingFactMode,
  type ReportingFactMode,
} from './domain/reporting-domain-shared';
import { aggregateReportingFacts } from './generation/aggregate-reporting-facts';
import { deriveReportRunId } from './generation/derive-report-run-id';
import type {
  CompareReportRuns,
  ComparisonSlice,
  ReportRunResult,
  ReportingServicePort,
  RequestReportRun,
} from './ports/reporting.port';
import { ReportingKnowledgeLakeReadService } from './reporting-knowledge-lake-read.service';

const LAKE_PAGE_LIMIT = 200;

@Injectable()
export class ReportingGenerationService implements ReportingServicePort {
  constructor(
    @Inject(ReportingKnowledgeLakeReadService)
    private readonly lakeReads: ReportingKnowledgeLakeReadService,
    @Inject(InMemoryReportingStore)
    private readonly store: InMemoryReportingStore,
  ) {}

  registerDefinition(definition: ReportDefinition): ReportDefinition {
    this.store.putDefinition(definition);
    return definition;
  }

  requestReportRun(cmd: RequestReportRun): ReportRunResult {
    const rejectionReasons: string[] = [];

    if (!cmd.workspaceId?.trim()) {
      return rejected(['workspace_required']);
    }

    const definition = this.resolveDefinition(cmd, rejectionReasons);
    if (!definition) {
      return rejected(rejectionReasons.length ? rejectionReasons : ['definition_required']);
    }

    if (definition.workspaceId !== cmd.workspaceId) {
      return rejected(['workspace_mismatch']);
    }

    let window: HistoricalWindow;
    try {
      window = Object.isFrozen(cmd.window) ? cmd.window : createHistoricalWindow(cmd.window);
    } catch {
      return rejected(['invalid_window']);
    }

    if (!cmd.modes || cmd.modes.length === 0) {
      return rejected(['modes_required']);
    }
    const modes: ReportingFactMode[] = [];
    for (const mode of cmd.modes) {
      if (!isReportingFactMode(mode)) {
        return rejected([`unknown_mode:${mode}`]);
      }
      modes.push(mode);
    }
    const sortedModes = Object.freeze([...modes].sort()) as readonly ReportingFactMode[];

    const createdAt = cmd.requestedAt?.trim() || '1970-01-01T00:00:00.000Z';
    const reportRunId =
      cmd.reportRunId?.trim() ||
      deriveReportRunId([
        cmd.workspaceId,
        definition.reportDefinitionId,
        window.from,
        window.to,
        sortedModes.join(','),
        cmd.exchangeScopeId ?? '',
        cmd.tradingSessionId ?? '',
        cmd.libraryEntryId ?? '',
      ]);

    const facts = this.loadFacts({
      workspaceId: cmd.workspaceId,
      window,
      modes: sortedModes,
      exchangeScopeId: cmd.exchangeScopeId,
      tradingSessionId: cmd.tradingSessionId,
      libraryEntryId: cmd.libraryEntryId,
    });

    const status = facts.length === 0 ? 'empty' : 'completed';
    const lakeEventIds = Object.freeze(facts.map((f) => f.eventId));
    const sourceRefs = Object.freeze(
      facts.map((f) => ({ ownerType: 'knowledge-lake' as const, id: f.eventId })),
    );

    const run = createReportRun({
      reportRunId,
      workspaceId: cmd.workspaceId,
      definition,
      window,
      modes: sortedModes,
      exchangeScopeId: cmd.exchangeScopeId,
      tradingSessionId: cmd.tradingSessionId,
      libraryEntryId: cmd.libraryEntryId,
      status,
      sourceSummary: {
        factCount: facts.length,
        lakeEventIds,
        sourceRefs,
      },
      createdAt,
    });

    const aggregations = aggregateReportingFacts({
      reportRunId,
      metricKeys: definition.metricKeys,
      facts,
      modes: sortedModes,
    });

    this.store.putDefinition(definition);
    this.store.putRun(run, aggregations);

    return Object.freeze({
      outcome: status,
      reportRun: run,
      aggregations,
      authorityClass: REPORTING_DOMAIN_AUTHORITY_CLASS,
    });
  }

  compareRuns(cmd: CompareReportRuns): readonly ComparisonSlice[] {
    const left = this.store.getRun(cmd.leftReportRunId);
    const right = this.store.getRun(cmd.rightReportRunId);
    if (!left || !right) {
      return Object.freeze([]);
    }
    if (left.workspaceId !== cmd.workspaceId || right.workspaceId !== cmd.workspaceId) {
      return Object.freeze([]);
    }

    const leftSlices = this.store.listAggregations(cmd.leftReportRunId);
    const rightSlices = this.store.listAggregations(cmd.rightReportRunId);
    const rightByKey = new Map(
      rightSlices.map((slice) => [`${slice.metricKey}::${slice.mode ?? ''}`, slice]),
    );

    const comparisons: ComparisonSlice[] = [];
    for (const leftSlice of leftSlices) {
      const key = `${leftSlice.metricKey}::${leftSlice.mode ?? ''}`;
      const rightSlice = rightByKey.get(key);
      if (!rightSlice) continue;
      comparisons.push(
        Object.freeze({
          authorityClass: REPORTING_DOMAIN_AUTHORITY_CLASS,
          leftReportRunId: cmd.leftReportRunId,
          rightReportRunId: cmd.rightReportRunId,
          metricKey: leftSlice.metricKey,
          leftValue: leftSlice.value ?? null,
          rightValue: rightSlice.value ?? null,
          delta: deltaValue(leftSlice.value, rightSlice.value),
        }),
      );
    }

    return Object.freeze(comparisons);
  }

  private resolveDefinition(
    cmd: RequestReportRun,
    rejectionReasons: string[],
  ): ReportDefinition | null {
    const hasId = !!cmd.reportDefinitionId?.trim();
    const hasInline = !!cmd.definition;
    if (hasId === hasInline) {
      rejectionReasons.push(hasId ? 'definition_ambiguous' : 'definition_required');
      return null;
    }
    if (hasInline) {
      return cmd.definition!;
    }
    const found = this.store.getDefinition(cmd.reportDefinitionId!.trim());
    if (!found) {
      rejectionReasons.push('definition_not_found');
      return null;
    }
    return found;
  }

  private loadFacts(input: {
    workspaceId: string;
    window: HistoricalWindow;
    modes: readonly ReportingFactMode[];
    exchangeScopeId?: string;
    tradingSessionId?: string;
    libraryEntryId?: string;
  }): ReportingAnalyticalFact[] {
    const collected: ReportingAnalyticalFact[] = [];
    for (const mode of input.modes) {
      let cursor: string | null | undefined;
      do {
        const page = this.lakeReads.list({
          workspaceId: input.workspaceId,
          mode,
          occurredFrom: input.window.from,
          occurredTo: input.window.to,
          exchangeScopeId: input.exchangeScopeId,
          tradingSessionId: input.tradingSessionId,
          limit: LAKE_PAGE_LIMIT,
          cursor: cursor ?? undefined,
        });
        for (const fact of page.items) {
          if (input.libraryEntryId) {
            const matchesLibrary =
              fact.sourceRef?.id === input.libraryEntryId ||
              (fact.payload &&
                typeof fact.payload === 'object' &&
                !Array.isArray(fact.payload) &&
                (fact.payload as Record<string, unknown>).libraryEntryId === input.libraryEntryId);
            if (!matchesLibrary) continue;
          }
          collected.push(fact);
        }
        cursor = page.nextCursor;
      } while (cursor);
    }

    // Deterministic dedupe by eventId (fact may appear once per mode loop only once).
    const byId = new Map<string, ReportingAnalyticalFact>();
    for (const fact of collected) {
      byId.set(fact.eventId, fact);
    }
    return [...byId.values()].sort((a, b) => {
      if (a.occurredAt !== b.occurredAt) {
        return a.occurredAt < b.occurredAt ? -1 : 1;
      }
      return a.eventId < b.eventId ? -1 : a.eventId > b.eventId ? 1 : 0;
    });
  }
}

function rejected(reasons: readonly string[]): ReportRunResult {
  return Object.freeze({
    outcome: 'rejected',
    aggregations: Object.freeze([]),
    rejectionReasons: Object.freeze([...reasons]),
    authorityClass: REPORTING_DOMAIN_AUTHORITY_CLASS,
  });
}

function deltaValue(left: unknown, right: unknown): unknown {
  if (typeof left === 'number' && typeof right === 'number') {
    return right - left;
  }
  if (
    left &&
    right &&
    typeof left === 'object' &&
    typeof right === 'object' &&
    !Array.isArray(left) &&
    !Array.isArray(right)
  ) {
    const keys = new Set([...Object.keys(left as object), ...Object.keys(right as object)]);
    const out: Record<string, number | null> = {};
    for (const key of [...keys].sort()) {
      const l = (left as Record<string, unknown>)[key];
      const r = (right as Record<string, unknown>)[key];
      out[key] =
        typeof l === 'number' && typeof r === 'number'
          ? r - l
          : typeof r === 'number'
            ? r
            : typeof l === 'number'
              ? -l
              : null;
    }
    return Object.freeze(out);
  }
  return Object.freeze({ left: left ?? null, right: right ?? null });
}

/** Re-export for tests that seed definitions without Nest. */
export { createReportDefinition };
