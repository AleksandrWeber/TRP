import { Link } from 'react-router-dom';
import type {
  ExchangeScopeListItemView,
  ExchangeScopeWorkspaceView,
  ExchangeVenueCatalogItemView,
} from '../shared/api';
import { ErrorBanner, LoadingState, PageHeader } from '../shared/product-ui';

export type ClusterCreateDraft = {
  venueCode: string;
  displayName: string;
  maxActiveSessions: string;
  modeContext: 'lab' | 'paper';
};

export function emptyClusterDraft(
  venues: readonly ExchangeVenueCatalogItemView[],
): ClusterCreateDraft {
  return {
    venueCode: venues[0]?.venueCode ?? 'binance',
    displayName: '',
    maxActiveSessions: '1',
    modeContext: 'paper',
  };
}

export function ClusterHomeView({
  workspace,
  draft,
  loading,
  creating,
  error,
  onDraft,
  onCreate,
}: {
  workspace: ExchangeScopeWorkspaceView | null;
  draft: ClusterCreateDraft | null;
  loading: boolean;
  creating: boolean;
  error: string | null;
  onDraft: (next: ClusterCreateDraft) => void;
  onCreate: () => void;
}) {
  const scopes = workspace?.scopes ?? [];
  const currentActive = workspace?.currentActive ?? [];
  const venues = workspace?.venues ?? [];

  return (
    <section className="space-y-6" data-testid="cluster-home">
      <PageHeader
        productId="cluster"
        title="Exchange Scope"
        description="Isolation boundary for this workspace. Cluster is Exchange Scope — not a live exchange connection, not Runtime, and not a Trading Session."
        extraActions={[
          { to: '/deployments', label: 'Deployment' },
          { to: '/orchestrator', label: 'Trading Orchestrator' },
        ]}
      />

      <ErrorBanner message={error} />

      {loading && !workspace ? (
        <LoadingState label="Loading Clusters…" />
      ) : (
        <>
          <dl className="grid gap-4 sm:grid-cols-4">
            <Stat label="Scopes" value={String(workspace?.scopeCount ?? 0)} />
            <Stat label="Active" value={String(workspace?.activeCount ?? 0)} />
            <Stat label="Suspended" value={String(workspace?.suspendedCount ?? 0)} />
            <Stat label="Archived" value={String(workspace?.archivedCount ?? 0)} />
          </dl>

          <section className="space-y-3 rounded-xl border border-white/10 bg-white/5 p-5">
            <h3 className="text-sm font-medium uppercase tracking-wide text-slate-400">
              Current active Cluster
            </h3>
            {currentActive.length === 0 ? (
              <p className="text-sm text-slate-500">No active Cluster in this workspace.</p>
            ) : (
              <ul className="space-y-2">
                {currentActive.map((scope) => (
                  <ScopeRow key={scope.exchangeScopeId} scope={scope} />
                ))}
              </ul>
            )}
          </section>

          <section className="space-y-3 rounded-xl border border-white/10 bg-white/5 p-5">
            <h3 className="text-sm font-medium uppercase tracking-wide text-slate-400">
              Exchange list
            </h3>
            <p className="text-sm text-slate-500">
              Known isolation venues. These are not live adapters and do not call exchange APIs.
            </p>
            <div className="flex flex-wrap gap-2">
              {venues.map((venue) => (
                <span
                  key={venue.venueCode}
                  className="rounded border border-slate-600/80 px-2 py-1 text-xs text-slate-300"
                >
                  {venue.label}
                </span>
              ))}
            </div>
          </section>

          {draft ? (
            <section className="space-y-4 rounded-xl border border-white/10 bg-white/5 p-5">
              <h3 className="text-sm font-medium uppercase tracking-wide text-slate-400">
                Create Cluster
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block space-y-1 text-sm">
                  <span className="text-slate-400">Venue</span>
                  <select
                    value={draft.venueCode}
                    onChange={(event) => onDraft({ ...draft, venueCode: event.target.value })}
                    data-testid="cluster-venue"
                    className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2"
                  >
                    {venues.map((venue) => (
                      <option key={venue.venueCode} value={venue.venueCode}>
                        {venue.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block space-y-1 text-sm">
                  <span className="text-slate-400">Display name</span>
                  <input
                    value={draft.displayName}
                    onChange={(event) => onDraft({ ...draft, displayName: event.target.value })}
                    data-testid="cluster-display-name"
                    className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2"
                  />
                </label>
                <label className="block space-y-1 text-sm">
                  <span className="text-slate-400">Max active sessions</span>
                  <input
                    value={draft.maxActiveSessions}
                    onChange={(event) =>
                      onDraft({ ...draft, maxActiveSessions: event.target.value })
                    }
                    className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2"
                  />
                </label>
                <label className="block space-y-1 text-sm">
                  <span className="text-slate-400">Mode</span>
                  <select
                    value={draft.modeContext}
                    onChange={(event) =>
                      onDraft({
                        ...draft,
                        modeContext: event.target.value as ClusterCreateDraft['modeContext'],
                      })
                    }
                    data-testid="cluster-mode"
                    className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2"
                  >
                    <option value="paper">Paper</option>
                    <option value="lab">Lab</option>
                  </select>
                </label>
              </div>
              <button
                type="button"
                disabled={creating || !draft.displayName.trim()}
                onClick={onCreate}
                data-testid="cluster-create"
                className="rounded border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-100 hover:bg-emerald-500/20 disabled:opacity-50"
              >
                Create Cluster
              </button>
            </section>
          ) : null}

          <section className="space-y-3 rounded-xl border border-white/10 bg-white/5 p-5">
            <h3 className="text-sm font-medium uppercase tracking-wide text-slate-400">
              Scope browser
            </h3>
            {scopes.length === 0 ? (
              <p className="text-sm text-slate-500">
                No Clusters in this workspace. Create one from the venue list.
              </p>
            ) : (
              <ul className="space-y-2" data-testid="cluster-browser">
                {scopes.map((scope) => (
                  <ScopeRow key={scope.exchangeScopeId} scope={scope} />
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </section>
  );
}

function ScopeRow({ scope }: { scope: ExchangeScopeListItemView }) {
  return (
    <li>
      <Link
        to={`/clusters/${encodeURIComponent(scope.exchangeScopeId)}`}
        className="flex items-center justify-between rounded-lg border border-white/5 px-3 py-2 text-sm hover:border-white/20"
      >
        <span>
          {scope.displayName}
          <span className="ml-2 text-slate-500">{scope.venueCode}</span>
        </span>
        <span className="rounded-full border border-white/10 px-2 py-0.5 text-xs text-slate-300">
          {scope.lifecycleStatus}
        </span>
      </Link>
    </li>
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
