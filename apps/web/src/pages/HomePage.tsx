import { useEffect, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  api,
  type Experiment,
  type KnowledgeEntry,
  type RuntimeHealthView,
  type Workflow,
} from '../shared/api';
import {
  EmptyState,
  ErrorBanner,
  LoadingState,
  OPERATOR_JOURNEY,
  StatusBadge,
} from '../shared/product-ui';
import { useWorkspace } from '../app/WorkspaceContext';

export function HomePage() {
  const { activeWorkspace } = useWorkspace();
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [knowledge, setKnowledge] = useState<KnowledgeEntry[]>([]);
  const [paperSessions, setPaperSessions] = useState(0);
  const [runtimeStatus, setRuntimeStatus] = useState<string>('—');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    setLoading(true);

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
          setLoading(false);
        },
      )
      .catch((err: Error) => {
        if (!cancelled) {
          setError(err.message);
          setLoading(false);
        }
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
          Paper-first operator overview. Follow the certified path below, or open the{' '}
          <Link
            to="/dashboard"
            className="text-sky-400 hover:text-sky-300 focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-sky-400"
          >
            research dashboard
          </Link>
          .
        </p>
      </div>

      <ErrorBanner message={error} />
      {loading ? <LoadingState label="Loading overview…" /> : null}

      <section className="space-y-3" data-testid="operator-journey">
        <h3 className="text-sm font-medium uppercase tracking-wide text-slate-400">
          Paper-first journey
        </h3>
        <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {OPERATOR_JOURNEY.map((step, index) => (
            <li key={step.id}>
              <Link
                to={step.path}
                data-testid={`journey-step-${step.id}`}
                className="block h-full rounded-xl border border-white/10 bg-white/5 p-4 hover:border-white/20 focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-sky-400"
              >
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  {String(index + 1).padStart(2, '0')}
                </p>
                <p className="mt-1 font-medium">{step.label}</p>
                <p className="mt-1 text-xs text-slate-500">{step.description}</p>
              </Link>
            </li>
          ))}
        </ol>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Workflows" value={String(workflows.length)} to="/workflows" />
        <Stat label="Experiments" value={String(experiments.length)} to="/research" />
        <Stat label="Knowledge" value={String(knowledge.length)} to="/knowledge" />
        <Stat label="Paper sessions" value={String(paperSessions)} to="/command-center" />
        <Stat label="Runtime" value={runtimeStatus} to="/command-center" />
        <Stat label="Strategy Library" value="Browse" to="/strategy-library" />
        <Stat label="Paper Bots" value="Sandbox" to="/trading/paper" />
        <Stat label="Command Center" value="Operate" to="/command-center" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Recent workflows">
          {workflows.slice(0, 5).map((wf) => (
            <Row key={wf.id} title={wf.type} badge={wf.status} />
          ))}
          {workflows.length === 0 && (
            <EmptyState
              title="No workflows yet"
              description="Start research evidence from Lab or Campaign."
              actionTo="/lab"
              actionLabel="Open Lab"
            />
          )}
        </Panel>
        <Panel title="Recent experiments">
          {experiments.slice(0, 5).map((ex) => (
            <Row
              key={ex.id}
              title={`${ex.strategyId} · ${ex.dataset?.symbol ?? '—'}`}
              badge={ex.verdict}
            />
          ))}
          {experiments.length === 0 && (
            <EmptyState
              title="No experiments yet"
              description="Run research, then certify a candidate into Strategy Library."
              actionTo="/research"
              actionLabel="Open Research"
            />
          )}
        </Panel>
      </div>
    </section>
  );
}

function Stat({ label, value, to }: { label: string; value: string; to: string }) {
  return (
    <Link
      to={to}
      className="rounded-xl border border-white/10 bg-white/5 p-5 hover:border-white/20 focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-sky-400"
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
      <StatusBadge label={badge} />
    </div>
  );
}
