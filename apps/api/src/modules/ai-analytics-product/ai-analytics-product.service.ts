/**
 * PC-17 — product adapter over existing AI Analytics generation ports.
 *
 * Delegates explain / summarize / identifyTrends / generateNarrative to
 * AIAnalyticsPort. Composes Reporting, Knowledge Lake, and Strategy Library
 * reads for references and comparisons. Does not persist, own reports,
 * edit knowledge, send notifications, or trade. AI Analytics remains
 * narrative owner. Domain rest: false is unchanged.
 */

import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import {
  AI_ANALYTICS_PORT,
  type AIAnalyticsPort,
  type AiAnalyticsReportRequest,
} from '../ai-analytics/ports/ai-analytics.port';
import type { AnalyticalNarrative } from '../ai-analytics/domain/analytical-narrative';
import {
  KNOWLEDGE_LAKE_QUERY_PORT,
  type KnowledgeLakeQueryPort,
} from '../knowledge-lake/ports/knowledge-lake-query.port';
import type { AnalyticalFact } from '../knowledge-lake/domain/analytical-fact-admission';
import type { ReportRun } from '../reporting/domain/report-run';
import {
  REPORTING_QUERY_PORT,
  REPORTING_SERVICE_PORT,
  type ReportingQueryPort,
  type ReportingServicePort,
} from '../reporting/ports/reporting.port';
import {
  STRATEGY_LIBRARY_LOOKUP_PORT,
  type StrategyLibraryLookupPort,
  type StrategyVersionRecord,
} from '../strategy-library/ports/strategy-library-lookup.port';
import {
  AI_ANALYTICS_PRODUCT_KINDS,
  isAiAnalyticsProductKind,
  narrativeMatchesQuery,
  runCitesLibrary,
  toComparisonView,
  toDetailView,
  toHistoryPageView,
  toPageView,
  toProvenanceView,
  toStrategyRefView,
  type AiAnalyticsDetailView,
  type AiAnalyticsHistoryPageView,
  type AiAnalyticsPageView,
  type AiAnalyticsProductKind,
  type AiAnalyticsProvenanceView,
  type GenerateAiAnalyticsCommand,
  type ListAiAnalyticsQuery,
} from './ai-analytics.view';

@Injectable()
export class AiAnalyticsProductService {
  constructor(
    @Inject(AI_ANALYTICS_PORT)
    private readonly ai: AIAnalyticsPort,
    @Inject(REPORTING_QUERY_PORT)
    private readonly reportingQuery: ReportingQueryPort,
    @Inject(REPORTING_SERVICE_PORT)
    private readonly reporting: ReportingServicePort,
    @Inject(KNOWLEDGE_LAKE_QUERY_PORT)
    private readonly lakeQuery: KnowledgeLakeQueryPort,
    @Inject(STRATEGY_LIBRARY_LOOKUP_PORT)
    private readonly libraryLookup: StrategyLibraryLookupPort,
  ) {}

  list(query: ListAiAnalyticsQuery): AiAnalyticsPageView {
    const narratives = this.catalog(query.workspaceId).filter(
      (narrative) =>
        this.matchesLibrary(narrative, query) && narrativeMatchesQuery(narrative, query),
    );
    const limit = query.limit !== undefined && query.limit >= 0 ? query.limit : narratives.length;
    return toPageView(narratives.slice(0, limit));
  }

  history(query: ListAiAnalyticsQuery): AiAnalyticsHistoryPageView {
    const narratives = this.catalog(query.workspaceId).filter(
      (narrative) =>
        this.matchesLibrary(narrative, query) && narrativeMatchesQuery(narrative, query),
    );
    return toHistoryPageView(narratives);
  }

  provenance(workspaceId: string, analysisId: string): AiAnalyticsProvenanceView | null {
    const found = this.findNarrative(workspaceId, analysisId);
    return found ? toProvenanceView(found.narrative) : null;
  }

  get(workspaceId: string, analysisId: string): AiAnalyticsDetailView | null {
    const found = this.findNarrative(workspaceId, analysisId);
    if (!found) return null;
    return this.toDetail(found.narrative, found.run, null);
  }

  generate(command: GenerateAiAnalyticsCommand): AiAnalyticsDetailView {
    const kind = command.kind ?? 'narrative';
    if (!isAiAnalyticsProductKind(kind)) {
      throw new BadRequestException('kind must be explain, summarize, trends, or narrative');
    }
    const reportRunId = this.resolveReportRunId(
      command.workspaceId,
      command.reportRunId,
      command.libraryEntryId,
    );
    if (!reportRunId) {
      throw new BadRequestException(
        'Generate requires an existing ReportRun. AI Analytics does not own reports or invent data.',
      );
    }
    const narrative = this.narrate(kind, {
      workspaceId: command.workspaceId,
      reportRunId,
      ...(command.focus !== undefined ? { focus: command.focus } : {}),
      ...(command.requestedAt !== undefined ? { requestedAt: command.requestedAt } : {}),
    });
    const run = this.scopedRun(command.workspaceId, reportRunId);
    const comparison = this.buildComparison(command, kind, narrative, run);
    return this.toDetail(narrative, run, comparison);
  }

