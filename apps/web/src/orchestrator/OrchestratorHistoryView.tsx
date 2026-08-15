import { Link } from 'react-router-dom';
import type { OrchestrationRunView } from '../shared/api';
import { formatUtc } from '../shared/formatUtc';
import { orchestrationStatusLabel } from './orchestration-wizard';

export function OrchestratorHistoryView({
  items,
  loading,
  error,
}: {
  items: OrchestrationRunView[];
  loading: boolean;
  error: string | null;
}) {
  return (
    <section className="space-y-6" data-testid="orchestrator-history">
      <div>
        <p className="text-xs uppercase tracking-wide text-slate-500">Trading Orchestrator</p>
        <h2 className="mt-1 text-2xl font-semibold">Orchestration history</h2>
        <p className="mt-2 text-slate-400">
          Coordination runs in this workspace. History is not a second Session owner.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      <div className="flex flex-wrap gap-3 text-sm">
        <Link to="/orchestrator" className="text-sky-400 hover:text-sky-300">
          Request orchestration
        </Link>
        <Link to="/orchestrator/plans" className="text-sky-400 hover:text-sky-300">
          Plans
        </Link>
      </div>

      {loading && <p className="text-sm text-slate-500">Loading history…</p>}
      {!loading && items.length === 0 && (
        <p className="text-sm text-slate-500" data-testid="orchestrator-history-empty">
          No orchestration runs in this workspace.
        </p>
      )}

      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.orchestrationRunId}>
            <Link
              to={`/orchestrator/runs/${item.orchestrationRunId}`}
              data-testid="orchestrator-run-link"
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-white/10 px-3 py-2 text-sm hover:border-white/20"
            >
              <span>
                {item.marketSymbol} <span className="text-slate-500">{item.exchangeScopeId}</span>
              </span>
              <span className="flex flex-wrap gap-2">
                <span className="rounded-full border border-white/10 px-2 py-0.5 text-xs">
                  {orchestrationStatusLabel(item.status)}
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
