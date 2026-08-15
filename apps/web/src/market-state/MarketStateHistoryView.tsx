import { Link } from 'react-router-dom';
import type { MarketStateVersionListItemView } from '../shared/api';
import { formatUtc } from '../shared/formatUtc';
import { lifecycleLabel, regimeLabel } from './market-state';

export function MarketStateHistoryView({
  items,
  loading,
  error,
}: {
  items: MarketStateVersionListItemView[];
  loading: boolean;
  error: string | null;
}) {
  return (
    <section className="space-y-6" data-testid="market-state-history">
      <div>
        <Link to="/market-state" className="text-sm text-sky-400 hover:text-sky-300">
          Market State home
        </Link>
        <p className="mt-3 text-xs uppercase tracking-wide text-slate-500">Market State</p>
        <h2 className="mt-1 text-2xl font-semibold">History</h2>
        <p className="mt-2 text-slate-400">
          Existing Market State versions for this workspace. History is not a second owner and does
          not classify markets.
        </p>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      {loading ? <p className="text-sm text-slate-500">Loading history…</p> : null}
      {!loading && items.length === 0 ? (
        <p className="text-sm text-slate-500">No Market State versions in this workspace.</p>
      ) : null}

      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.marketStateId}>
            <Link
              to={`/market-state/targets/${encodeURIComponent(item.targetId)}/versions/${item.version}`}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-white/10 px-3 py-2 text-sm hover:border-white/20"
            >
              <span>
                {item.marketSymbol} <span className="text-slate-500">v{item.version}</span>
                {item.isCurrent ? (
                  <span className="ml-2 text-xs text-emerald-300">current</span>
                ) : null}
              </span>
              <span className="flex gap-2">
                <span className="rounded-full border border-white/10 px-2 py-0.5 text-xs">
                  {regimeLabel(item.regimeLabel)}
                </span>
                <span className="rounded-full border border-white/10 px-2 py-0.5 text-xs">
                  {lifecycleLabel(item.lifecycleStatus)}
                </span>
                <span className="text-xs text-slate-500">{formatUtc(item.publishedAt)}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
