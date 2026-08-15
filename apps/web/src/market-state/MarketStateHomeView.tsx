import { Link } from 'react-router-dom';
import type { MarketStateWorkspaceView } from '../shared/api';
import { formatUtc } from '../shared/formatUtc';
import { lifecycleLabel, regimeLabel } from './market-state';

export function MarketStateHomeView({
  workspace,
  loading,
  error,
}: {
  workspace: MarketStateWorkspaceView | null;
  loading: boolean;
  error: string | null;
}) {
  const current = workspace?.current ?? [];
  const recent = workspace?.recentVersions ?? [];

  return (
    <section className="space-y-6" data-testid="market-state-home">
      <div>
        <p className="text-xs uppercase tracking-wide text-slate-500">Market State</p>
        <h2 className="mt-1 text-2xl font-semibold">Market State</h2>
        <p className="mt-2 text-slate-400">
          Current-condition artifact for this workspace. Market State never classifies on this page,
          never selects a strategy, and never forces a trade. Qualification and Profile remain
          separate owners; this product shows their references.
        </p>
        <div className="mt-3 flex flex-wrap gap-3 text-sm">
          <Link to="/market-state/history" className="text-sky-400 hover:text-sky-300">
            History
          </Link>
          <Link to="/qualification" className="text-sky-400 hover:text-sky-300">
            Qualification
          </Link>
          <Link to="/market-profile" className="text-sky-400 hover:text-sky-300">
            Profile
          </Link>
          <Link to="/orchestrator" className="text-sky-400 hover:text-sky-300">
            Orchestrator
          </Link>
        </div>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      {loading && !workspace ? (
        <p className="text-slate-400">Loading Market State…</p>
      ) : (
        <>
          <dl className="grid gap-4 sm:grid-cols-3">
            <Stat label="Markets" value={String(workspace?.targetCount ?? 0)} />
            <Stat label="Current" value={String(workspace?.currentCount ?? 0)} />
            <Stat label="Versions" value={String(workspace?.versionCount ?? 0)} />
          </dl>

          <section className="space-y-3 rounded-xl border border-white/10 bg-white/5 p-5">
            <h3 className="text-sm font-medium uppercase tracking-wide text-slate-400">
              Current State
            </h3>
            {current.length === 0 ? (
              <p className="text-sm text-slate-500" data-testid="market-state-empty">
                No Market State versions in this workspace. This page does not classify markets.
                Existing current-condition artifacts appear here when published by Market State.
              </p>
            ) : (
              <ul className="space-y-2" data-testid="market-state-current">
                {current.map((item) => (
                  <li key={item.targetId}>
                    <Link
                      to={`/market-state/targets/${encodeURIComponent(item.targetId)}`}
                      className="flex items-center justify-between rounded-lg border border-white/5 px-3 py-2 text-sm hover:border-white/20"
                    >
                      <span>
                        {item.displayName}
                        <span className="ml-2 text-slate-500">v{item.version}</span>
                      </span>
                      <span className="flex gap-2">
                        <Badge>{regimeLabel(item.regimeLabel)}</Badge>
                        <Badge>{lifecycleLabel(item.lifecycleStatus)}</Badge>
                        <span className="text-xs text-slate-500">
                          {formatUtc(item.publishedAt)}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="space-y-3 rounded-xl border border-white/10 bg-white/5 p-5">
            <h3 className="text-sm font-medium uppercase tracking-wide text-slate-400">
              Recent versions
            </h3>
            {recent.length === 0 ? (
              <p className="text-sm text-slate-500">No Market State versions yet.</p>
            ) : (
              <ul className="space-y-2">
                {recent.map((item) => (
                  <li key={item.marketStateId}>
                    <Link
                      to={`/market-state/targets/${encodeURIComponent(item.targetId)}/versions/${item.version}`}
                      className="flex items-center justify-between rounded-lg border border-white/5 px-3 py-2 text-sm hover:border-white/20"
                    >
                      <span>
                        {item.marketSymbol} <span className="text-slate-500">v{item.version}</span>
                      </span>
                      <span className="text-xs text-slate-500">{formatUtc(item.publishedAt)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-5">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold">{value}</p>
    </div>
  );
}

function Badge({ children }: { children: string }) {
  return (
    <span className="rounded-full border border-white/10 px-2 py-0.5 text-xs text-slate-300">
      {children}
    </span>
  );
}
