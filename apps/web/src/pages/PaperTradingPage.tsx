import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  api,
  type OrderView,
  type PaperExecutionView,
  type PaperSessionStatistics,
  type PaperSessionView,
  type PortfolioView,
  type PositionView,
} from '../shared/api';

function formatMoney(value: string | null | undefined): string {
  if (value === null || value === undefined || value === '') return '—';
  const num = Number(value);
  if (!Number.isFinite(num)) return value;
  return num.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 8,
  });
}

function formatPct(value: string): string {
  const num = Number(value);
  if (!Number.isFinite(num)) return value;
  return `${(num * 100).toFixed(2)}%`;
}

function statusClass(status: string): string {
  if (status === 'RUNNING') return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200';
  if (status === 'PAUSED') return 'border-amber-500/30 bg-amber-500/10 text-amber-200';
  if (status === 'CREATED') return 'border-sky-500/30 bg-sky-500/10 text-sky-200';
  if (status === 'COMPLETED') return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200';
  return 'border-slate-500/30 bg-slate-500/10 text-slate-300';
}

export function PaperTradingPage() {
  const [sessions, setSessions] = useState<PaperSessionView[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [portfolio, setPortfolio] = useState<PortfolioView | null>(null);
  const [orders, setOrders] = useState<OrderView[]>([]);
  const [positions, setPositions] = useState<PositionView[]>([]);
  const [executions, setExecutions] = useState<PaperExecutionView[]>([]);
  const [stats, setStats] = useState<PaperSessionStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState('Paper Session');
  const [initialBalance, setInitialBalance] = useState('100000');
  const [symbol, setSymbol] = useState('BTC-USD');
  const [side, setSide] = useState('BUY');
  const [quantity, setQuantity] = useState('1');
  const [price, setPrice] = useState('100');
  const [busy, setBusy] = useState(false);

  const active = sessions.find((s) => s.id === activeId) ?? null;

  const refreshSessions = useCallback(async () => {
    const list = await api.listPaperSessions();
    setSessions(list);
    setActiveId((current) => {
      if (current && list.some((s) => s.id === current)) return current;
      const running = list.find((s) => s.status === 'RUNNING');
      return running?.id ?? list[0]?.id ?? null;
    });
  }, []);

  const refreshActive = useCallback(async (sessionId: string) => {
    const [pf, ords, pos, execs, statistics] = await Promise.all([
      api.getPaperSessionPortfolio(sessionId),
      api.listPaperSessionOrders(sessionId),
      api.listPaperSessionPositions(sessionId),
      api.listPaperSessionExecutions(sessionId),
      api.getPaperSessionStatistics(sessionId),
    ]);
    setPortfolio(pf);
    setOrders(ords);
    setPositions(pos);
    setExecutions(execs);
    setStats(statistics);
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await refreshSessions();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load paper sessions');
    } finally {
      setLoading(false);
    }
  }, [refreshSessions]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!activeId) {
      setPortfolio(null);
      setOrders([]);
      setPositions([]);
      setExecutions([]);
      setStats(null);
      return;
    }
    void refreshActive(activeId).catch((err) => {
      setError(err instanceof Error ? err.message : 'Failed to load session detail');
    });
  }, [activeId, refreshActive]);

  async function run(action: () => Promise<void>) {
    setBusy(true);
    setError(null);
    try {
      await action();
      await refreshSessions();
      if (activeId) await refreshActive(activeId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Trading</p>
          <h2 className="mt-1 text-2xl font-semibold">Paper Trading</h2>
          <p className="mt-2 text-slate-400">
            Simulated sessions orchestrating orders, risk, positions, and portfolio.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void refresh()}
          disabled={loading}
          className="rounded border border-white/15 px-3 py-2 text-sm text-slate-200 hover:bg-white/5 disabled:opacity-50 focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-sky-400"
        >
          Refresh
        </button>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        <div className="space-y-4">
          <h3 className="text-sm font-medium uppercase tracking-wide text-slate-500">Sessions</h3>
          <form
            className="flex flex-wrap gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              void run(async () => {
                const created = await api.createPaperSession({
                  name,
                  initialBalance,
                });
                setActiveId(created.id);
                await refreshActive(created.id);
              });
            }}
          >
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Session name"
              className="min-w-[10rem] flex-1 rounded border border-white/15 bg-transparent px-3 py-2 text-sm text-slate-100"
            />
            <input
              value={initialBalance}
              onChange={(e) => setInitialBalance(e.target.value)}
              placeholder="Initial balance"
              className="w-28 rounded border border-white/15 bg-transparent px-3 py-2 text-sm text-slate-100"
            />
            <button
              type="submit"
              disabled={busy}
              className="rounded border border-sky-500/40 px-3 py-2 text-sm text-sky-200 hover:bg-sky-500/10 disabled:opacity-50"
            >
              Create
            </button>
          </form>

          {loading && sessions.length === 0 ? (
            <p className="text-sm text-slate-500">Loading sessions…</p>
          ) : null}
          {!loading && sessions.length === 0 ? (
            <p className="text-sm text-slate-500">No paper sessions yet.</p>
          ) : null}

          <ul className="space-y-2">
            {sessions.map((session) => (
              <li key={session.id}>
                <button
                  type="button"
                  onClick={() => setActiveId(session.id)}
                  className={`w-full rounded-lg border px-3 py-3 text-left transition ${
                    session.id === activeId
                      ? 'border-sky-500/40 bg-sky-500/10'
                      : 'border-white/10 hover:bg-white/[0.03]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-slate-100">{session.name}</span>
                    <span
                      className={`rounded border px-2 py-0.5 text-xs ${statusClass(session.status)}`}
                    >
                      {session.status}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    Equity {formatMoney(session.currentBalance)} · started{' '}
                    {session.startedAt ? new Date(session.startedAt).toLocaleString() : '—'}
                  </p>
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-6">
          {!active ? (
            <p className="text-sm text-slate-500">Select or create a session.</p>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="mr-auto text-lg font-medium text-slate-100">{active.name}</h3>
                {(active.status === 'CREATED' || active.status === 'PAUSED') && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() =>
                      void run(() => api.startPaperSession(active.id).then(() => undefined))
                    }
                    className="rounded border border-emerald-500/40 px-3 py-1.5 text-sm text-emerald-200 hover:bg-emerald-500/10 disabled:opacity-50"
                  >
                    Start
                  </button>
                )}
                {active.status === 'RUNNING' && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() =>
                      void run(() => api.pausePaperSession(active.id).then(() => undefined))
                    }
                    className="rounded border border-amber-500/40 px-3 py-1.5 text-sm text-amber-200 hover:bg-amber-500/10 disabled:opacity-50"
                  >
                    Pause
                  </button>
                )}
                {(active.status === 'RUNNING' || active.status === 'PAUSED') && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() =>
                      void run(() => api.stopPaperSession(active.id).then(() => undefined))
                    }
                    className="rounded border border-white/15 px-3 py-1.5 text-sm text-slate-200 hover:bg-white/5 disabled:opacity-50"
                  >
                    Stop
                  </button>
                )}
                <button
                  type="button"
                  disabled={busy || active.status === 'RUNNING'}
                  onClick={() =>
                    void run(async () => {
                      await api.deletePaperSession(active.id);
                      setActiveId(null);
                    })
                  }
                  className="rounded border border-red-500/40 px-3 py-1.5 text-sm text-red-200 hover:bg-red-500/10 disabled:opacity-50"
                >
                  Archive
                </button>
              </div>

              {stats ? (
                <div>
                  <h4 className="mb-2 text-sm font-medium uppercase tracking-wide text-slate-500">
                    Session Statistics
                  </h4>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {[
                      ['Net PnL', formatMoney(stats.netPnL)],
                      ['Gross PnL', formatMoney(stats.grossPnL)],
                      ['Win Rate', formatPct(stats.winRate)],
                      ['Profit Factor', stats.profitFactor],
                      ['Max Drawdown', formatPct(stats.maxDrawdown)],
                      ['Average Trade', formatMoney(stats.averageTrade)],
                      ['Sharpe', stats.sharpeRatio],
                      ['Current Equity', formatMoney(stats.currentEquity)],
                    ].map(([label, value]) => (
                      <div key={label} className="rounded-lg border border-white/10 px-3 py-2">
                        <p className="text-xs text-slate-500">{label}</p>
                        <p className="mt-1 text-sm font-medium text-slate-100">{value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {portfolio ? (
                <div>
                  <h4 className="mb-2 text-sm font-medium uppercase tracking-wide text-slate-500">
                    Portfolio
                  </h4>
                  <p className="text-sm text-slate-300">
                    Cash {formatMoney(portfolio.balance.cash)} · Equity{' '}
                    {formatMoney(portfolio.equity.equity)} · Return{' '}
                    {formatPct(portfolio.portfolioReturn)}
                  </p>
                </div>
              ) : null}

              {active.status === 'RUNNING' ? (
                <form
                  className="flex flex-wrap gap-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    void run(async () => {
                      await api.executePaperTrade(active.id, {
                        symbol,
                        side,
                        type: 'LIMIT',
                        quantity,
                        requestedPrice: price,
                      });
                    });
                  }}
                >
                  <h4 className="w-full text-sm font-medium uppercase tracking-wide text-slate-500">
                    Execute Trade
                  </h4>
                  <input
                    value={symbol}
                    onChange={(e) => setSymbol(e.target.value)}
                    className="w-28 rounded border border-white/15 bg-transparent px-3 py-2 text-sm"
                    placeholder="Symbol"
                  />
                  <select
                    value={side}
                    onChange={(e) => setSide(e.target.value)}
                    className="rounded border border-white/15 bg-slate-950 px-3 py-2 text-sm"
                  >
                    <option value="BUY">BUY</option>
                    <option value="SELL">SELL</option>
                  </select>
                  <input
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="w-20 rounded border border-white/15 bg-transparent px-3 py-2 text-sm"
                    placeholder="Qty"
                  />
                  <input
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-24 rounded border border-white/15 bg-transparent px-3 py-2 text-sm"
                    placeholder="Price"
                  />
                  <button
                    type="submit"
                    disabled={busy}
                    className="rounded border border-sky-500/40 px-3 py-2 text-sm text-sky-200 hover:bg-sky-500/10 disabled:opacity-50"
                  >
                    Submit
                  </button>
                </form>
              ) : null}

              <div className="overflow-x-auto rounded-lg border border-white/10">
                <h4 className="border-b border-white/10 px-3 py-2 text-xs uppercase tracking-wide text-slate-500">
                  Orders
                </h4>
                <table className="min-w-full text-left text-sm">
                  <thead className="border-b border-white/10 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-3 py-2">Symbol</th>
                      <th className="px-3 py-2">Side</th>
                      <th className="px-3 py-2">Qty</th>
                      <th className="px-3 py-2">Price</th>
                      <th className="px-3 py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr key={order.id} className="border-b border-white/5">
                        <td className="px-3 py-2">
                          <Link
                            to={`/trading/orders/${order.id}`}
                            className="text-sky-300 hover:underline"
                          >
                            {order.symbol}
                          </Link>
                        </td>
                        <td className="px-3 py-2">{order.side}</td>
                        <td className="px-3 py-2">{order.quantity}</td>
                        <td className="px-3 py-2">
                          {formatMoney(order.executedPrice ?? order.requestedPrice)}
                        </td>
                        <td className="px-3 py-2">{order.status}</td>
                      </tr>
                    ))}
                    {orders.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-3 py-3 text-slate-500">
                          No orders.
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>

              <div className="overflow-x-auto rounded-lg border border-white/10">
                <h4 className="border-b border-white/10 px-3 py-2 text-xs uppercase tracking-wide text-slate-500">
                  Positions
                </h4>
                <table className="min-w-full text-left text-sm">
                  <thead className="border-b border-white/10 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-3 py-2">Symbol</th>
                      <th className="px-3 py-2">Side</th>
                      <th className="px-3 py-2">Qty</th>
                      <th className="px-3 py-2">Entry</th>
                      <th className="px-3 py-2">Unrealized</th>
                    </tr>
                  </thead>
                  <tbody>
                    {positions.map((position) => (
                      <tr key={position.id} className="border-b border-white/5">
                        <td className="px-3 py-2">{position.symbol}</td>
                        <td className="px-3 py-2">{position.side}</td>
                        <td className="px-3 py-2">{position.quantity}</td>
                        <td className="px-3 py-2">{formatMoney(position.entryPrice)}</td>
                        <td className="px-3 py-2">{formatMoney(position.unrealizedPnL)}</td>
                      </tr>
                    ))}
                    {positions.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-3 py-3 text-slate-500">
                          No positions.
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>

              <div className="overflow-x-auto rounded-lg border border-white/10">
                <h4 className="border-b border-white/10 px-3 py-2 text-xs uppercase tracking-wide text-slate-500">
                  Trade History
                </h4>
                <table className="min-w-full text-left text-sm">
                  <thead className="border-b border-white/10 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-3 py-2">Time</th>
                      <th className="px-3 py-2">Order</th>
                      <th className="px-3 py-2">Price</th>
                      <th className="px-3 py-2">Slippage</th>
                      <th className="px-3 py-2">Commission</th>
                    </tr>
                  </thead>
                  <tbody>
                    {executions.map((exec) => (
                      <tr key={exec.id} className="border-b border-white/5">
                        <td className="px-3 py-2">
                          {new Date(exec.executionTime).toLocaleString()}
                        </td>
                        <td className="px-3 py-2 font-mono text-xs text-slate-400">
                          {exec.orderId.slice(0, 8)}
                        </td>
                        <td className="px-3 py-2">{formatMoney(exec.executionPrice)}</td>
                        <td className="px-3 py-2">{exec.slippage}</td>
                        <td className="px-3 py-2">{formatMoney(exec.commission)}</td>
                      </tr>
                    ))}
                    {executions.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-3 py-3 text-slate-500">
                          No executions.
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>

              {portfolio && portfolio.equity ? (
                <div>
                  <h4 className="mb-2 text-sm font-medium uppercase tracking-wide text-slate-500">
                    Equity Curve
                  </h4>
                  <p className="text-sm text-slate-400">
                    Initial {formatMoney(active.initialBalance)} → Current{' '}
                    {formatMoney(stats?.currentEquity ?? active.currentBalance)}
                  </p>
                </div>
              ) : null}
            </>
          )}
        </div>
      </div>
    </section>
  );
}
