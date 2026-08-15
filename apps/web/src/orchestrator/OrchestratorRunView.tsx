import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { OrchestrationRunDetailView } from '../shared/api';
import { formatUtc } from '../shared/formatUtc';
import { orchestrationStatusLabel } from './orchestration-wizard';

export function OrchestratorRunView({
  record,
  loading,
  error,
}: {
  record: OrchestrationRunDetailView | null;
  loading: boolean;
  error: string | null;
}) {
  if (loading) {
    return (
      <section data-testid="orchestrator-run">
        <p className="text-sm text-slate-500">Loading orchestration…</p>
      </section>
    );
  }

  if (error || !record) {
    return (
      <section className="space-y-4" data-testid="orchestrator-run">
        <BackLinks />
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error ?? 'Orchestration run not found.'}
        </div>
      </section>
    );
  }

  const handoff = record.handoff;

  return (
    <section className="space-y-6" data-testid="orchestrator-run">
      <BackLinks />
      <div>
        <p className="text-xs uppercase tracking-wide text-slate-500">Orchestration lifecycle</p>
        <h2 className="mt-1 text-2xl font-semibold">{record.marketSymbol}</h2>
        <p className="mt-2 text-slate-400">
          Coordination progress only. Trading Session remains the Session owner.
        </p>
      </div>

      <span
        data-testid="orchestrator-run-status"
        className="rounded-full border border-white/10 px-2 py-0.5 text-xs"
      >
        {orchestrationStatusLabel(record.status)}
      </span>

      <Panel title="Lifecycle">
        <dl className="grid gap-3 sm:grid-cols-2">
          <Fact label="Status" value={orchestrationStatusLabel(record.status)} />
          <Fact label="Exchange Scope" value={record.exchangeScopeId} />
          <Fact label="Mode" value={record.modeContext} />
          <Fact label="Market State" value={record.marketStateId} />
          <Fact label="Updated" value={formatUtc(record.updatedAt)} />
          <Fact label="Owns Session" value="false" />
        </dl>
        {record.rejectionReasons.length > 0 && (
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-rose-300">
            {record.rejectionReasons.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel title="Selection">
        {record.selection ? (
          <dl className="grid gap-3 sm:grid-cols-2">
            <Fact label="Library entry" value={record.selection.libraryEntryId} />
            <Fact label="Strategy version" value={record.selection.strategyVersionId} />
            <Fact label="Envelope" value={record.selection.envelopeVersion} />
            <Fact label="Invents strategy" value="false" />
          </dl>
        ) : (
          <p className="text-sm text-slate-500">No selection decision yet.</p>
        )}
      </Panel>

      <Panel title="Session Handoff Intent">
        {handoff ? (
          <div data-testid="orchestrator-handoff-preview">
            <dl className="grid gap-3 sm:grid-cols-2">
              <Fact label="Intent id" value={handoff.sessionHandoffIntentId} />
              <Fact label="Deployment bind" value={handoff.deploymentBindRef} />
              <Fact label="Gate decision" value={handoff.enforcementDecisionRef} />
              <Fact label="Status" value={handoff.status} />
              <Fact label="Creates Session" value="false" />
              <Fact label="Is order" value="false" />
            </dl>
            <p className="mt-3 text-sm text-slate-400">
              This is an intent. Trading Session remains the Session owner. This page does not start
              a Bot.
            </p>
            <Link
              to={`/deployments/${handoff.deploymentBindRef}`}
              className="mt-3 inline-block text-sm text-sky-400 hover:text-sky-300"
            >
              View Deployment
            </Link>
          </div>
        ) : (
          <p className="text-sm text-slate-500">No Session Handoff Intent yet.</p>
        )}
      </Panel>
    </section>
  );
}

function BackLinks() {
  return (
    <div className="flex flex-wrap gap-3 text-sm">
      <Link to="/orchestrator" className="text-sky-400 hover:text-sky-300">
        Request orchestration
      </Link>
      <Link to="/orchestrator/history" className="text-sky-400 hover:text-sky-300">
        History
      </Link>
      <Link to="/orchestrator/plans" className="text-sky-400 hover:text-sky-300">
        Plans
      </Link>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-5">
      <h3 className="text-sm font-medium uppercase tracking-wide text-slate-400">{title}</h3>
      <div className="mt-3">{children}</div>
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
