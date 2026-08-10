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
          Operations workspace for visibility and control. Projections are non-authoritative.
        </p>
      </div>
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
  );
}
