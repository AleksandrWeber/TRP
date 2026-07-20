import { Link, useParams } from 'react-router-dom';
import {
  DiagnosticsPanel,
  ErrorPanel,
  EventTimeline,
  ExecutionStatusBadge,
  LoadingOverlay,
  MetricCard,
  ProgressIndicator,
  ReportViewer,
} from '../components';
import { useExecution } from '../hooks';

export function ResearchDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, isError, error, refetch } = useExecution(id);

  return (
    <section className="relative space-y-6">
      <LoadingOverlay visible={isLoading} />
      <div>
        <Link
          to="/research"
          className="text-sm text-sky-400 hover:text-sky-300 focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-sky-400"
        >
          ← Back to research
        </Link>
        <h2 className="mt-2 text-2xl font-semibold">Research execution</h2>
        <p className="mt-1 font-mono text-xs text-slate-500">{id}</p>
      </div>

      {isError ? <ErrorPanel error={error} onRetry={() => void refetch()} /> : null}

      {data ? (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <ExecutionStatusBadge status={data.status} />
            <span className="text-sm text-slate-400">{data.kind}</span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard label="Progress" value={`${data.progress}%`} />
            <MetricCard label="Started" value={data.startedAt ?? '—'} />
            <MetricCard
              label="Duration"
              value={data.durationMs != null ? `${data.durationMs} ms` : '—'}
            />
            <MetricCard label="Strategy" value={data.strategyId ?? '—'} />
          </div>

          <ProgressIndicator value={data.progress} />

          {data.error ? <ErrorPanel error={data.error} title="Execution failed" /> : null}

          <div className="grid gap-6 lg:grid-cols-2">
            <ReportViewer title="Execution result" data={data.result} />
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-slate-300">Diagnostics</h3>
              <DiagnosticsPanel diagnostics={data.diagnostics} />
            </div>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-medium text-slate-300">Event history</h3>
            <EventTimeline events={data.events} />
          </div>
        </>
      ) : null}
    </section>
  );
}
