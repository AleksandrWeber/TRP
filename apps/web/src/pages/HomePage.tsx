import { useEffect, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  api,
  statusColor,
  type Experiment,
  type KnowledgeEntry,
  type RuntimeHealthView,
  type Workflow,
} from '../shared/api';
import { useWorkspace } from '../app/WorkspaceContext';

export function HomePage() {
  const { activeWorkspace } = useWorkspace();
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [knowledge, setKnowledge] = useState<KnowledgeEntry[]>([]);
  const [paperSessions, setPaperSessions] = useState(0);
  const [runtimeStatus, setRuntimeStatus] = useState<string>('—');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setError(null);

    Promise.all([
      api.listWorkflows(),
      api.listExperiments(),
      api.listKnowledge(),
      api.listTradingSessions(),
      api.getRuntimeHealth(),
    ])
      .then(
        ([w, e, k, sessions, health]: [
          Workflow[],
          Experiment[],
          KnowledgeEntry[],
          { id: string }[],
          RuntimeHealthView,
        ]) => {
          if (cancelled) return;
          setWorkflows(w);
          setExperiments(e);
          setKnowledge(k);
          setPaperSessions(sessions.length);
          setRuntimeStatus(health.status);
        },
      )
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      });

    return () => {
      cancelled = true;
    };
  }, [activeWorkspace.id]);

  return (
    <section className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold">Overview</h2>
        <p className="mt-2 text-slate-400">
          Research operating overview.{' '}
          <Link to="/dashboard" className="text-sky-400 hover:text-sky-300">
            Open research dashboard
          </Link>
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
        <Stat label="Workflows" value={String(workflows.length)} to="/workflows" />
        <Stat label="Experiments" value={String(experiments.length)} to="/research" />
        <Stat label="Knowledge" value={String(knowledge.length)} to="/knowledge" />
        <Stat label="Paper sessions" value={String(paperSessions)} to="/command-center" />
        <Stat label="Runtime" value={runtimeStatus} to="/command-center" />
        <Stat label="Strategy Library" value="Browse" to="/strategy-library" />
        <Stat label="Certify" value="Admit" to="/strategy-library/certify" />
        <Stat label="Runtime Validation" value="Gate" to="/runtime-validation" />
        <Stat label="Deployment" value="Bind" to="/deployments" />
        <Stat label="Orchestrator" value="Coordinate" to="/orchestrator" />
        <Stat label="Qualification" value="Research" to="/qualification" />
        <Stat label="Profile" value="Versions" to="/market-profile" />
        <Stat label="Market State" value="Current" to="/market-state" />
        <Stat label="Reporting" value="Projections" to="/reporting" />
        <Stat label="Notifications" value="Delivery" to="/notifications" />
        <Stat label="Channels" value="Delivery" to="/notifications/channels" />
        <Stat label="Cluster" value="Isolation" to="/clusters" />
        <Stat label="Command Center" value="Operate" to="/command-center" />
        <Stat label="Paper Bots" value="Sandbox" to="/trading/paper" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Recent workflows">
          {workflows.slice(0, 5).map((wf) => (
            <Row key={wf.id} title={wf.type} badge={wf.status} />
          ))}
          {workflows.length === 0 && <Empty />}
        </Panel>
        <Panel title="Recent experiments">
          {experiments.slice(0, 5).map((ex) => (
            <Row
              key={ex.id}
              title={`${ex.strategyId} · ${ex.dataset?.symbol ?? '—'}`}
              badge={ex.verdict}
            />
          ))}
          {experiments.length === 0 && <Empty />}
        </Panel>
      </div>
    </section>
  );
}

function Stat({ label, value, to }: { label: string; value: string; to: string }) {
  return (
    <Link
      to={to}
      className="rounded-xl border border-white/10 bg-white/5 p-5 hover:border-white/20"
    >
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold">{value}</p>
    </Link>
  );
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-5">
      <h3 className="text-sm font-medium uppercase tracking-wide text-slate-400">{title}</h3>
      <div className="mt-3 space-y-2">{children}</div>
    </div>
  );
}

function Row({ title, badge }: { title: string; badge: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-white/5 px-3 py-2 text-sm">
      <span>{title}</span>
      <span className={`rounded-full border px-2 py-0.5 text-xs ${statusColor(badge)}`}>
        {badge.replace('_', ' ')}
      </span>
    </div>
  );
}

function Empty() {
  return <p className="text-sm text-slate-500">Nothing yet.</p>;
}
