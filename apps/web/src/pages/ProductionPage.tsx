import { useCallback, useEffect, useState } from 'react';
import {
  api,
  type Deployment,
  type Execution,
  type Experiment,
  type TickResult,
  statusColor,
  verdictColor,
} from '../shared/api';

export function ProductionPage() {
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [executions, setExecutions] = useState<Execution[]>([]);
  const [lastTick, setLastTick] = useState<TickResult | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
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
    refresh().catch((err: Error) => setError(err.message));
  }, [refresh]);

  const deployable = experiments.filter(
    (ex) => !ex.deployment && (ex.verdict === 'pass' || ex.verdict === 'needs_review'),
  );

  async function handleDeploy(experiment: Experiment, approve = false) {
    setLoading('deploy');
    setError(null);
    try {
      await api.deploy(experiment.id, approve);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Deploy failed');
    } finally {
      setLoading(null);
    }
  }

  async function handleTick(deploymentId: string) {
    setLoading('tick');
    setError(null);
    try {
      const result = await api.tick(deploymentId);
      setLastTick(result);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Tick failed');
    } finally {
      setLoading(null);
    }
  }

  async function handleStop(deploymentId: string) {
    setLoading('stop');
    setError(null);
    try {
      await api.stopDeployment(deploymentId);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Stop failed');
    } finally {
      setLoading(null);
    }
  }

  return (
    <section className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold">Stage 1 — Production</h2>
        <p className="mt-2 text-slate-400">
          Signal → Risk check → Paper Exchange Adapter → Execution record
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
                  <span
                    className={`mt-1 inline-block rounded-full border px-2 py-0.5 text-xs ${verdictColor(ex.verdict)}`}
                  >
                    {ex.verdict.replace('_', ' ')}
                  </span>
                </div>
                <div className="flex gap-2">
                  {ex.verdict === 'needs_review' ? (
                    <button
                      type="button"
                      onClick={() => handleDeploy(ex, true)}
                      disabled={loading !== null}
                      className="rounded-lg border border-amber-500/40 px-3 py-1.5 text-sm text-amber-200 hover:bg-amber-500/10 disabled:opacity-50"
                    >
                      Approve & deploy
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleDeploy(ex, false)}
                      disabled={loading !== null}
                      className="rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-black disabled:opacity-50"
                    >
                      Deploy (paper)
                    </button>
                  )}
                </div>
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
          <p className="mt-3 text-sm text-slate-500">Nothing deployed yet.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {deployments.map((dep) => (
              <li key={dep.id} className="rounded-lg border border-white/5 bg-black/20 px-4 py-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-medium">
                      {dep.symbol} · {dep.strategyId} · {dep.mode}
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
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleTick(dep.id)}
                    disabled={loading !== null || dep.status !== 'active'}
                    className="rounded-lg border border-white/20 px-3 py-1.5 text-sm hover:bg-white/5 disabled:opacity-50"
                  >
                    {loading === 'tick' ? 'Evaluating…' : 'Evaluate signal (tick)'}
                  </button>
                  {dep.status === 'active' && (
                    <button
                      type="button"
                      onClick={() => handleStop(dep.id)}
                      disabled={loading !== null}
                      className="rounded-lg border border-red-500/30 px-3 py-1.5 text-sm text-red-200 hover:bg-red-500/10 disabled:opacity-50"
                    >
                      Stop
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {lastTick && (
        <div className="rounded-xl border border-white/10 bg-white/5 p-6">
          <h3 className="text-sm font-medium uppercase tracking-wide text-slate-400">Last tick</h3>
          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-slate-500">Signal</dt>
              <dd className="font-medium uppercase">{lastTick.signal.type}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Price</dt>
              <dd className="font-medium">{lastTick.signal.price.toFixed(2)}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Risk</dt>
              <dd className="font-medium">
                {lastTick.risk.approved ? 'approved' : lastTick.risk.reason}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Execution</dt>
              <dd className="font-medium">
                {lastTick.execution
                  ? `${lastTick.execution.side} ${lastTick.execution.status}`
                  : 'none'}
              </dd>
            </div>
          </dl>
        </div>
      )}

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
