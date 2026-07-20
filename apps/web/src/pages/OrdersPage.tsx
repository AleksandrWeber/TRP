import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, type OrderView } from '../shared/api';

function formatMoney(value: string | null): string {
  if (value === null || value === undefined || value === '') return '—';
  const num = Number(value);
  if (!Number.isFinite(num)) return value;
  return num.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 8,
  });
}

function statusClass(status: string): string {
  if (status === 'FILLED') return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200';
  if (status === 'PARTIALLY_FILLED' || status === 'PENDING') {
    return 'border-amber-500/30 bg-amber-500/10 text-amber-200';
  }
  if (status === 'CANCELLED' || status === 'EXPIRED' || status === 'REJECTED') {
    return 'border-slate-500/30 bg-slate-500/10 text-slate-300';
  }
  return 'border-sky-500/30 bg-sky-500/10 text-sky-200';
}

export function OrdersPage() {
  const [orders, setOrders] = useState<OrderView[]>([]);
  const [openOnly, setOpenOnly] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = openOnly ? await api.listOpenOrders() : await api.listOrders();
      setOrders(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load orders');
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
          <h2 className="mt-1 text-2xl font-semibold">Orders</h2>
          <p className="mt-2 text-slate-400">
            Order lifecycle — create, fill, cancel, and track simulated execution.
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

      {loading && orders.length === 0 ? (
        <p className="text-sm text-slate-500">Loading orders…</p>
      ) : null}

      {!loading && orders.length === 0 ? (
        <p className="text-sm text-slate-500">No orders yet.</p>
      ) : null}

      {orders.length > 0 ? (
        <div className="overflow-x-auto rounded-lg border border-white/10">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-white/10 bg-white/[0.03] text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-3 py-2 font-medium">Symbol</th>
                <th className="px-3 py-2 font-medium">Side</th>
                <th className="px-3 py-2 font-medium">Type</th>
                <th className="px-3 py-2 font-medium">Quantity</th>
                <th className="px-3 py-2 font-medium">Filled</th>
                <th className="px-3 py-2 font-medium">Remaining</th>
                <th className="px-3 py-2 font-medium">Requested</th>
                <th className="px-3 py-2 font-medium">Executed</th>
                <th className="px-3 py-2 font-medium">Status</th>
                <th className="px-3 py-2 font-medium">TIF</th>
                <th className="px-3 py-2 font-medium">Created</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                  <td className="px-3 py-2">
                    <Link
                      to={`/trading/orders/${order.id}`}
                      className="text-sky-300 hover:underline focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-sky-400"
                    >
                      {order.symbol}
                    </Link>
                  </td>
                  <td className="px-3 py-2 text-slate-200">{order.side}</td>
                  <td className="px-3 py-2 text-slate-200">{order.type}</td>
                  <td className="px-3 py-2 text-slate-200">{formatMoney(order.quantity)}</td>
                  <td className="px-3 py-2 text-slate-200">{formatMoney(order.filledQuantity)}</td>
                  <td className="px-3 py-2 text-slate-200">
                    {formatMoney(order.remainingQuantity)}
                  </td>
                  <td className="px-3 py-2 text-slate-200">{formatMoney(order.requestedPrice)}</td>
                  <td className="px-3 py-2 text-slate-200">{formatMoney(order.executedPrice)}</td>
                  <td className="px-3 py-2">
                    <span
                      className={`rounded border px-2 py-0.5 text-xs ${statusClass(order.status)}`}
                    >
                      {order.status}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-slate-200">{order.timeInForce}</td>
                  <td className="px-3 py-2 text-slate-400">
                    {new Date(order.createdAt).toLocaleString()}
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
