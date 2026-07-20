import { useState } from 'react';
import type { EngineeringSuiteKind } from '../api';
import {
  DiagnosticsPanel,
  EmptyState,
  ErrorPanel,
  ExecutionStatusBadge,
  LoadingOverlay,
  ProgressIndicator,
  RecommendationList,
  ReportViewer,
} from '../components';
import { ENGINEERING_KINDS, useEngineeringList, useStartEngineering } from '../hooks';

export function EngineeringPage() {
  const list = useEngineeringList();
  const start = useStartEngineering();
  const [kind, setKind] = useState<EngineeringSuiteKind>('PerformanceBenchmark');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selected = list.data?.find((item) => item.id === selectedId) ?? list.data?.[0] ?? null;

  async function handleStart() {
    const record = await start.mutateAsync({ kind });
    setSelectedId(record.id);
  }

  return (
    <section className="relative space-y-8">
      <LoadingOverlay
        visible={list.isLoading || start.isPending}
        label={start.isPending ? 'Running suite…' : 'Loading…'}
      />
      <header>
        <h2 className="text-2xl font-semibold">Engineering</h2>
        <p className="mt-2 text-slate-400">
          Performance Benchmark, Deterministic Replay Validation, Regression Suite, Chaos Testing,
          and Live Readiness Review.
        </p>
      </header>

      {list.isError ? <ErrorPanel error={list.error} onRetry={() => void list.refetch()} /> : null}
      {start.isError ? <ErrorPanel error={start.error} /> : null}

      <div className="rounded-lg border border-white/10 p-4">
        <h3 className="text-sm font-medium text-slate-200">Run engineering suite</h3>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="flex-1 text-sm text-slate-400">
            Suite
            <select
              className="mt-1 w-full rounded border border-white/15 bg-slate-950 px-3 py-2 text-white focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-sky-400"
              value={kind}
              onChange={(e) => setKind(e.target.value as EngineeringSuiteKind)}
            >
              {ENGINEERING_KINDS.map((k) => (
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
            {start.isPending ? 'Running…' : 'Execute'}
          </button>
        </div>
      </div>

      {selected ? (
        <div className="space-y-4 rounded-lg border border-white/10 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-sm font-medium text-white">{selected.kind}</p>
              <p className="font-mono text-xs text-slate-500">{selected.id}</p>
            </div>
            <ExecutionStatusBadge status={selected.status} />
          </div>
          <ProgressIndicator value={selected.progress} />
          {selected.error ? <ErrorPanel error={selected.error} title="Suite failed" /> : null}
          <ReportViewer title="Report" data={selected.report} />
          <DiagnosticsPanel diagnostics={selected.diagnostics} />
          <RecommendationList items={selected.diagnostics.recommendations} />
        </div>
      ) : null}

      {list.data && list.data.length > 0 ? (
        <ul className="space-y-2">
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
                <div>
                  <p className="text-sm text-white">{item.kind}</p>
                  <p className="text-xs text-slate-500">{item.createdAt}</p>
                </div>
                <ExecutionStatusBadge status={item.status} />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState title="No engineering runs yet" />
      )}
    </section>
  );
}
