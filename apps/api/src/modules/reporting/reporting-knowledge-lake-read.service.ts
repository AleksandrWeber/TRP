/**
 * RC-24 Epic 2 — Reporting Knowledge Lake read consumer.
 *
 * Thin read-only facade over KnowledgeLakeQueryPort.
 * No report generation. No aggregation. No narratives. No Lake writes.
 *
 * No caching of Lake facts as Reporting SoT — every call delegates to Lake.
 */

import { Inject, Injectable } from '@nestjs/common';
import type { KnowledgeLakeQueryPort } from '../knowledge-lake/ports/knowledge-lake-query.port';
import {
  toAnalyticalFactQuery,
  toReportingAnalyticalFact,
  toReportingAnalyticalFactPage,
  type ReportingAnalyticalFact,
  type ReportingAnalyticalFactPage,
  type ReportingAnalyticalFactQuery,
} from './domain/reporting-analytical-read-model';
import { KNOWLEDGE_LAKE_QUERY_CONSUMER } from './ports/reporting.port';

@Injectable()
export class ReportingKnowledgeLakeReadService {
  constructor(
    @Inject(KNOWLEDGE_LAKE_QUERY_CONSUMER)
    private readonly lakeQuery: KnowledgeLakeQueryPort,
  ) {}

  /**
   * Fetch one analytical fact by eventId as a Reporting projection.
   * Returns null when missing.
   */
  getByEventId(eventId: string): ReportingAnalyticalFact | null {
    const fact = this.lakeQuery.getByEventId(eventId);
    return fact ? toReportingAnalyticalFact(fact) : null;
  }

  /**
   * List analytical facts matching Reporting-allowed filters.
   * Always returns `authorityClass: 'projection'`. Empty windows yield empty items.
   */
  list(query: ReportingAnalyticalFactQuery): ReportingAnalyticalFactPage {
    const page = this.lakeQuery.list(toAnalyticalFactQuery(query));
    return toReportingAnalyticalFactPage(page);
  }
}
