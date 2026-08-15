import { Link } from 'react-router-dom';
import type { ReportRunListItemView } from '../shared/api';
import { formatUtc } from '../shared/formatUtc';
import { deliveryOutcomeLabel, modeBadgeLabel, reportStatusLabel } from './reporting';

export function ReportingHistoryView({
  items,
  loading,
  error,
}: {
  items: ReportRunListItemView[];
  loading: boolean;
  error: string | null;
}) {
  return (
    <section className="space-y-6" data-testid="reporting-history">
      <div>
        <p className="text-xs uppercase tracking-wide text-slate-500">Reporting</p>
        <h2 className="mt-1 text-2xl font-semibold">Report history</h2>
        <p className="mt-2 text-slate-400">
          Existing ReportRuns in this workspace, newest first. History is not a second report owner
          and not a ledger.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      <div className="flex flex-wrap gap-3 text-sm">
        <Link to="/reporting" className="text-sky-400 hover:text-sky-300">
          Reporting home
        </Link>
      </div>

      {loading && <p className="text-sm text-slate-500">Loading history…</p>}
      {!loading && items.length === 0 && (
        <p className="text-sm text-slate-500" data-testid="reporting-history-empty">
          No report history in this workspace.
        </p>
      )}

      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.reportRunId}>
            <Link
              to={`/reporting/${item.reportRunId}`}
              data-testid="reporting-history-link"
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-white/10 px-3 py-2 text-sm hover:border-white/20"
            >
              <span>
                {item.name} <span className="text-slate-500">{item.reportRunId}</span>
              </span>
              <span className="flex flex-wrap gap-2">
                <span className="rounded-full border border-white/10 px-2 py-0.5 text-xs">
                  {reportStatusLabel(item.status)}
                </span>
                <span className="rounded-full border border-white/10 px-2 py-0.5 text-xs">
                  {modeBadgeLabel(item.modes)}
                </span>
                <span className="rounded-full border border-white/10 px-2 py-0.5 text-xs">
                  {deliveryOutcomeLabel(item.deliveryOutcome)}
                </span>
                <span className="text-xs text-slate-500">{formatUtc(item.createdAt)}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
