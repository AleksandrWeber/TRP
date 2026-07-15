import { useCallback, useEffect, useState } from 'react';
import { api, type Dataset, type Experiment, verdictColor } from '../shared/api';

export function ResearchPage() {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [selected, setSelected] = useState<Experiment | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const [ds, ex] = await Promise.all([api.listDatasets(), api.listExperiments()]);
    setDatasets(ds);
    setExperiments(ex);
  }, []);

  useEffect(() => {
    refresh().catch((err: Error) => setError(err.message));
  }, [refresh]);

  async function handleImport() {
    setLoading('import');
    setError(null);
    try {
      await api.importDataset();
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed');
    } finally {
      setLoading(null);
    }
  }

  async function handleRun(datasetId: string) {
    setLoading('run');
    setError(null);
    try {
      const experiment = await api.runExperiment(datasetId);
      setSelected(experiment);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Experiment failed');
    } finally {
      setLoading(null);
    }
  }

  return (
    <section className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold">Stage 0 — Research</h2>
        <p className="mt-2 text-slate-400">
          OHLCV → EMA Crossover → Backtest → Validation → Report
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handleImport}
          disabled={loading !== null}
          className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black disabled:opacity-50"
        >
          {loading === 'import' ? 'Importing…' : 'Import BTCUSDT 1h (Binance)'}
        </button>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/5 p-6">
        <h3 className="text-sm font-medium uppercase tracking-wide text-slate-400">Datasets</h3>
        {datasets.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">No datasets yet. Import OHLCV to begin.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {datasets.map((ds) => (
              <li
                key={ds.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-white/5 bg-black/20 px-4 py-3"
              >
                <div className="text-sm">
                  <p className="font-medium">
                    {ds.symbol} · {ds.timeframe} · {ds.barCount} bars
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    hash: {ds.contentHash.slice(0, 16)}…
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleRun(ds.id)}
                  disabled={loading !== null}
                  className="rounded-lg border border-white/20 px-3 py-1.5 text-sm hover:bg-white/5 disabled:opacity-50"
                >
                  {loading === 'run' ? 'Running…' : 'Run experiment'}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {selected && (
        <div className="rounded-xl border border-white/10 bg-white/5 p-6">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold">Latest report</h3>
            <span
              className={`rounded-full border px-3 py-1 text-xs uppercase ${verdictColor(selected.verdict)}`}
            >
              {selected.verdict.replace('_', ' ')}
            </span>
          </div>

          <dl className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Metric label="Return" value={`${selected.metrics.totalReturnPercent.toFixed(2)}%`} />
            <Metric label="Trades" value={String(selected.metrics.tradeCount)} />
            <Metric label="Win rate" value={`${(selected.metrics.winRate * 100).toFixed(1)}%`} />
            <Metric label="Profit factor" value={selected.metrics.profitFactor.toFixed(2)} />
            <Metric
              label="Max drawdown"
              value={`${selected.metrics.maxDrawdownPercent.toFixed(2)}%`}
            />
            <Metric label="Expectancy" value={selected.metrics.expectancy.toFixed(2)} />
          </dl>

          <div className="mt-6">
            <h4 className="text-sm font-medium text-slate-400">Validation</h4>
            <ul className="mt-2 space-y-1 text-sm">
              {selected.validation.reasons.map((reason) => (
                <li key={reason}>• {reason}</li>
              ))}
            </ul>
          </div>

          <p className="mt-4 text-xs text-slate-500">
            config hash: {selected.configHash.slice(0, 16)}… · git:{' '}
            {selected.gitCommit?.slice(0, 8) ?? 'n/a'}
          </p>
        </div>
      )}

      {experiments.length > 0 && (
        <div className="rounded-xl border border-white/10 bg-white/5 p-6">
          <h3 className="text-sm font-medium uppercase tracking-wide text-slate-400">
            Experiment history
          </h3>
          <ul className="mt-4 space-y-2">
            {experiments.map((ex) => (
              <li key={ex.id}>
                <button
                  type="button"
                  onClick={() => setSelected(ex)}
                  className="flex w-full items-center justify-between rounded-lg border border-white/5 px-4 py-2 text-left text-sm hover:bg-white/5"
                >
                  <span>
                    {ex.dataset?.symbol ?? '—'} · {ex.strategyId} v{ex.strategyVersion}
                  </span>
                  <span
                    className={`rounded-full border px-2 py-0.5 text-xs ${verdictColor(ex.verdict)}`}
                  >
                    {ex.verdict.replace('_', ' ')}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-1 text-lg font-medium">{value}</dd>
    </div>
  );
}
