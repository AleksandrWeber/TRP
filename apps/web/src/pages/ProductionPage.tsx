import { useCallback, useEffect, useState } from 'react';
import {
  api,
  type Deployment,
  type Execution,
  type Experiment,
  statusColor,
  verdictColor,
} from '../shared/api';
import { CopyButton } from '../shared/CopyButton';
import { toUserFacingError } from '../shared/mapApiError';

export function ProductionPage() {
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [executions, setExecutions] = useState<Execution[]>([]);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const [ex, dep, exec] = await Promise.all([
      api.listExperiments(),
      api.listDeployments(),
      api.listExecutions(),
    ]);
    setExperiments(ex);
    setDeployments(dep);
    setExecutions(exec);
  }, []);

  useEffect(() => {
    refresh().catch((err: unknown) =>
      setError(toUserFacingError(err, 'Failed to load production')),
    );
  }, [refresh]);

  const deployable = experiments.filter(
    (ex) => !ex.deployment && (ex.verdict === 'pass' || ex.verdict === 'needs_review'),
  );

  return (
    <section className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold">Stage 1 — Production</h2>
        <p className="mt-2 text-slate-400">
          Legacy deployment data is read-only while paper execution remains consolidated in the
          canonical M2 pipeline.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      <div className="rounded-xl border border-white/10 bg-white/5 p-6">
        <h3 className="text-sm font-medium uppercase tracking-wide text-slate-400">
          Deploy certified strategy
        </h3>
        {deployable.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">
            No deployable experiments. Run research and get pass/needs_review first.
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {deployable.map((ex) => (
              <li
                key={ex.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-white/5 bg-black/20 px-4 py-3"
              >
                <div className="text-sm">
                  <p className="font-medium">
                    {ex.strategyId} v{ex.strategyVersion} · {ex.dataset?.symbol}
                  </p>
                  <p className="mt-1 flex flex-wrap items-center gap-2 font-mono text-xs text-slate-500">
                    <span>Experiment: {ex.id}</span>
                    <CopyButton value={ex.id} />
                  </p>
                  <span
                    className={`mt-1 inline-block rounded-full border px-2 py-0.5 text-xs ${verdictColor(ex.verdict)}`}
                  >
                    {ex.verdict.replace('_', ' ')}
                  </span>
                </div>
                <p className="text-sm text-slate-500">
                  Deployment controls were retired with TD-034 pending Strategy Runtime.
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-xl border border-white/10 bg-white/5 p-6">
        <h3 className="text-sm font-medium uppercase tracking-wide text-slate-400">
          Active deployments
        </h3>
        {deployments.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">
            No active deployments.
            <br />
            Deploy a certified strategy to begin.
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {deployments.map((dep) => (
              <li key={dep.id} className="rounded-lg border border-white/5 bg-black/20 px-4 py-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-medium">
                      {dep.symbol} · {dep.strategyId} · {dep.mode}
                    </p>
                    <p className="mt-1 flex flex-wrap items-center gap-2 font-mono text-xs text-slate-500">
                      <span>Deployment: {dep.id}</span>
                      <CopyButton value={dep.id} />
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      position: {dep.position?.side ?? 'flat'}{' '}
                      {dep.position?.quantity ? `(${dep.position.quantity.toFixed(6)})` : ''}
                    </p>
                  </div>
                  <span
                    className={`rounded-full border px-2 py-0.5 text-xs uppercase ${statusColor(dep.status)}`}
                  >
                    {dep.status}
                  </span>
                </div>
                <p className="mt-3 text-sm text-slate-500">
                  Execution controls were retired with TD-034; legacy deployments remain visible for
                  audit only.
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-xl border border-white/10 bg-white/5 p-6">
        <h3 className="text-sm font-medium uppercase tracking-wide text-slate-400">
          Execution history
        </h3>
        {executions.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">No executions yet.</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {executions.map((exec) => (
              <li
                key={exec.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white/5 px-4 py-2 text-sm"
              >
                <span>
                  {exec.symbol} · {exec.side} · {exec.quantity.toFixed(6)} @ {exec.price.toFixed(2)}
                </span>
                <span
                  className={`rounded-full border px-2 py-0.5 text-xs ${statusColor(exec.status)}`}
                >
                  {exec.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
