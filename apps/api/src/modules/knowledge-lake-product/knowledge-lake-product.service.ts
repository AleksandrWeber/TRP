/**
 * PC-16 — product adapter over existing Knowledge Lake query ports.
 *
 * Delegates list/get/search/history/provenance/relationships to
 * KnowledgeLakeQueryPort. Composes Reporting and Strategy Library reads
 * for connected references. Does not admit, edit, delete, index, or
 * generate reports / narratives. Knowledge Lake remains warehouse owner.
 */

import { Inject, Injectable } from '@nestjs/common';
import {
  KNOWLEDGE_LAKE_QUERY_MAX_LIMIT,
  type AnalyticalFact,
  type AnalyticalFactQuery,
} from '../knowledge-lake';
import {
  KNOWLEDGE_LAKE_QUERY_PORT,
  type KnowledgeLakeQueryPort,
} from '../knowledge-lake/ports/knowledge-lake-query.port';
import { REPORTING_QUERY_PORT, type ReportingQueryPort } from '../reporting/ports/reporting.port';
import {
  STRATEGY_LIBRARY_LOOKUP_PORT,
  type StrategyLibraryLookupPort,
} from '../strategy-library/ports/strategy-library-lookup.port';
import {
  factMatchesQuery,
  reportCitesEntry,
  strategyIdFromFact,
  toDetailView,
  toHistoryPageView,
  toPageView,
  toProvenanceView,
  toRelationshipViews,
  type KnowledgeLakeDetailView,
  type KnowledgeLakeHistoryPageView,
  type KnowledgeLakePageView,
  type KnowledgeLakeProvenanceView,
  type KnowledgeLakeRelationshipPageView,
  type ListKnowledgeLakeQuery,
} from './knowledge-lake.view';

@Injectable()
export class KnowledgeLakeProductService {
  constructor(
    @Inject(KNOWLEDGE_LAKE_QUERY_PORT)
    private readonly lakeQuery: KnowledgeLakeQueryPort,
    @Inject(REPORTING_QUERY_PORT)
    private readonly reportingQuery: ReportingQueryPort,
    @Inject(STRATEGY_LIBRARY_LOOKUP_PORT)
    private readonly libraryLookup: StrategyLibraryLookupPort,
  ) {}

  list(query: ListKnowledgeLakeQuery): KnowledgeLakePageView {
    const page = this.lakeQuery.list(this.toLakeQuery(query));
    if (!query.q?.trim() && !query.libraryEntryId && !query.reportRunId) {
      return toPageView(page);
    }
    const cited = query.reportRunId
      ? this.citedEventIds(query.workspaceId, query.reportRunId)
      : null;
    const filtered = page.items.filter((fact) => {
      if (cited && !cited.has(fact.eventId)) return false;
      return factMatchesQuery(fact, query);
    });
    return toPageView({
      authorityClass: 'projection',
      items: Object.freeze(filtered),
      nextCursor: null,
    });
  }

  search(query: ListKnowledgeLakeQuery): KnowledgeLakePageView {
    return this.list({
      ...query,
      limit: query.limit ?? KNOWLEDGE_LAKE_QUERY_MAX_LIMIT,
    });
  }

  history(query: ListKnowledgeLakeQuery): KnowledgeLakeHistoryPageView {
    const page = this.lakeQuery.list(this.toLakeQuery({ ...query, limit: query.limit ?? 200 }));
    return toHistoryPageView(page.items);
  }

  relationships(workspaceId: string, entryId: string): KnowledgeLakeRelationshipPageView | null {
    const fact = this.scopedFact(workspaceId, entryId);
    if (!fact) return null;
    return {
      entryId: fact.eventId,
      items: toRelationshipViews(fact, this.relatedFacts(fact)),
      authorityClass: 'projection',
      ledgerSoT: false,
    };
  }

  provenance(workspaceId: string, entryId: string): KnowledgeLakeProvenanceView | null {
    const fact = this.scopedFact(workspaceId, entryId);
    return fact ? toProvenanceView(fact) : null;
  }

  get(workspaceId: string, entryId: string): KnowledgeLakeDetailView | null {
    const fact = this.scopedFact(workspaceId, entryId);
    if (!fact) return null;
    const related = this.relatedFacts(fact);
    const reports = this.reportingQuery
      .listRuns({ workspaceId })
      .items.filter((run) => reportCitesEntry(run, fact.eventId));
    const strategyId = strategyIdFromFact(fact);
    const strategy = strategyId ? this.libraryLookup.getByLibraryEntryId(strategyId) : null;
    return toDetailView({ fact, related, reports, strategy });
  }

  private scopedFact(workspaceId: string, entryId: string): AnalyticalFact | null {
    const fact = this.lakeQuery.getByEventId(entryId);
    if (!fact || fact.workspaceId !== workspaceId) return null;
    return fact;
  }

  private relatedFacts(fact: AnalyticalFact): AnalyticalFact[] {
    const seen = new Set<string>([fact.eventId]);
    const related: AnalyticalFact[] = [];
    const pushPage = (items: readonly AnalyticalFact[]) => {
      for (const item of items) {
        if (item.workspaceId !== fact.workspaceId || seen.has(item.eventId)) continue;
        seen.add(item.eventId);
        related.push(item);
      }
    };
    if (fact.correlationId) {
      pushPage(
        this.lakeQuery.list({
          workspaceId: fact.workspaceId,
          correlationId: fact.correlationId,
          limit: KNOWLEDGE_LAKE_QUERY_MAX_LIMIT,
        }).items,
      );
    }
    if (fact.tradingSessionId) {
      pushPage(
        this.lakeQuery.list({
          workspaceId: fact.workspaceId,
          tradingSessionId: fact.tradingSessionId,
          limit: KNOWLEDGE_LAKE_QUERY_MAX_LIMIT,
        }).items,
      );
    }
    return related;
  }

  private citedEventIds(workspaceId: string, reportRunId: string): Set<string> {
    const run = this.reportingQuery.getRun(reportRunId);
    if (!run || run.workspaceId !== workspaceId) return new Set();
    return new Set(run.sourceSummary.lakeEventIds);
  }

  private toLakeQuery(query: ListKnowledgeLakeQuery): AnalyticalFactQuery {
    const producers = splitCsv(query.producer);
    const categories = splitCsv(query.category);
    return {
      workspaceId: query.workspaceId,
      ...(categories ? { categories } : {}),
      ...(producers ? { producers } : {}),
      ...(query.mode ? { mode: query.mode } : {}),
      ...(query.tradingSessionId ? { tradingSessionId: query.tradingSessionId } : {}),
      ...(query.exchangeScopeId ? { exchangeScopeId: query.exchangeScopeId } : {}),
      ...(query.correlationId ? { correlationId: query.correlationId } : {}),
      ...(query.occurredFrom ? { occurredFrom: query.occurredFrom } : {}),
      ...(query.occurredTo ? { occurredTo: query.occurredTo } : {}),
      ...(query.limit !== undefined ? { limit: query.limit } : {}),
      ...(query.cursor ? { cursor: query.cursor } : {}),
    };
  }
}

function splitCsv(value: string | undefined): string[] | undefined {
  if (!value?.trim()) return undefined;
  const parts = value
    .split(',')
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
  return parts.length > 0 ? parts : undefined;
}
