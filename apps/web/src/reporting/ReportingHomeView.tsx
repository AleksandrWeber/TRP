import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { ReportRunListItemView } from '../shared/api';
import { formatUtc } from '../shared/formatUtc';
import { EmptyState, ErrorBanner, LoadingState, PageHeader } from '../shared/product-ui';
import {
  REPORT_KIND_FILTERS,
  REPORT_MODE_FILTERS,
  REPORT_STATUS_FILTERS,
  deliveryOutcomeLabel,
  modeBadgeLabel,
  reportKindLabel,
  reportStatusLabel,
  type ReportKindFilter,
  type ReportModeFilter,
  type ReportStatusFilter,
} from './reporting';

export function ReportingHomeView({
  items,
  search,
  status,
  kind,
  mode,
  loading,
  error,
  onSearch,
  onStatus,
  onKind,
  onMode,
}: {
  items: ReportRunListItemView[];
  search: string;
  status: ReportStatusFilter;
  kind: ReportKindFilter;
  mode: ReportModeFilter;
  loading: boolean;
  error: string | null;
  onSearch: (value: string) => void;
  onStatus: (value: ReportStatusFilter) => void;
  onKind: (value: ReportKindFilter) => void;
  onMode: (value: ReportModeFilter) => void;
}) {
  return (
    <section className="space-y-6" data-testid="reporting-home">
      <PageHeader
        productId="reporting"
        title="Report runs"
        description="Analytical projections for this workspace. These are not the ledger Source of Truth. Reporting owns the report. AI remains narrative only. Notification remains delivery only."
        extraActions={[
          { to: '/reporting/history', label: 'Report history' },
          { to: '/command-center', label: 'Command Center' },
          { to: '/ai-analytics', label: 'AI Analytics' },
        ]}
      />

      <ErrorBanner message={error} />

      <div className="flex flex-wrap items-end gap-3">
        <label className="block space-y-1 text-sm">
          <span className="text-slate-400">Search</span>
          <input
            value={search}
            onChange={(event) => onSearch(event.target.value)}
            placeholder="Name, id, session, kind"
            data-testid="reporting-search"
            className="w-full min-w-[16rem] rounded-lg border border-white/10 bg-black/30 px-3 py-2"
          />
        </label>
        <FilterSelect
          label="Status"
          testId="reporting-filter-status"
          value={status}
          options={REPORT_STATUS_FILTERS}
          onChange={onStatus}
        />
        <FilterSelect
          label="Kind"
          testId="reporting-filter-kind"
          value={kind}
          options={REPORT_KIND_FILTERS}
          onChange={onKind}
        />
        <FilterSelect
          label="Mode"
          testId="reporting-filter-mode"
          value={mode}
          options={REPORT_MODE_FILTERS}
          onChange={onMode}
        />
      </div>

      {loading && <LoadingState label="Loading report runs…" />}
      {!loading && items.length === 0 && (
        <EmptyState
          testId="reporting-empty"
          title="No report runs in this workspace."
          description="Reports are generated from completed sessions; this page does not create a new report engine."
          actionTo="/command-center"
          actionLabel="Open Command Center"
        />
      )}

      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.reportRunId}>
            <Link
              to={`/reporting/${item.reportRunId}`}
              data-testid="reporting-run-link"
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-white/10 px-3 py-2 text-sm hover:border-white/20"
            >
              <span>
                {item.name} <span className="text-slate-500">{reportKindLabel(item.kind)}</span>
              </span>
              <span className="flex flex-wrap gap-2">
                <Badge>{reportStatusLabel(item.status)}</Badge>
                <Badge>{modeBadgeLabel(item.modes)}</Badge>
                <Badge>{deliveryOutcomeLabel(item.deliveryOutcome)}</Badge>
                <span className="text-xs text-slate-500">{formatUtc(item.createdAt)}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

function FilterSelect<T extends string>({
  label,
  testId,
  value,
  options,
  onChange,
}: {
  label: string;
  testId: string;
  value: T;
  options: { id: T; label: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <label className="block space-y-1 text-sm">
      <span className="text-slate-400">{label}</span>
      <select
        value={value}
        data-testid={testId}
        onChange={(event) => onChange(event.target.value as T)}
        className="rounded-lg border border-white/10 bg-black/30 px-3 py-2"
      >
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function Badge({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-full border border-white/10 px-2 py-0.5 text-xs text-slate-300">
      {children}
    </span>
  );
}
