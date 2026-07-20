import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, type PositionHistoryEntry, type PositionView } from '../shared/api';

function formatMoney(value: string): string {
  const num = Number(value);
  if (!Number.isFinite(num)) return value;
  return num.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 8,
  });
}

export function PositionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [position, setPosition] = useState<PositionView | null>(null);
  const [history, setHistory] = useState<PositionHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const [view, entries] = await Promise.all([api.getPosition(id), api.listPositionHistory(id)]);
      setPosition(view);
      setHistory(entries);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load position');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return (
    <section className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Trading</p>
          <h2 className="mt-1 text-2xl font-semibold">{position ? position.symbol : 'Position'}</h2>
          <p className="mt-2 text-slate-400">Timeline, history, and PnL evolution.</p>
        </div>
        <div className="flex gap-2">
          <Link
            to="/trading/positions"
            className="rounded border border-white/15 px-3 py-2 text-sm text-slate-200 hover:bg-white/5 focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-sky-400"
          >
            Back
          </Link>
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

      {loading && !position ? <p className="text-sm text-slate-500">Loading position…</p> : null}

      {position ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Metric label="Side" value={position.side} />
            <Metric label="Status" value={position.status} />
            <Metric label="Quantity" value={formatMoney(position.quantity)} />
            <Metric label="Exposure" value={formatMoney(position.exposure)} />
            <Metric label="Entry Price" value={formatMoney(position.entryPrice)} />
            <Metric label="Mark Price" value={formatMoney(position.markPrice)} />
            <Metric label="Average Entry" value={formatMoney(position.averageEntryPrice)} />
            <Metric label="Return %" value={formatMoney(position.returnPercent)} />
            <Metric label="Unrealized PnL" value={formatMoney(position.unrealizedPnL)} />
            <Metric label="Realized PnL" value={formatMoney(position.realizedPnL)} />
            <Metric label="Opened" value={new Date(position.createdAt).toLocaleString()} />
            <Metric
              label="Closed"
              value={position.closedAt ? new Date(position.closedAt).toLocaleString() : '—'}
            />
          </div>

          <div>
            <h3 className="text-lg font-medium text-white">Timeline</h3>
            <p className="mt-1 text-sm text-slate-500">Immutable history of position actions.</p>
            {history.length === 0 ? (
              <p className="mt-4 text-sm text-slate-500">No history entries.</p>
            ) : (
              <ol className="mt-4 space-y-3">
                {history.map((entry) => (
                  <li
                    key={entry.id}
                    className="rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-sm font-medium text-slate-100">{entry.action}</span>
                      <span className="text-xs text-slate-500">
                        {new Date(entry.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-4 text-sm text-slate-400">
                      <span>Qty {formatMoney(entry.quantity)}</span>
                      <span>Price {formatMoney(entry.price)}</span>
                      <span>Realized {formatMoney(entry.realizedPnL)}</span>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </div>

          <div>
            <h3 className="text-lg font-medium text-white">PnL evolution</h3>
            <p className="mt-1 text-sm text-slate-500">
              Realized deltas from reduce/close actions (charts out of scope).
            </p>
            <ul className="mt-4 space-y-2 text-sm text-slate-300">
              {history
                .filter((entry) => entry.action === 'REDUCED' || entry.action === 'CLOSED')
                .map((entry) => (
                  <li
                    key={`pnl-${entry.id}`}
                    className="flex justify-between gap-4 border-b border-white/5 py-2"
                  >
                    <span>
                      {entry.action} @ {formatMoney(entry.price)}
                    </span>
                    <span>{formatMoney(entry.realizedPnL)}</span>
                  </li>
                ))}
              {history.every((entry) => entry.action !== 'REDUCED' && entry.action !== 'CLOSED') ? (
                <li className="text-slate-500">No realized PnL events yet.</li>
              ) : null}
            </ul>
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
      <p className="mt-1 text-lg font-semibold text-white">{value}</p>
    </div>
  );
}
