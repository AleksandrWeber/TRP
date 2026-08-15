import { Link } from 'react-router-dom';
import type { MarketProfileWorkspaceView } from '../shared/api';
import { formatUtc } from '../shared/formatUtc';
import { confidenceLabel } from './market-profile';

export function MarketProfileHomeView({
  workspace,
  loading,
  error,
}: {
  workspace: MarketProfileWorkspaceView | null;
  loading: boolean;
  error: string | null;
}) {
  const latest = workspace?.latest ?? [];
  const recent = workspace?.recentVersions ?? [];

  return (
    <section className="space-y-6" data-testid="market-profile-home">
      <div>
        <p className="text-xs uppercase tracking-wide text-slate-500">Profile</p>
        <h2 className="mt-1 text-2xl font-semibold">Market Profile</h2>
        <p className="mt-2 text-slate-400">
          Versioned research artifact for this workspace. Profile never forces a trade, never
          authorizes a session, and does not calculate dimensions on this page. Consumers already
          read the latest published version.
        </p>
        <div className="mt-3 flex flex-wrap gap-3 text-sm">
          <Link to="/market-profile/history" className="text-sky-400 hover:text-sky-300">
            Version history
          </Link>
          <Link to="/qualification" className="text-sky-400 hover:text-sky-300">
            Qualification
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
        <p className="text-slate-400">Loading Market Profile…</p>
      ) : (
        <>
          <dl className="grid gap-4 sm:grid-cols-3">
            <Stat label="Markets" value={String(workspace?.targetCount ?? 0)} />
            <Stat label="Latest" value={String(workspace?.latestCount ?? 0)} />
            <Stat label="Versions" value={String(workspace?.versionCount ?? 0)} />
          </dl>

          <section className="space-y-3 rounded-xl border border-white/10 bg-white/5 p-5">
            <h3 className="text-sm font-medium uppercase tracking-wide text-slate-400">
              Latest Profile
            </h3>
            {latest.length === 0 ? (
              <p className="text-sm text-slate-500" data-testid="market-profile-empty">
                No published Profile versions in this workspace. Complete Qualification to publish
                via the existing pipeline.
              </p>
            ) : (
              <ul className="space-y-2" data-testid="market-profile-latest">
                {latest.map((item) => (
                  <li key={item.targetId}>
                    <Link
                      to={`/market-profile/targets/${encodeURIComponent(item.targetId)}`}
                      className="flex items-center justify-between rounded-lg border border-white/5 px-3 py-2 text-sm hover:border-white/20"
                    >
                      <span>
                        {item.displayName}
                        <span className="ml-2 text-slate-500">v{item.version}</span>
                      </span>
                      <span className="flex gap-2">
                        <Badge>{confidenceLabel(item.confidenceLevel)}</Badge>
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
              <p className="text-sm text-slate-500">No Profile versions yet.</p>
            ) : (
              <ul className="space-y-2">
                {recent.map((item) => (
                  <li key={item.marketProfileId}>
                    <Link
                      to={`/market-profile/targets/${encodeURIComponent(item.targetId)}/versions/${item.version}`}
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
