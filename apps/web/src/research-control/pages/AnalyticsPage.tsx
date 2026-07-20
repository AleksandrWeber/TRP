import { useState } from 'react';
import {
  DiagnosticsPanel,
  EmptyState,
  ErrorPanel,
  ExecutionStatusBadge,
  LoadingOverlay,
  MetricCard,
  ReportViewer,
} from '../components';
import { useAnalyticsList, useStartAnalytics } from '../hooks';

type PerformanceReportView = {
  totalExecutions?: number;
  executionSuccessRate?: number;
  averageSlippage?: number;
  averageCommission?: number;
  averageExecutionDuration?: number;
};

export function AnalyticsPage() {
  const list = useAnalyticsList();
  const start = useStartAnalytics();
  const [executionCount, setExecutionCount] = useState(4);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selected = list.data?.find((item) => item.id === selectedId) ?? list.data?.[0] ?? null;
  const report = (selected?.report ?? null) as PerformanceReportView | null;

  async function handleStart() {
    const record = await start.mutateAsync({ executionCount });
    setSelectedId(record.id);
  }

  return (
    <section className="relative space-y-8">
      <LoadingOverlay visible={list.isLoading} />
      <header>
        <h2 className="text-2xl font-semibold">Performance Analytics</h2>
        <p className="mt-2 text-slate-400">
          Execution-level performance reports. No portfolio metrics.
        </p>
      </header>

      {list.isError ? <ErrorPanel error={list.error} onRetry={() => void list.refetch()} /> : null}
      {start.isError ? <ErrorPanel error={start.error} /> : null}

      <div className="rounded-lg border border-white/10 p-4">
        <h3 className="text-sm font-medium text-slate-200">Generate analysis</h3>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="text-sm text-slate-400">
            Simulated executions
            <input
              type="number"
              min={1}
              max={100}
              value={executionCount}
              onChange={(e) => setExecutionCount(Number(e.target.value))}
              className="mt-1 w-full rounded border border-white/15 bg-slate-950 px-3 py-2 text-white focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-sky-400"
            />
          </label>
          <button
            type="button"
            disabled={start.isPending}
            onClick={() => void handleStart()}
            className="rounded bg-sky-600 px-4 py-2 text-sm text-white hover:bg-sky-500 disabled:opacity-50 focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-sky-400"
          >
            {start.isPending ? 'Analyzing…' : 'Analyze'}
          </button>
        </div>
      </div>

      {report && selected?.status === 'completed' ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <MetricCard label="Execution count" value={report.totalExecutions ?? '—'} />
          <MetricCard
            label="Success rate"
            value={
              report.executionSuccessRate != null
                ? `${(report.executionSuccessRate * 100).toFixed(1)}%`
                : '—'
            }
          />
          <MetricCard
            label="Avg slippage"
            value={report.averageSlippage != null ? report.averageSlippage.toFixed(4) : '—'}
          />
          <MetricCard
            label="Avg commission"
            value={report.averageCommission != null ? report.averageCommission.toFixed(4) : '—'}
          />
          <MetricCard
            label="Avg duration"
            value={
              report.averageExecutionDuration != null
                ? `${report.averageExecutionDuration} ms`
                : '—'
            }
          />
        </div>
      ) : null}

      {selected ? (
        <>
          <div className="flex items-center gap-3">
            <ExecutionStatusBadge status={selected.status} />
            <span className="font-mono text-xs text-slate-500">{selected.id}</span>
          </div>
          <ReportViewer title="PerformanceReport" data={selected.report} />
          <DiagnosticsPanel diagnostics={selected.diagnostics} />
        </>
      ) : null}

      {list.data && list.data.length > 0 ? (
        <ul className="space-y-2" aria-label="Analytics history">
          {list.data.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => setSelectedId(item.id)}
                className={`flex w-full items-center justify-between rounded-lg border px-4 py-3 text-left focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-sky-400 ${
                  selected?.id === item.id
                    ? 'border-sky-500/40 bg-sky-500/5'
                    : 'border-white/10 hover:bg-white/[0.03]'
                }`}
              >
                <span className="text-sm text-white">{item.createdAt}</span>
                <ExecutionStatusBadge status={item.status} />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState title="No analytics reports yet" />
      )}
    </section>
  );
}
