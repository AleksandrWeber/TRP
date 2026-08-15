import { Inject, Injectable } from '@nestjs/common';
import type { AnalyticalNarrative } from '../ai-analytics/domain/analytical-narrative';
import { AI_ANALYTICS_PORT, type AIAnalyticsPort } from '../ai-analytics/ports/ai-analytics.port';
import type { ReportRun } from '../reporting/domain/report-run';
import {
  REPORTING_QUERY_PORT,
  REPORTING_SERVICE_PORT,
  type ReportRunResult,
  type ReportingQueryPort,
  type ReportingServicePort,
  type RequestReportRun,
} from '../reporting/ports/reporting.port';
import { toReportRunNarrativeView, type ReportRunNarrativeView } from './report-run-narrative.view';

export type RequestReportAndNarrateCommand = RequestReportRun &
  Readonly<{
    focus?: string;
  }>;

export type NarrateCompletedReportCommand = Readonly<{
  workspaceId: string;
  reportRunId: string;
  focus?: string;
  requestedAt?: string;
}>;

export type ReportNarrativeFlowResult = Readonly<{
  report: ReportRunResult;
  narrative: AnalyticalNarrative;
  attachment: ReportRunNarrativeView;
}>;

/**
 * PC-15 15-c — completed ReportRun invokes AI Analytics.
 *
 * Reporting remains report owner (request/query are delegated).
 * AI Analytics remains narrative only (generateNarrative is delegated).
 * AI never owns ReportRuns. Reporting never owns narratives.
 * ReportRun is never mutated. Lake is not imported here.
 */
@Injectable()
export class ReportNarrativeConsumerService {
  constructor(
    @Inject(REPORTING_SERVICE_PORT)
    private readonly reporting: ReportingServicePort,
    @Inject(REPORTING_QUERY_PORT)
    private readonly reportingQuery: ReportingQueryPort,
    @Inject(AI_ANALYTICS_PORT)
    private readonly ai: AIAnalyticsPort,
  ) {}

  requestAndNarrate(command: RequestReportAndNarrateCommand): ReportNarrativeFlowResult {
    const report = this.reporting.requestReportRun(command);
    const reportRunId =
      report.reportRun?.reportRunId ?? command.reportRunId?.trim() ?? 'unspecified';
    return this.attach(
      command.workspaceId,
      reportRunId,
      report,
      command.focus,
      command.requestedAt,
    );
  }

  narrateCompletedRun(command: NarrateCompletedReportCommand): ReportNarrativeFlowResult {
    const run = this.reportingQuery.getRun(command.reportRunId);
    const scoped = run && run.workspaceId === command.workspaceId ? run : null;
    const report: ReportRunResult = Object.freeze({
      outcome: scoped ? mapRunOutcome(scoped) : 'rejected',
      ...(scoped ? { reportRun: scoped } : {}),
      aggregations: scoped
        ? this.reportingQuery.listAggregations(command.reportRunId)
        : Object.freeze([]),
      ...(scoped ? {} : { rejectionReasons: Object.freeze(['report_run_not_found']) }),
      authorityClass: 'projection',
    });
    return this.attach(
      command.workspaceId,
      command.reportRunId,
      report,
      command.focus,
      command.requestedAt,
    );
  }

  getAttachedNarrative(command: NarrateCompletedReportCommand): ReportRunNarrativeView {
    return this.narrateCompletedRun(command).attachment;
  }

  private attach(
    workspaceId: string,
    reportRunId: string,
    report: ReportRunResult,
    focus?: string,
    requestedAt?: string,
  ): ReportNarrativeFlowResult {
    const narrative = this.ai.generateNarrative({
      workspaceId,
      reportRunId,
      ...(focus !== undefined ? { focus } : {}),
      ...(requestedAt !== undefined ? { requestedAt } : {}),
    });
    return Object.freeze({
      report,
      narrative,
      attachment: toReportRunNarrativeView({
        workspaceId,
        reportRunId,
        reportRun: report.reportRun ?? null,
        reportOutcome: report.outcome,
        narrative,
      }),
    });
  }
}

function mapRunOutcome(run: ReportRun): ReportRunResult['outcome'] {
  if (run.status === 'completed' || run.status === 'empty' || run.status === 'rejected') {
    return run.status;
  }
  return 'rejected';
}
