import { Link } from 'react-router-dom';
import type { OrchestrationPlanView } from '../shared/api';
import { formatUtc } from '../shared/formatUtc';
import { orchestrationLifecycleLabel } from './orchestration-wizard';

export function OrchestratorPlansView({
  items,
  loading,
  error,
}: {
  items: OrchestrationPlanView[];
  loading: boolean;
  error: string | null;
}) {
  return (
    <section className="space-y-6" data-testid="orchestrator-plans">
      <div>
        <p className="text-xs uppercase tracking-wide text-slate-500">Trading Orchestrator</p>
        <h2 className="mt-1 text-2xl font-semibold">Orchestration plans</h2>
        <p className="mt-2 text-slate-400">
          Coordination plans in this workspace. A plan describes intent and lifecycle. It does not
          start a Trading Session.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      <NavLinks />

      {loading && <p className="text-sm text-slate-500">Loading plans…</p>}
      {!loading && items.length === 0 && (
        <p className="text-sm text-slate-500" data-testid="orchestrator-plans-empty">
          No orchestration plans in this workspace.
        </p>
      )}

      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.orchestrationPlanId}>
            <Link
              to={`/orchestrator/plans/${item.orchestrationPlanId}`}
              data-testid="orchestrator-plan-link"
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-white/10 px-3 py-2 text-sm hover:border-white/20"
            >
              <span>
                {item.marketSymbol} <span className="text-slate-500">v{item.version}</span>
              </span>
              <span className="flex flex-wrap gap-2">
                <span className="rounded-full border border-white/10 px-2 py-0.5 text-xs">
                  {orchestrationLifecycleLabel(item.lifecycleStatus)}
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

export function OrchestratorPlanDetailView({
  record,
  loading,
  error,
}: {
  record: OrchestrationPlanView | null;
  loading: boolean;
  error: string | null;
}) {
  if (loading) {
    return (
      <section data-testid="orchestrator-plan-detail">
        <p className="text-sm text-slate-500">Loading plan…</p>
      </section>
    );
  }

  if (error || !record) {
    return (
      <section className="space-y-4" data-testid="orchestrator-plan-detail">
        <NavLinks />
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error ?? 'Orchestration plan not found.'}
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-6" data-testid="orchestrator-plan-detail">
      <NavLinks />
      <div>
        <p className="text-xs uppercase tracking-wide text-slate-500">Plan details</p>
        <h2 className="mt-1 text-2xl font-semibold">
          {record.marketSymbol} <span className="text-slate-400">v{record.version}</span>
        </h2>
        <p className="mt-2 text-slate-400">
          Intent and lifecycle only. createsSession remains false.
        </p>
      </div>
      <div className="rounded-xl border border-white/10 bg-white/5 p-5">
        <dl className="grid gap-3 sm:grid-cols-2">
          <Fact label="Lifecycle" value={orchestrationLifecycleLabel(record.lifecycleStatus)} />
          <Fact label="Reason" value={record.lifecycleReason} />
          <Fact label="Exchange Scope" value={record.exchangeScopeId} />
          <Fact label="Mode" value={record.modeContext} />
          <Fact label="Objective" value={record.objective} />
          <Fact label="Creates Session" value="false" />
        </dl>
        <p className="mt-3 text-sm text-slate-400">{record.rationaleSummary}</p>
      </div>
    </section>
  );
}

function NavLinks() {
  return (
    <div className="flex flex-wrap gap-3 text-sm">
      <Link to="/orchestrator" className="text-sky-400 hover:text-sky-300">
        Request orchestration
      </Link>
      <Link to="/orchestrator/plans" className="text-sky-400 hover:text-sky-300">
        Plans
      </Link>
      <Link to="/orchestrator/history" className="text-sky-400 hover:text-sky-300">
        History
      </Link>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-1 break-all text-sm text-slate-200">{value}</dd>
    </div>
  );
}
