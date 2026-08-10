/**
 * RC-24 Epic 4 — Reporting Query Service (read-only).
 */

import { Inject, Injectable } from '@nestjs/common';
import { InMemoryReportingStore } from './adapters/in-memory-reporting-store';
import type { AggregationSlice } from './domain/aggregation-slice';
import type { ReportDefinition } from './domain/report-definition';
import type { ReportRun } from './domain/report-run';
import { REPORTING_DOMAIN_AUTHORITY_CLASS } from './domain/reporting-domain-shared';
import type {
  ReportDefinitionPage,
  ReportDefinitionQuery,
  ReportRunPage,
  ReportRunQuery,
  ReportingQueryPort,
} from './ports/reporting.port';

@Injectable()
export class ReportingQueryService implements ReportingQueryPort {
  constructor(
    @Inject(InMemoryReportingStore)
    private readonly store: InMemoryReportingStore,
  ) {}

  getDefinition(reportDefinitionId: string): ReportDefinition | null {
    return this.store.getDefinition(reportDefinitionId);
  }

  listDefinitions(query: ReportDefinitionQuery): ReportDefinitionPage {
    let items = this.store.listDefinitions(query.workspaceId);
    if (query.kind) {
      items = items.filter((d) => d.kind === query.kind);
    }
    if (query.limit !== undefined && query.limit >= 0) {
      items = items.slice(0, query.limit);
    }
    return Object.freeze({
      authorityClass: REPORTING_DOMAIN_AUTHORITY_CLASS,
      items: Object.freeze(items),
    });
  }

  getRun(reportRunId: string): ReportRun | null {
    return this.store.getRun(reportRunId);
  }

  listRuns(query: ReportRunQuery): ReportRunPage {
    let items = this.store.listRuns(query.workspaceId, query.reportDefinitionId);
    if (query.limit !== undefined && query.limit >= 0) {
      items = items.slice(0, query.limit);
    }
    return Object.freeze({
      authorityClass: REPORTING_DOMAIN_AUTHORITY_CLASS,
      items: Object.freeze(items),
    });
  }

  listAggregations(reportRunId: string): readonly AggregationSlice[] {
    return this.store.listAggregations(reportRunId);
  }
}
