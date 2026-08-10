/**
 * RC-24 Epic 5 — AI Analytics Service.
 *
 * Consumes immutable ReportRun + AggregationSlice via ReportingQueryPort only.
 * Never reads Knowledge Lake, Trading Session, Strategy Library, Runtime Enforcement,
 * Orders, or Ledger directly. Never mutates reports. Never makes trading decisions.
 */

import { Inject, Injectable } from '@nestjs/common';
import type { ReportingQueryPort } from '../reporting/ports/reporting.port';
import type { AnalyticalNarrative, AnalyticalNarrativeKind } from './domain/analytical-narrative';
import {
  buildAnalyticalNarrativeFromReport,
  buildUnavailableNarrative,
} from './generation/build-analytical-narrative';
import {
  REPORTING_QUERY_CONSUMER,
  type AIAnalyticsPort,
  type AiAnalyticsReportRequest,
} from './ports/ai-analytics.port';

@Injectable()
export class AiAnalyticsService implements AIAnalyticsPort {
  constructor(
    @Inject(REPORTING_QUERY_CONSUMER)
    private readonly reportingQuery: ReportingQueryPort,
  ) {}

  explain(cmd: AiAnalyticsReportRequest): AnalyticalNarrative {
    return this.narrate('explain', cmd);
  }

  summarize(cmd: AiAnalyticsReportRequest): AnalyticalNarrative {
    return this.narrate('summarize', cmd);
  }

  identifyTrends(cmd: AiAnalyticsReportRequest): AnalyticalNarrative {
    return this.narrate('trends', cmd);
  }

  generateNarrative(cmd: AiAnalyticsReportRequest): AnalyticalNarrative {
    return this.narrate('narrative', cmd);
  }

  private narrate(
    kind: AnalyticalNarrativeKind,
    cmd: AiAnalyticsReportRequest,
  ): AnalyticalNarrative {
    const run = this.reportingQuery.getRun(cmd.reportRunId);
    if (!run || run.workspaceId !== cmd.workspaceId) {
      return buildUnavailableNarrative({
        workspaceId: cmd.workspaceId,
        reportRunId: cmd.reportRunId,
        kind,
        requestedAt: cmd.requestedAt,
      });
    }

    const slices = this.reportingQuery.listAggregations(cmd.reportRunId);

    // Never mutate Reporting artifacts — read-only consumption.
    return buildAnalyticalNarrativeFromReport({
      kind,
      run,
      slices,
      focus: cmd.focus,
      requestedAt: cmd.requestedAt,
    });
  }
}
