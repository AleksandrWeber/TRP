import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, type PositionView } from '../shared/api';

function formatMoney(value: string): string {
  const num = Number(value);
  if (!Number.isFinite(num)) return value;
  return num.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 8,
  });
}

function statusClass(status: string): string {
  if (status === 'OPEN') return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200';
  if (status === 'PARTIALLY_CLOSED') return 'border-amber-500/30 bg-amber-500/10 text-amber-200';
  if (status === 'CLOSED') return 'border-slate-500/30 bg-slate-500/10 text-slate-300';
  return 'border-red-500/30 bg-red-500/10 text-red-200';
}

export function PositionsPage() {
  const [positions, setPositions] = useState<PositionView[]>([]);
  const [openOnly, setOpenOnly] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = openOnly ? await api.listOpenPositions() : await api.listPositions();
      setPositions(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load positions');
    } finally {
      setLoading(false);
    }
  }, [openOnly]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return (
    <section className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Trading</p>
          <h2 className="mt-1 text-2xl font-semibold">Positions</h2>
          <p className="mt-2 text-slate-400">
            Trade state — open and closed positions with PnL and exposure.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setOpenOnly((value) => !value)}
            className="rounded border border-white/15 px-3 py-2 text-sm text-slate-200 hover:bg-white/5 focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-sky-400"
          >
            {openOnly ? 'Show all' : 'Open only'}
          </button>
          <button
            type="button"
            onClick={() => void refresh()}
            disabled={loading}
            className="rounded border border-white/15 px-3 py-2 text-sm text-slate-200 hover:bg-white/5 disabled:opacity-50 focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-sky-400"
          >
            Refresh
          </button>
        </div>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      {loading && positions.length === 0 ? (
        <p className="text-sm text-slate-500">Loading positions…</p>
      ) : null}

      {!loading && positions.length === 0 ? (
        <p className="text-sm text-slate-500">No positions yet.</p>
      ) : null}

      {positions.length > 0 ? (
        <div className="overflow-x-auto rounded-lg border border-white/10">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-white/10 bg-white/[0.03] text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-3 py-2 font-medium">Symbol</th>
                <th className="px-3 py-2 font-medium">Side</th>
                <th className="px-3 py-2 font-medium">Qty</th>
                <th className="px-3 py-2 font-medium">Entry</th>
                <th className="px-3 py-2 font-medium">Mark</th>
                <th className="px-3 py-2 font-medium">Avg Entry</th>
                <th className="px-3 py-2 font-medium">Unrealized</th>
                <th className="px-3 py-2 font-medium">Realized</th>
                <th className="px-3 py-2 font-medium">Exposure</th>
                <th className="px-3 py-2 font-medium">Status</th>
                <th className="px-3 py-2 font-medium">Open Time</th>
              </tr>
            </thead>
            <tbody>
              {positions.map((position) => (
                <tr key={position.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                  <td className="px-3 py-2">
                    <Link
                      to={`/trading/positions/${position.id}`}
                      className="text-sky-300 hover:underline focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-sky-400"
                    >
                      {position.symbol}
                    </Link>
                  </td>
                  <td className="px-3 py-2 text-slate-200">{position.side}</td>
                  <td className="px-3 py-2 text-slate-200">{formatMoney(position.quantity)}</td>
                  <td className="px-3 py-2 text-slate-200">{formatMoney(position.entryPrice)}</td>
                  <td className="px-3 py-2 text-slate-200">{formatMoney(position.markPrice)}</td>
                  <td className="px-3 py-2 text-slate-200">
                    {formatMoney(position.averageEntryPrice)}
                  </td>
                  <td className="px-3 py-2 text-slate-200">
                    {formatMoney(position.unrealizedPnL)}
                  </td>
                  <td className="px-3 py-2 text-slate-200">{formatMoney(position.realizedPnL)}</td>
                  <td className="px-3 py-2 text-slate-200">{formatMoney(position.exposure)}</td>
                  <td className="px-3 py-2">
                    <span
                      className={`rounded border px-2 py-0.5 text-xs ${statusClass(position.status)}`}
                    >
                      {position.status}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-slate-400">
                    {new Date(position.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}
