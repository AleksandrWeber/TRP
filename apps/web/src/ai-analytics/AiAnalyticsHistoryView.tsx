import { Link } from 'react-router-dom';
import type { AiAnalyticsHistoryItemView } from '../shared/api';
import { formatUtc } from '../shared/formatUtc';
import { kindLabel } from './ai-analytics';

export function AiAnalyticsHistoryView({
  items,
  loading,
  error,
}: {
  items: AiAnalyticsHistoryItemView[];
  loading: boolean;
  error: string | null;
}) {
  return (
    <section className="space-y-6" data-testid="ai-analytics-history">
      <div>
        <p className="text-xs uppercase tracking-wide text-slate-500">AI Analytics</p>
        <h2 className="mt-1 text-2xl font-semibold">History</h2>
        <p className="mt-2 text-slate-400">
          Existing analyses derived from ReportRuns, newest first. History is not a new warehouse
          and does not persist a second Source of Truth.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      <div className="flex flex-wrap gap-3 text-sm">
        <Link to="/ai-analytics" className="text-sky-400 hover:text-sky-300">
          AI Analytics home
        </Link>
      </div>

      {loading && <p className="text-sm text-slate-500">Loading history…</p>}
      {!loading && items.length === 0 && (
        <p className="text-sm text-slate-500" data-testid="ai-analytics-history-empty">
          No analysis history in this workspace.
        </p>
      )}

      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.analysisId}>
            <Link
              to={`/ai-analytics/${item.analysisId}`}
              data-testid="ai-analytics-history-link"
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-white/10 px-3 py-2 text-sm hover:border-white/20"
            >
              <span>
                {kindLabel(item.kind)} <span className="text-slate-500">{item.analysisId}</span>
              </span>
              <span className="text-xs text-slate-500">{formatUtc(item.generatedAt)}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
