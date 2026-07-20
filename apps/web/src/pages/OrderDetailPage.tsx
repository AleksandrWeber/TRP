import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, type OrderFillEntry, type OrderHistoryEntry, type OrderView } from '../shared/api';

function formatMoney(value: string | null): string {
  if (value === null || value === undefined || value === '') return '—';
  const num = Number(value);
  if (!Number.isFinite(num)) return value;
  return num.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 8,
  });
}

export function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<OrderView | null>(null);
  const [history, setHistory] = useState<OrderHistoryEntry[]>([]);
  const [fills, setFills] = useState<OrderFillEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const [view, entries, fillEntries] = await Promise.all([
        api.getOrder(id),
        api.listOrderHistory(id),
        api.listOrderFills(id),
      ]);
      setOrder(view);
      setHistory(entries);
      setFills(fillEntries);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load order');
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
          <h2 className="mt-1 text-2xl font-semibold">{order ? order.symbol : 'Order'}</h2>
          <p className="mt-2 text-slate-400">Timeline, history, fills, and state transitions.</p>
        </div>
        <div className="flex gap-2">
          <Link
            to="/trading/orders"
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

      {loading && !order ? <p className="text-sm text-slate-500">Loading order…</p> : null}

      {order ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Metric label="Side" value={order.side} />
            <Metric label="Type" value={order.type} />
            <Metric label="Status" value={order.status} />
            <Metric label="Time In Force" value={order.timeInForce} />
            <Metric label="Quantity" value={formatMoney(order.quantity)} />
            <Metric label="Filled" value={formatMoney(order.filledQuantity)} />
            <Metric label="Remaining" value={formatMoney(order.remainingQuantity)} />
            <Metric label="Requested Price" value={formatMoney(order.requestedPrice)} />
            <Metric label="Executed Price" value={formatMoney(order.executedPrice)} />
            <Metric label="Created" value={new Date(order.createdAt).toLocaleString()} />
            <Metric
              label="Executed"
              value={order.executedAt ? new Date(order.executedAt).toLocaleString() : '—'}
            />
            <Metric
              label="Cancelled"
              value={order.cancelledAt ? new Date(order.cancelledAt).toLocaleString() : '—'}
            />
          </div>

          <div>
            <h3 className="text-lg font-medium text-white">Timeline</h3>
            <p className="mt-1 text-sm text-slate-500">Immutable status transitions.</p>
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
                      <span className="text-sm font-medium text-slate-100">
                        {entry.previousStatus} → {entry.currentStatus}
                      </span>
                      <span className="text-xs text-slate-500">
                        {new Date(entry.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-slate-400">{entry.reason}</p>
                  </li>
                ))}
              </ol>
            )}
          </div>

          <div>
            <h3 className="text-lg font-medium text-white">Fill history</h3>
            <p className="mt-1 text-sm text-slate-500">Immutable simulated fills.</p>
            {fills.length === 0 ? (
              <p className="mt-4 text-sm text-slate-500">No fills yet.</p>
            ) : (
              <ul className="mt-4 space-y-2 text-sm text-slate-300">
                {fills.map((fill) => (
                  <li
                    key={fill.id}
                    className="flex flex-wrap justify-between gap-4 border-b border-white/5 py-2"
                  >
                    <span>
                      {formatMoney(fill.quantity)} @ {formatMoney(fill.price)}
                    </span>
                    <span className="text-slate-500">
                      fee {formatMoney(fill.fee)} · {new Date(fill.timestamp).toLocaleString()}
                    </span>
                  </li>
                ))}
              </ul>
            )}
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
      <p className="mt-1 text-sm font-medium text-slate-100">{value}</p>
    </div>
  );
}