  private catalog(workspaceId: string): AnalyticalNarrative[] {
    const runs = this.reportingQuery.listRuns({ workspaceId }).items;
    const items: AnalyticalNarrative[] = [];
    for (const run of runs) {
      for (const kind of AI_ANALYTICS_PRODUCT_KINDS) {
        items.push(
          this.narrate(kind, {
            workspaceId,
            reportRunId: run.reportRunId,
          }),
        );
      }
    }
    return items;
  }

  private findNarrative(
    workspaceId: string,
    analysisId: string,
  ): { narrative: AnalyticalNarrative; run: ReportRun | null } | null {
    for (const narrative of this.catalog(workspaceId)) {
      if (narrative.narrativeId !== analysisId) continue;
      const run = narrative.reportRunId ? this.scopedRun(workspaceId, narrative.reportRunId) : null;
      return { narrative, run };
    }
    return null;
  }

  private narrate(
    kind: AiAnalyticsProductKind,
    cmd: AiAnalyticsReportRequest,
  ): AnalyticalNarrative {
    if (kind === 'explain') return this.ai.explain(cmd);
    if (kind === 'summarize') return this.ai.summarize(cmd);
    if (kind === 'trends') return this.ai.identifyTrends(cmd);
    return this.ai.generateNarrative(cmd);
  }

  private resolveReportRunId(
    workspaceId: string,
    reportRunId: string | undefined,
    libraryEntryId: string | undefined,
  ): string | null {
    if (reportRunId?.trim()) {
      const run = this.scopedRun(workspaceId, reportRunId.trim());
      return run ? run.reportRunId : reportRunId.trim();
    }
    if (!libraryEntryId?.trim()) return null;
    const cited = [...this.reportingQuery.listRuns({ workspaceId }).items]
      .filter((run) => runCitesLibrary(run, libraryEntryId.trim()))
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
    return cited[0]?.reportRunId ?? null;
  }

  private buildComparison(
    command: GenerateAiAnalyticsCommand,
    kind: AiAnalyticsProductKind,
    left: AnalyticalNarrative,
    leftRun: ReportRun | null,
  ) {
    const rightReportRunId = this.resolveReportRunId(
      command.workspaceId,
      command.compareReportRunId,
      command.compareLibraryEntryId,
    );
    if (!rightReportRunId || rightReportRunId === left.reportRunId) return null;
    const right = this.narrate(kind, {
      workspaceId: command.workspaceId,
      reportRunId: rightReportRunId,
      ...(command.focus !== undefined ? { focus: command.focus } : {}),
      ...(command.requestedAt !== undefined ? { requestedAt: command.requestedAt } : {}),
    });
    const rightRun = this.scopedRun(command.workspaceId, rightReportRunId);
    const slices = this.reporting.compareRuns({
      workspaceId: command.workspaceId,
      leftReportRunId: left.reportRunId ?? '',
      rightReportRunId,
    });
    return toComparisonView({
      left,
      right,
      slices,
      leftStrategy: this.strategyRef(leftRun),
      rightStrategy: this.strategyRef(rightRun),
    });
  }

  private toDetail(
    narrative: AnalyticalNarrative,
    run: ReportRun | null,
    comparison: ReturnType<typeof toComparisonView> | null,
  ): AiAnalyticsDetailView {
    return toDetailView({
      narrative,
      run,
      lakeFacts: this.lakeFacts(run),
      strategy: this.strategyRecord(run),
      comparison,
    });
  }

  private lakeFacts(run: ReportRun | null): AnalyticalFact[] {
    if (!run) return [];
    const facts: AnalyticalFact[] = [];
    for (const eventId of run.sourceSummary.lakeEventIds) {
      const fact = this.lakeQuery.getByEventId(eventId);
      if (fact && fact.workspaceId === run.workspaceId) facts.push(fact);
    }
    return facts;
  }

  private strategyRecord(run: ReportRun | null): StrategyVersionRecord | null {
    const libraryEntryId = run?.libraryEntryId;
    if (!libraryEntryId) return null;
    return this.libraryLookup.getByLibraryEntryId(libraryEntryId);
  }

  private strategyRef(run: ReportRun | null) {
    const libraryEntryId = run?.libraryEntryId;
    if (!libraryEntryId) return null;
    return toStrategyRefView(
      libraryEntryId,
      this.libraryLookup.getByLibraryEntryId(libraryEntryId),
    );
  }

  private scopedRun(workspaceId: string, reportRunId: string): ReportRun | null {
    const run = this.reportingQuery.getRun(reportRunId);
    if (!run || run.workspaceId !== workspaceId) return null;
    return run;
  }

  private matchesLibrary(narrative: AnalyticalNarrative, query: ListAiAnalyticsQuery): boolean {
    if (!query.libraryEntryId) return true;
    if (!narrative.reportRunId) return false;
    const run = this.scopedRun(query.workspaceId, narrative.reportRunId);
    return run ? runCitesLibrary(run, query.libraryEntryId) : false;
  }
}
