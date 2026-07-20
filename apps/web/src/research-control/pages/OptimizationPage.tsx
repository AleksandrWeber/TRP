import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  DiagnosticsPanel,
  EmptyState,
  ErrorPanel,
  EventTimeline,
  ExecutionStatusBadge,
  LoadingOverlay,
  MetricCard,
  ReportViewer,
} from '../components';
import {
  OPTIMIZATION_CRITERIA,
  useOptimization,
  useOptimizations,
  useStartOptimization,
} from '../hooks';

export function OptimizationPage() {
  const navigate = useNavigate();
  const list = useOptimizations();
  const start = useStartOptimization();
  const [criterion, setCriterion] = useState<(typeof OPTIMIZATION_CRITERIA)[number]>(
    'highestExecutionSuccessRate',
  );

  async function handleStart() {
    const record = await start.mutateAsync({ criterion });
    navigate(`/optimization/${record.id}`);
  }

  return (
    <section className="relative space-y-8">
      <LoadingOverlay visible={list.isLoading} />
      <header>
        <h2 className="text-2xl font-semibold">Strategy Optimization</h2>
        <p className="mt-2 text-slate-400">
          Evaluate predefined strategy configurations and inspect ranking reports.
        </p>
      </header>

      {list.isError ? <ErrorPanel error={list.error} onRetry={() => void list.refetch()} /> : null}
      {start.isError ? <ErrorPanel error={start.error} /> : null}

      <div className="rounded-lg border border-white/10 p-4">
        <h3 className="text-sm font-medium text-slate-200">Run optimization</h3>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="flex-1 text-sm text-slate-400">
            Optimization criterion
            <select
              className="mt-1 w-full rounded border border-white/15 bg-slate-950 px-3 py-2 text-white focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-sky-400"
              value={criterion}
              onChange={(e) =>
                setCriterion(e.target.value as (typeof OPTIMIZATION_CRITERIA)[number])
              }
            >
              {OPTIMIZATION_CRITERIA.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            disabled={start.isPending}
            onClick={() => void handleStart()}
            className="rounded bg-sky-600 px-4 py-2 text-sm text-white hover:bg-sky-500 disabled:opacity-50 focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-sky-400"
          >
            {start.isPending ? 'Starting…' : 'Execute optimization'}
          </button>
        </div>
        <p className="mt-2 text-xs text-slate-500">
          Uses three default configurations (low / mid / high slippage).
        </p>
      </div>

      {list.data && list.data.length > 0 ? (
        <ul className="space-y-2">
          {list.data.map((run) => (
            <li key={run.id}>
              <Link
                to={`/optimization/${run.id}`}
                className="flex items-center justify-between rounded-lg border border-white/10 px-4 py-3 hover:bg-white/[0.03] focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-sky-400"
              >
                <div>
                  <p className="text-sm text-white">{run.criterion}</p>
                  <p className="text-xs text-slate-500">
                    {run.configurationCount} configs · {run.createdAt}
                  </p>
                </div>
                <ExecutionStatusBadge status={run.status} />
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState title="No optimization runs yet" />
      )}
    </section>
  );
}

export function OptimizationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, isError, error, refetch } = useOptimization(id);
  const report = data?.report as
    | {
        bestConfiguration?: unknown;
        rankedResults?: unknown[];
      }
    | null
    | undefined;

  return (
    <section className="relative space-y-6">
      <LoadingOverlay visible={isLoading} />
      <div>
        <Link
          to="/optimization"
          className="text-sm text-sky-400 hover:text-sky-300 focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-sky-400"
        >
          ← Back to optimization
        </Link>
        <h2 className="mt-2 text-2xl font-semibold">Optimization report</h2>
        <p className="mt-1 font-mono text-xs text-slate-500">{id}</p>
      </div>

      {isError ? <ErrorPanel error={error} onRetry={() => void refetch()} /> : null}

      {data ? (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <ExecutionStatusBadge status={data.status} />
            <span className="text-sm text-slate-400">{data.criterion}</span>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <MetricCard label="Configurations" value={data.configurationCount} />
            <MetricCard
              label="Duration"
              value={data.durationMs != null ? `${data.durationMs} ms` : '—'}
            />
            <MetricCard label="Progress" value={`${data.progress}%`} />
          </div>
          {data.error ? <ErrorPanel error={data.error} title="Optimization failed" /> : null}
          <ReportViewer title="Best configuration" data={report?.bestConfiguration} />
          <ReportViewer title="Ranking" data={report?.rankedResults} />
          <ReportViewer title="Full OptimizationReport" data={data.report} />
          <DiagnosticsPanel diagnostics={data.diagnostics} />
          <EventTimeline events={data.events} />
        </>
      ) : null}
    </section>
  );
}
