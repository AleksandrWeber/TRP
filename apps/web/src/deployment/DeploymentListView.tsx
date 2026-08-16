import { Link } from 'react-router-dom';
import type { StrategyDeploymentView } from '../shared/api';
import { formatUtc } from '../shared/formatUtc';
import { EmptyState, ErrorBanner, LoadingState, PageHeader } from '../shared/product-ui';
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
      <PageHeader
        productId="deployment"
        title={history ? 'Deployment history' : 'Deployments'}
        current={history ? 'History' : undefined}
        description={
          history
            ? 'Create and approve events for paper Deployments in this workspace. Deployment remains the workflow owner.'
            : 'Certified paper Deployments in this workspace. Create a draft, then approve. This does not start a Trading Session.'
        }
        extraActions={[
          { to: '/deployments/new', label: 'Create Deployment', testId: 'create-deployment-link' },
          { to: '/strategy-library', label: 'Strategy Library' },
        ]}
      />

      <ErrorBanner message={error} />

      {loading && <LoadingState label="Loading deployments…" />}

      {!loading && items.length === 0 && (
        <EmptyState
          testId={history ? 'deployment-history-empty' : 'deployment-list-empty'}
          title="No Deployments in this workspace."
          description="Create a certified paper Deployment after a Gate PASS."
          actionTo="/deployments/new"
          actionLabel="Create Deployment"
        />
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
