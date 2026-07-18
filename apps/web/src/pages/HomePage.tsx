import { useEffect, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  api,
  statusColor,
  type Deployment,
  type Experiment,
  type KnowledgeEntry,
  type Workflow,
} from '../shared/api';
import { useWorkspace } from '../app/WorkspaceContext';

export function HomePage() {
  const { activeWorkspace } = useWorkspace();
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [knowledge, setKnowledge] = useState<KnowledgeEntry[]>([]);
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setError(null);

    Promise.all([
      api.listWorkflows(),
      api.listExperiments(),
      api.listKnowledge(),
      api.listDeployments(),
    ])
      .then(([w, e, k, d]) => {
        if (cancelled) return;
        setWorkflows(w);
        setExperiments(e);
        setKnowledge(k);
        setDeployments(d);
      })
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
        <h2 className="text-2xl font-semibold">Dashboard</h2>
        <p className="mt-2 text-slate-400">
          Implementation 017 — operational overview of workflows, research, knowledge, and
          production.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Workflows" value={String(workflows.length)} to="/workflows" />
        <Stat label="Experiments" value={String(experiments.length)} to="/research" />
        <Stat label="Knowledge" value={String(knowledge.length)} to="/knowledge" />
        <Stat label="Deployments" value={String(deployments.length)} to="/production" />
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
