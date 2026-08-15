/**
 * PC-15 15-c — Reporting projection of an attached Analytical Narrative.
 *
 * Not ReportRun SoT. Not a narrative owner. ReportRun is never mutated.
 * AI Analytics remains narrative-only.
 */
import type { AnalyticalNarrative } from '../ai-analytics/domain/analytical-narrative';
import type { ReportRun } from '../reporting/domain/report-run';
import type { ReportRunOutcome } from '../reporting/ports/reporting.port';

export type ReportRunNarrativeView = Readonly<{
  reportRunId: string;
  workspaceId: string;
  reportStatus: string | null;
  reportOutcome: ReportRunOutcome | 'missing';
  narrativeId: string;
  narrativeKind: AnalyticalNarrative['kind'];
  narrativeText: string;
  narrativeUnavailable: boolean;
  attached: true;
  reportMutated: false;
  forcesTrade: false;
  authorityClass: 'narrative';
}>;

export function toReportRunNarrativeView(input: {
  workspaceId: string;
  reportRunId: string;
  reportRun?: ReportRun | null;
  reportOutcome?: ReportRunOutcome | 'missing';
  narrative: AnalyticalNarrative;
}): ReportRunNarrativeView {
  const unavailable = input.narrative.modelMeta?.outcome === 'unavailable';
  return Object.freeze({
    reportRunId: input.reportRunId,
    workspaceId: input.workspaceId,
    reportStatus: input.reportRun?.status ?? null,
    reportOutcome:
      input.reportOutcome ?? (input.reportRun ? mapStatus(input.reportRun.status) : 'missing'),
    narrativeId: input.narrative.narrativeId,
    narrativeKind: input.narrative.kind,
    narrativeText: input.narrative.text,
    narrativeUnavailable: unavailable,
    attached: true as const,
    reportMutated: false as const,
    forcesTrade: false as const,
    authorityClass: 'narrative' as const,
  });
}

function mapStatus(status: string): ReportRunOutcome | 'missing' {
  if (status === 'completed' || status === 'empty' || status === 'rejected') {
    return status;
  }
  return 'missing';
}
