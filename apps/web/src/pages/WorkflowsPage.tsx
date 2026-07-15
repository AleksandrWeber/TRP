import { useCallback, useEffect, useState } from 'react';
import { api, statusColor, type Dataset, type Workflow } from '../shared/api';

export function WorkflowsPage() {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const [ds, wf] = await Promise.all([api.listDatasets(), api.listWorkflows()]);
    setDatasets(ds);
    setWorkflows(wf);
  }, []);

  useEffect(() => {
    refresh().catch((err: Error) => setError(err.message));
  }, [refresh]);

  async function start(datasetId: string, approveNeedsReview = false) {
    setLoading('start');
    setError(null);
    try {
      await api.startWorkflow(datasetId, approveNeedsReview);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Workflow failed');
    } finally {
      setLoading(null);
    }
  }

  return (
    <section className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold">Workflows</h2>
        <p className="mt-2 text-slate-400">
          Implementation 010 — research_pipeline: research → knowledge → finish
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      <div className="rounded-xl border border-white/10 bg-white/5 p-6">
        <h3 className="text-sm font-medium uppercase tracking-wide text-slate-400">
          Start workflow
        </h3>
        {datasets.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">Import a dataset in Research first.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {datasets.map((ds) => (
              <li
                key={ds.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-white/5 px-4 py-3"
              >
                <span className="text-sm">
                  {ds.symbol} · {ds.timeframe} · {ds.barCount} bars
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={loading !== null}
                    onClick={() => start(ds.id, false)}
                    className="rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-black disabled:opacity-50"
                  >
                    Run pipeline
                  </button>
                  <button
                    type="button"
                    disabled={loading !== null}
                    onClick={() => start(ds.id, true)}
                    className="rounded-lg border border-amber-500/40 px-3 py-1.5 text-sm text-amber-200 disabled:opacity-50"
                  >
                    Run + approve needs_review
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-xl border border-white/10 bg-white/5 p-6">
        <h3 className="text-sm font-medium uppercase tracking-wide text-slate-400">History</h3>
        <ul className="mt-4 space-y-3">
          {workflows.map((wf) => (
            <li key={wf.id} className="rounded-lg border border-white/5 px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium">{wf.type}</p>
                <span
                  className={`rounded-full border px-2 py-0.5 text-xs ${statusColor(wf.status)}`}
                >
                  {wf.status}
                </span>
              </div>
              <ol className="mt-2 space-y-1 text-xs text-slate-400">
                {wf.steps.map((step) => (
                  <li key={step.id}>
                    {step.stepOrder}. {step.name} — {step.status}
                  </li>
                ))}
              </ol>
            </li>
          ))}
          {workflows.length === 0 && <p className="text-sm text-slate-500">No workflows yet.</p>}
        </ul>
      </div>
    </section>
  );
}
