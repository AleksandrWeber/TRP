import { Link } from 'react-router-dom';
import type { QualificationRunListItemView } from '../shared/api';
import { formatUtc } from '../shared/formatUtc';
import { modeLabel, runStatusLabel } from './qualification';

export function QualificationHistoryView({
  items,
  loading,
  error,
}: {
  items: QualificationRunListItemView[];
  loading: boolean;
  error: string | null;
}) {
  return (
    <section className="space-y-6" data-testid="qualification-history">
      <div>
        <Link to="/qualification" className="text-sm text-sky-400 hover:text-sky-300">
          Qualification home
        </Link>
        <p className="mt-3 text-xs uppercase tracking-wide text-slate-500">Qualification</p>
        <h2 className="mt-1 text-2xl font-semibold">Run history</h2>
        <p className="mt-2 text-slate-400">
          Existing qualification runs for this workspace. History is not a second owner and does not
          score markets.
        </p>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      {loading ? <p className="text-sm text-slate-500">Loading run history…</p> : null}
      {!loading && items.length === 0 ? (
        <p className="text-sm text-slate-500">No qualification runs in this workspace.</p>
      ) : null}

      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.qualificationRunId}>
            <Link
              to={`/qualification/runs/${encodeURIComponent(item.qualificationRunId)}`}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-white/10 px-3 py-2 text-sm hover:border-white/20"
            >
              <span>
                {item.marketSymbol ?? item.targetId}{' '}
                <span className="text-slate-500">{modeLabel(item.modeContext)}</span>
              </span>
              <span className="flex gap-2">
                <span className="rounded-full border border-white/10 px-2 py-0.5 text-xs">
                  {runStatusLabel(item.status)}
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
