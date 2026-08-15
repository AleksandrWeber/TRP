import { Link } from 'react-router-dom';
import type { ExchangeScopeListItemView, QualificationWorkspaceView } from '../shared/api';
import { formatUtc } from '../shared/formatUtc';
import {
  confidenceLabel,
  healthLabel,
  lifecycleLabel,
  modeLabel,
  runStatusLabel,
  type QualificationMode,
} from './qualification';

export type QualificationRequestDraft = {
  exchangeScopeId: string;
  marketSymbol: string;
  modeContext: QualificationMode;
};

export function emptyQualificationDraft(
  scopes: readonly ExchangeScopeListItemView[],
): QualificationRequestDraft {
  return {
    exchangeScopeId: scopes[0]?.exchangeScopeId ?? '',
    marketSymbol: '',
    modeContext: 'paper',
  };
}

export function QualificationHomeView({
  workspace,
  scopes,
  draft,
  loading,
  requesting,
  error,
  onDraft,
  onRequest,
}: {
  workspace: QualificationWorkspaceView | null;
  scopes: readonly ExchangeScopeListItemView[];
  draft: QualificationRequestDraft | null;
  loading: boolean;
  requesting: boolean;
  error: string | null;
  onDraft: (next: QualificationRequestDraft) => void;
  onRequest: () => void;
}) {
  const targets = workspace?.targets ?? [];
  const recentRuns = workspace?.recentRuns ?? [];

  return (
    <section className="space-y-6" data-testid="qualification-home">
      <div>
        <p className="text-xs uppercase tracking-wide text-slate-500">Qualification</p>
        <h2 className="mt-1 text-2xl font-semibold">Market Qualification</h2>
        <p className="mt-2 text-slate-400">
          Research artifact for this workspace. Qualification never forces a trade and never
          authorizes a session. Confidence and health are recorded snapshots — this page does not
          score markets.
        </p>
        <div className="mt-3 flex flex-wrap gap-3 text-sm">
          <Link to="/qualification/history" className="text-sky-400 hover:text-sky-300">
            Run history
          </Link>
          <Link to="/clusters" className="text-sky-400 hover:text-sky-300">
            Cluster
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
        <p className="text-slate-400">Loading Qualification…</p>
      ) : (
        <>
          <dl className="grid gap-4 sm:grid-cols-4">
            <Stat label="Targets" value={String(workspace?.targetCount ?? 0)} />
            <Stat label="Qualified" value={String(workspace?.qualifiedCount ?? 0)} />
            <Stat label="Qualifying" value={String(workspace?.qualifyingCount ?? 0)} />
            <Stat label="Runs" value={String(workspace?.runCount ?? 0)} />
          </dl>

          {draft ? (
            <section className="space-y-4 rounded-xl border border-white/10 bg-white/5 p-5">
              <h3 className="text-sm font-medium uppercase tracking-wide text-slate-400">
                Request qualification
              </h3>
              <p className="text-sm text-slate-500">
                Heavy work does not start until you confirm the run. This is not a session start.
              </p>
              <div className="grid gap-4 sm:grid-cols-3">
                <label className="block space-y-1 text-sm">
                  <span className="text-slate-400">Cluster</span>
                  <select
                    value={draft.exchangeScopeId}
                    onChange={(event) => onDraft({ ...draft, exchangeScopeId: event.target.value })}
                    data-testid="qualification-scope"
                    className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2"
                  >
                    {scopes.length === 0 ? (
                      <option value="">No Cluster in this workspace</option>
                    ) : (
                      scopes.map((scope) => (
                        <option key={scope.exchangeScopeId} value={scope.exchangeScopeId}>
                          {scope.displayName}
                        </option>
                      ))
                    )}
                  </select>
                </label>
                <label className="block space-y-1 text-sm">
                  <span className="text-slate-400">Market symbol</span>
                  <input
                    value={draft.marketSymbol}
                    onChange={(event) =>
                      onDraft({ ...draft, marketSymbol: event.target.value.toUpperCase() })
                    }
                    data-testid="qualification-symbol"
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
                        modeContext: event.target.value as QualificationMode,
                      })
                    }
                    data-testid="qualification-mode"
                    className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2"
                  >
                    <option value="paper">Paper</option>
                    <option value="lab">Lab</option>
                  </select>
                </label>
              </div>
              <button
                type="button"
                disabled={requesting || !draft.exchangeScopeId || !draft.marketSymbol.trim()}
                onClick={onRequest}
                data-testid="qualification-request"
                className="rounded border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-100 hover:bg-emerald-500/20 disabled:opacity-50"
              >
                Request qualification
              </button>
            </section>
          ) : null}

          <section className="space-y-3 rounded-xl border border-white/10 bg-white/5 p-5">
            <h3 className="text-sm font-medium uppercase tracking-wide text-slate-400">
              Target browser
            </h3>
            {targets.length === 0 ? (
              <p className="text-sm text-slate-500" data-testid="qualification-empty">
                No qualification targets in this workspace. Request one from a Cluster and market
                symbol.
              </p>
            ) : (
              <ul className="space-y-2" data-testid="qualification-browser">
                {targets.map((target) => (
                  <li key={target.targetId}>
                    <Link
                      to={`/qualification/targets/${encodeURIComponent(target.targetId)}`}
                      className="flex items-center justify-between rounded-lg border border-white/5 px-3 py-2 text-sm hover:border-white/20"
                    >
                      <span>
                        {target.displayName}
                        <span className="ml-2 text-slate-500">{target.marketSymbol}</span>
                      </span>
                      <span className="flex gap-2">
                        <Badge>{lifecycleLabel(target.lifecycleState)}</Badge>
                        <Badge>{confidenceLabel(target.confidenceLevel)}</Badge>
                        <Badge>{healthLabel(target.healthStatus)}</Badge>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="space-y-3 rounded-xl border border-white/10 bg-white/5 p-5">
            <h3 className="text-sm font-medium uppercase tracking-wide text-slate-400">
              Recent runs
            </h3>
            {recentRuns.length === 0 ? (
              <p className="text-sm text-slate-500">No qualification runs yet.</p>
            ) : (
              <ul className="space-y-2">
                {recentRuns.map((run) => (
                  <li key={run.qualificationRunId}>
                    <Link
                      to={`/qualification/runs/${encodeURIComponent(run.qualificationRunId)}`}
                      className="flex items-center justify-between rounded-lg border border-white/5 px-3 py-2 text-sm hover:border-white/20"
                    >
                      <span>
                        {run.marketSymbol ?? run.targetId}{' '}
                        <span className="text-slate-500">{modeLabel(run.modeContext)}</span>
                      </span>
                      <span className="flex gap-2">
                        <Badge>{runStatusLabel(run.status)}</Badge>
                        <span className="text-xs text-slate-500">{formatUtc(run.createdAt)}</span>
                      </span>
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
