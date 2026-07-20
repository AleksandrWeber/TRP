import { useCallback, useEffect, useState } from 'react';
import { api, type PortfolioView } from '../shared/api';

function formatMoney(value: string): string {
  const num = Number(value);
  if (!Number.isFinite(num)) return value;
  return num.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 8,
  });
}

export function PortfolioPage() {
  const [portfolio, setPortfolio] = useState<PortfolioView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resetting, setResetting] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const view = await api.getPortfolio();
      setPortfolio(view);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load portfolio');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function handleReset() {
    setResetting(true);
    setError(null);
    try {
      const view = await api.resetPortfolio();
      setPortfolio(view);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reset failed');
    } finally {
      setResetting(false);
    }
  }

  return (
    <section className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Trading</p>
          <h2 className="mt-1 text-2xl font-semibold">Portfolio</h2>
          <p className="mt-2 text-slate-400">
            Account financial state — balance, equity, and margin.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => void refresh()}
            disabled={loading}
            className="rounded border border-white/15 px-3 py-2 text-sm text-slate-200 hover:bg-white/5 disabled:opacity-50 focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-sky-400"
          >
            Refresh
          </button>
          <button
            type="button"
            onClick={() => void handleReset()}
            disabled={resetting || loading}
            className="rounded border border-amber-500/40 px-3 py-2 text-sm text-amber-200 hover:bg-amber-500/10 disabled:opacity-50 focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-sky-400"
          >
            {resetting ? 'Resetting…' : 'Reset (dev)'}
          </button>
        </div>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      {loading && !portfolio ? <p className="text-sm text-slate-500">Loading portfolio…</p> : null}

      {portfolio ? (
        <>
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span
              className={`rounded border px-2 py-1 ${
                portfolio.status === 'ACTIVE'
                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
                  : portfolio.status === 'PAUSED'
                    ? 'border-amber-500/30 bg-amber-500/10 text-amber-200'
                    : 'border-slate-500/30 bg-slate-500/10 text-slate-300'
              }`}
            >
              {portfolio.status}
            </span>
            <span className="text-slate-500">{portfolio.currency}</span>
            <span className="text-slate-500">
              Refreshed {new Date(portfolio.refreshedAt).toLocaleString()}
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Metric label="Balance" value={formatMoney(portfolio.balance.cash)} />
            <Metric label="Equity" value={formatMoney(portfolio.equity.equity)} />
            <Metric label="Realized PnL" value={formatMoney(portfolio.equity.realizedPnL)} />
            <Metric label="Unrealized PnL" value={formatMoney(portfolio.equity.unrealizedPnL)} />
            <Metric
              label="Available Margin"
              value={formatMoney(portfolio.margin.availableMargin)}
            />
            <Metric label="Used Margin" value={formatMoney(portfolio.margin.usedMargin)} />
          </div>
        </>
      ) : null}
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-xl font-semibold text-white">{value}</p>
    </div>
  );
}
