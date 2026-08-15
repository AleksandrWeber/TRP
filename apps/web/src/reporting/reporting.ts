export type ReportStatusFilter = 'all' | 'completed' | 'empty' | 'rejected';
export type ReportKindFilter = 'all' | 'ops_daily' | 'ops_weekly' | 'research_summary' | 'custom';
export type ReportModeFilter = 'all' | 'paper' | 'live' | 'research' | 'system';

export const REPORT_STATUS_FILTERS: { id: ReportStatusFilter; label: string }[] = [
  { id: 'all', label: 'All statuses' },
  { id: 'completed', label: 'Completed' },
  { id: 'empty', label: 'Empty' },
  { id: 'rejected', label: 'Rejected' },
];

export const REPORT_KIND_FILTERS: { id: ReportKindFilter; label: string }[] = [
  { id: 'all', label: 'All kinds' },
  { id: 'ops_daily', label: 'Ops daily' },
  { id: 'ops_weekly', label: 'Ops weekly' },
  { id: 'research_summary', label: 'Research summary' },
  { id: 'custom', label: 'Custom' },
];

export const REPORT_MODE_FILTERS: { id: ReportModeFilter; label: string }[] = [
  { id: 'all', label: 'All modes' },
  { id: 'paper', label: 'Paper' },
  { id: 'live', label: 'Live (labeled projection)' },
  { id: 'research', label: 'Research' },
  { id: 'system', label: 'System' },
];

export function reportStatusLabel(status: string): string {
  switch (status) {
    case 'completed':
      return 'Completed';
    case 'empty':
      return 'Empty';
    case 'rejected':
      return 'Rejected';
    default:
      return status;
  }
}

export function reportKindLabel(kind: string): string {
  switch (kind) {
    case 'ops_daily':
      return 'Ops daily';
    case 'ops_weekly':
      return 'Ops weekly';
    case 'research_summary':
      return 'Research summary';
    case 'custom':
      return 'Custom';
    default:
      return kind;
  }
}

export function deliveryOutcomeLabel(outcome: string | null): string {
  if (!outcome) return 'Not delivered';
  switch (outcome) {
    case 'delivered':
      return 'Delivered';
    case 'skipped':
      return 'Skipped';
    case 'failed':
      return 'Failed';
    case 'not-invoked':
      return 'Not invoked';
    default:
      return outcome;
  }
}

export function modeBadgeLabel(modes: readonly string[]): string {
  if (modes.includes('paper') && modes.includes('live')) return 'paper / live';
  if (modes.includes('paper')) return 'paper';
  if (modes.includes('live')) return 'live (projection)';
  return modes.join(' / ') || 'unlabeled';
}

export function buildReportListQuery(input: {
  search: string;
  status: ReportStatusFilter;
  kind: ReportKindFilter;
  mode: ReportModeFilter;
}) {
  return {
    ...(input.search.trim() ? { q: input.search.trim() } : {}),
    ...(input.status !== 'all' ? { status: input.status } : {}),
    ...(input.kind !== 'all' ? { kind: input.kind } : {}),
    ...(input.mode !== 'all' ? { mode: input.mode } : {}),
  };
}

export function buildProjectionExport(detail: {
  reportRunId: string;
  workspaceId: string;
  name: string;
  kind: string;
  status: string;
  modes: readonly string[];
  createdAt: string;
  aggregations: readonly unknown[];
}): string {
  return JSON.stringify(
    {
      authorityClass: 'projection',
      ledgerSoT: false,
      exportKind: 'projection-json',
      reportRunId: detail.reportRunId,
      workspaceId: detail.workspaceId,
      name: detail.name,
      kind: detail.kind,
      status: detail.status,
      modes: detail.modes,
      createdAt: detail.createdAt,
      aggregations: detail.aggregations,
    },
    null,
    2,
  );
}
