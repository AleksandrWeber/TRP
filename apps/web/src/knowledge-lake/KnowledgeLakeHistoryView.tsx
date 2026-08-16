import { Link } from 'react-router-dom';
import type { KnowledgeLakeHistoryItemView } from '../shared/api';
import { formatUtc } from '../shared/formatUtc';
import { modeBadgeLabel } from './knowledge-lake';

export function KnowledgeLakeHistoryView({
  items,
  loading,
  error,
}: {
  items: KnowledgeLakeHistoryItemView[];
  loading: boolean;
  error: string | null;
}) {
  return (
    <section className="space-y-6" data-testid="knowledge-lake-history">
      <div>
        <p className="text-xs uppercase tracking-wide text-slate-500">Knowledge Lake</p>
        <h2 className="mt-1 text-2xl font-semibold">Ingestion history</h2>
        <p className="mt-2 text-slate-400">
          Existing admitted projections, newest first. History is not a second warehouse and does
          not ingest knowledge.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      <div className="flex flex-wrap gap-3 text-sm">
        <Link to="/knowledge-lake" className="text-sky-400 hover:text-sky-300">
          Knowledge Lake home
        </Link>
      </div>

      {loading && <p className="text-sm text-slate-500">Loading history…</p>}
      {!loading && items.length === 0 && (
        <p className="text-sm text-slate-500" data-testid="knowledge-lake-history-empty">
          No ingestion history in this workspace.
        </p>
      )}

      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.entryId}>
            <Link
              to={`/knowledge-lake/${item.entryId}`}
              data-testid="knowledge-lake-history-link"
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-white/10 px-3 py-2 text-sm hover:border-white/20"
            >
              <span>
                {item.producer} <span className="text-slate-500">{item.entryId}</span>
              </span>
              <span className="flex flex-wrap gap-2">
                <span className="rounded-full border border-white/10 px-2 py-0.5 text-xs">
                  {item.category}
                </span>
                <span className="rounded-full border border-white/10 px-2 py-0.5 text-xs">
                  {modeBadgeLabel(item.mode)}
                </span>
                <span className="text-xs text-slate-500">{formatUtc(item.ingestedAt)}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
