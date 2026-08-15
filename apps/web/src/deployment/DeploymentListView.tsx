import { Link } from 'react-router-dom';
import type { StrategyDeploymentView } from '../shared/api';
import { formatUtc } from '../shared/formatUtc';
import { deploymentStatusLabel, gateOutcomeLabel } from './deployment-wizard';

export function DeploymentListView({
  items,
  loading,
  error,
  variant,
}: {
  items: StrategyDeploymentView[];
  loading: boolean;
  error: string | null;
  variant: 'list' | 'history';
}) {
  const history = variant === 'history';

  return (
    <section className="space-y-6" data-testid={history ? 'deployment-history' : 'deployment-list'}>
      <div>
        <p className="text-xs uppercase tracking-wide text-slate-500">Deployment</p>
        <h2 className="mt-1 text-2xl font-semibold">
          {history ? 'Deployment history' : 'Deployments'}
        </h2>
        <p className="mt-2 text-slate-400">
          {history
            ? 'Create and approve events for paper Deployments in this workspace. Deployment remains the workflow owner.'
            : 'Certified paper Deployments in this workspace. Create a draft, then approve. This does not start a Trading Session.'}
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      <div className="flex flex-wrap gap-3 text-sm">
        <Link
          to="/deployments/new"
          data-testid="create-deployment-link"
          className="text-sky-400 hover:text-sky-300"
        >
          Create Deployment
        </Link>
        {history ? (
          <Link to="/deployments" className="text-sky-400 hover:text-sky-300">
            Deployment list
          </Link>
        ) : (
          <Link to="/deployments/history" className="text-sky-400 hover:text-sky-300">
            Deployment history
          </Link>
        )}
        <Link to="/strategy-library" className="text-sky-400 hover:text-sky-300">
          Strategy Library
        </Link>
      </div>

      {loading && <p className="text-sm text-slate-500">Loading deployments…</p>}

      {!loading && items.length === 0 && (
        <p
          className="text-sm text-slate-500"
          data-testid={history ? 'deployment-history-empty' : 'deployment-list-empty'}
        >
          No Deployments in this workspace.
        </p>
      )}

      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.id}>
            <Link
              to={`/deployments/${item.id}`}
              data-testid="deployment-row-link"
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-white/10 px-3 py-2 text-sm hover:border-white/20"
            >
              <span>
                {String(item.metadata.strategyName ?? 'Deployment')}{' '}
                <span className="text-slate-500">v{item.strategyVersion}</span>
                <span className="ml-2 text-slate-500">
                  {item.instrument} · {item.timeframe}
                </span>
              </span>
              <span className="flex flex-wrap gap-2">
                <span className="rounded-full border border-white/10 px-2 py-0.5 text-xs">
                  {deploymentStatusLabel(item.status)}
                </span>
                <span className="rounded-full border border-white/10 px-2 py-0.5 text-xs text-slate-400">
                  Gate {gateOutcomeLabel(item.enforcementAuthorization)}
                </span>
                <span className="text-xs text-slate-500">
                  {formatUtc(history ? item.recordedAt : item.createdAt)}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
