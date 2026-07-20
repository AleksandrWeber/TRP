import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { ResearchExecutionKind } from '../api';
import {
  ConfirmationDialog,
  EmptyState,
  ErrorPanel,
  ExecutionStatusBadge,
  LoadingOverlay,
  ProgressIndicator,
} from '../components';
import {
  RESEARCH_KINDS,
  useActiveExecutions,
  useCancelExecution,
  useExecutions,
  useStartExecution,
} from '../hooks';

export function ResearchPage() {
  const navigate = useNavigate();
  const executions = useExecutions();
  const active = useActiveExecutions();
  const start = useStartExecution();
  const cancel = useCancelExecution();
  const [kind, setKind] = useState<ResearchExecutionKind>('SmokeBacktest');
  const [confirmCancelId, setConfirmCancelId] = useState<string | null>(null);

  async function handleStart() {
    const record = await start.mutateAsync({ kind });
    navigate(`/research/${record.id}`);
  }

  return (
    <section className="relative space-y-8">
      <LoadingOverlay visible={executions.isLoading} />
      <header>
        <h2 className="text-2xl font-semibold">Research</h2>
        <p className="mt-2 text-slate-400">
          Start and monitor Smoke Backtest, Historical Replay, Walk Forward Validation, and
          Multi-Year Research.
        </p>
      </header>

      {executions.isError ? (
        <ErrorPanel error={executions.error} onRetry={() => void executions.refetch()} />
      ) : null}
      {start.isError ? <ErrorPanel error={start.error} /> : null}

      <div className="rounded-lg border border-white/10 p-4">
        <h3 className="text-sm font-medium text-slate-200">Start research execution</h3>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="flex-1 text-sm text-slate-400">
            Kind
            <select
              className="mt-1 w-full rounded border border-white/15 bg-slate-950 px-3 py-2 text-white focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-sky-400"
              value={kind}
              onChange={(e) => setKind(e.target.value as ResearchExecutionKind)}
            >
              {RESEARCH_KINDS.map((k) => (
                <option key={k} value={k}>
                  {k}
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
            {start.isPending ? 'Starting…' : 'Start'}
          </button>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-medium text-slate-200">Execution monitor</h3>
        {active.data && active.data.length > 0 ? (
          active.data.map((item) => (
            <div key={item.id} className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-medium text-white">
                    {'kind' in item ? item.kind : item.category} · {item.id.slice(0, 8)}
                  </p>
                  <p className="text-xs text-slate-500">
                    Started {item.startedAt ?? '—'} · Duration{' '}
                    {item.durationMs != null ? `${item.durationMs}ms` : '—'}
                  </p>
                </div>
                <ExecutionStatusBadge status={item.status} />
              </div>
              <div className="mt-3">
                <ProgressIndicator value={item.progress} />
              </div>
            </div>
          ))
        ) : (
          <EmptyState
            title="No active executions"
            description="Start a research run to monitor progress."
          />
        )}
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-medium text-slate-200">Results explorer</h3>
        {executions.data && executions.data.length > 0 ? (
          <div className="overflow-hidden rounded-lg border border-white/10">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-white/10 bg-white/[0.03] text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-3 py-2">Kind</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Created</th>
                  <th className="px-3 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {executions.data.map((run) => (
                  <tr key={run.id} className="border-b border-white/5">
                    <td className="px-3 py-2 text-white">{run.kind}</td>
                    <td className="px-3 py-2">
                      <ExecutionStatusBadge status={run.status} />
                    </td>
                    <td className="px-3 py-2 text-slate-400">{run.createdAt}</td>
                    <td className="px-3 py-2">
                      <div className="flex gap-2">
                        <Link
                          to={`/research/${run.id}`}
                          className="text-sky-400 hover:text-sky-300 focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-sky-400"
                        >
                          Inspect
                        </Link>
                        {run.status === 'pending' ? (
                          <button
                            type="button"
                            className="text-red-300 hover:text-red-200 focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-red-300"
                            onClick={() => setConfirmCancelId(run.id)}
                          >
                            Cancel
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState title="No completed research yet" />
        )}
      </div>

      <ConfirmationDialog
        open={confirmCancelId !== null}
        title="Cancel research execution?"
        message="Queued executions can be cancelled before they start running."
        confirmLabel="Cancel execution"
        onCancel={() => setConfirmCancelId(null)}
        onConfirm={() => {
          if (confirmCancelId) {
            void cancel.mutateAsync(confirmCancelId).finally(() => setConfirmCancelId(null));
          }
        }}
      />
    </section>
  );
}
