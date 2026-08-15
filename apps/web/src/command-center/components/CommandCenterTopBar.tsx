import { Link } from 'react-router-dom';

type Props = {
  onRefresh?: () => void;
  refreshing?: boolean;
};

/**
 * Command Center top section (UI Contract A.2).
 * Manual Refresh re-fetches projections only (Epic 2).
 */
export function CommandCenterTopBar({ onRefresh, refreshing = false }: Props) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4" data-testid="cc-top-bar">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Operations</p>
        <h2 className="mt-1 text-2xl font-semibold">Command Center</h2>
        <p className="mt-2 text-slate-400">
          Paper-first operations console. Projections are non-authoritative. Trading Session owns
          lifecycle.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Link
          to="/command-center/new"
          className="rounded border border-sky-500/40 px-3 py-2 text-sm text-sky-200 hover:bg-sky-500/10 focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-sky-400"
          data-testid="cc-create-bot"
        >
          Create paper bot
        </Link>
        <button
          type="button"
          onClick={onRefresh}
          disabled={!onRefresh || refreshing}
          className="rounded border border-white/15 px-3 py-2 text-sm text-slate-300 hover:bg-white/5 focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-sky-400 disabled:cursor-not-allowed disabled:opacity-40"
          data-testid="cc-manual-refresh"
          aria-label="Manual Refresh"
        >
          {refreshing ? 'Refreshing…' : 'Manual Refresh'}
        </button>
      </div>
    </div>
  );
}
