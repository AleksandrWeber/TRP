import { Link } from 'react-router-dom';
import {
  EmptyState,
  ErrorPanel,
  ExecutionStatusBadge,
  LoadingOverlay,
  MetricCard,
} from '../components';
import { useDashboard } from '../hooks';

export function ResearchDashboardPage() {
  const { data, isLoading, isError, error, refetch, isFetching } = useDashboard();

  return (
    <section className="relative space-y-6">
      <LoadingOverlay visible={isLoading} label="Loading dashboard…" />
      <header>
        <h2 className="text-2xl font-semibold">Research Control Center</h2>
        <p className="mt-2 text-slate-400">
          Operational console for research execution, optimization, analytics, and engineering
          verification.
        </p>
      </header>

      {isError ? <ErrorPanel error={error} onRetry={() => void refetch()} /> : null}

      {data ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              label="Platform status"
              value={data.platformStatus}
              hint={isFetching ? 'Refreshing…' : `Updated ${data.generatedAt}`}
            />
            <MetricCard label="Active executions" value={data.activeExecutions} />
            <MetricCard label="Latest research" value={data.latestResearchRuns.length} />
            <MetricCard label="Latest optimizations" value={data.latestOptimizationRuns.length} />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Panel title="Latest research runs" to="/research">
              {data.latestResearchRuns.length === 0 ? (
                <EmptyState title="No research runs yet" />
              ) : (
                data.latestResearchRuns
                  .slice(0, 5)
                  .map((run) => (
                    <Row
                      key={run.id}
                      to={`/research/${run.id}`}
                      title={run.kind}
                      status={run.status}
                      meta={run.createdAt}
                    />
                  ))
              )}
            </Panel>

            <Panel title="Latest optimization runs" to="/optimization">
              {data.latestOptimizationRuns.length === 0 ? (
                <EmptyState title="No optimization runs yet" />
              ) : (
                data.latestOptimizationRuns
                  .slice(0, 5)
                  .map((run) => (
                    <Row
                      key={run.id}
                      to={`/optimization/${run.id}`}
                      title={run.criterion}
                      status={run.status}
                      meta={run.createdAt}
                    />
                  ))
              )}
            </Panel>

            <Panel title="Latest readiness report" to="/engineering">
              {data.latestReadinessReport ? (
                <Row
                  to={`/engineering`}
                  title={data.latestReadinessReport.kind}
                  status={data.latestReadinessReport.status}
                  meta={data.latestReadinessReport.createdAt}
                />
              ) : (
                <EmptyState title="No readiness report yet" />
              )}
            </Panel>

            <Panel title="Recent benchmark status" to="/engineering">
              {data.recentBenchmarkStatus ? (
                <Row
                  to={`/engineering`}
                  title={data.recentBenchmarkStatus.kind}
                  status={data.recentBenchmarkStatus.status}
                  meta={data.recentBenchmarkStatus.createdAt}
                />
              ) : (
                <EmptyState title="No benchmark runs yet" />
              )}
            </Panel>
          </div>
        </>
      ) : null}
    </section>
  );
}

function Panel({ title, to, children }: { title: string; to: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-white/10 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-medium text-slate-200">{title}</h3>
        <Link
          to={to}
          className="text-xs text-sky-400 hover:text-sky-300 focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-sky-400"
        >
          Open
        </Link>
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function Row({
  to,
  title,
  status,
  meta,
}: {
  to: string;
  title: string;
  status: string;
  meta: string;
}) {
  return (
    <Link
      to={to}
      className="flex items-center justify-between gap-3 rounded border border-white/5 px-3 py-2 hover:bg-white/[0.03] focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-sky-400"
    >
      <div>
        <p className="text-sm text-white">{title}</p>
        <p className="text-xs text-slate-500">{meta}</p>
      </div>
      <ExecutionStatusBadge status={status} />
    </Link>
  );
}
