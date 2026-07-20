import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  api,
  type LiveAlertView,
  type LiveEventView,
  type LiveSessionView,
  type LiveSynchronizationLogView,
  type LiveWorkspaceHealthView,
  type OrderView,
  type PortfolioView,
  type PositionView,
} from '../shared/api';
import { ConfirmationDialog } from '../shared/ConfirmationDialog';

type KillSwitchStep = null | 'review' | 'confirm';

function statusClass(status: string): string {
  if (status === 'RUNNING' || status === 'CONNECTED' || status === 'SYNCED') {
    return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200';
  }
  if (
    status === 'PAUSED' ||
    status === 'RECONNECTING' ||
    status === 'SYNCING' ||
    status === 'RECOVERING'
  ) {
    return 'border-amber-500/30 bg-amber-500/10 text-amber-200';
  }
  if (status === 'FAILED' || status === 'OUT_OF_SYNC') {
    return 'border-red-500/30 bg-red-500/10 text-red-200';
  }
  return 'border-slate-500/30 bg-slate-500/10 text-slate-300';
}

function formatTime(value: string | null | undefined): string {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

function formatMoney(value: string | null | undefined): string {
  if (value === null || value === undefined || value === '') return '—';
  const num = Number(value);
  if (!Number.isFinite(num)) return value;
  return num.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 8,
  });
}

export function LiveTradingPage() {
  const [sessions, setSessions] = useState<LiveSessionView[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [health, setHealth] = useState<LiveWorkspaceHealthView | null>(null);
  const [syncLogs, setSyncLogs] = useState<LiveSynchronizationLogView[]>([]);
  const [portfolio, setPortfolio] = useState<PortfolioView | null>(null);
  const [orders, setOrders] = useState<OrderView[]>([]);
  const [positions, setPositions] = useState<PositionView[]>([]);
  const [events, setEvents] = useState<LiveEventView[]>([]);
  const [alerts, setAlerts] = useState<LiveAlertView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exchange, setExchange] = useState('MOCK');
  const [accountId, setAccountId] = useState('live-account-1');
  const [symbol, setSymbol] = useState('BTCUSDT');
  const [side, setSide] = useState('BUY');
  const [quantity, setQuantity] = useState('0.001');
  const [busy, setBusy] = useState(false);
  const [killSwitchStep, setKillSwitchStep] = useState<KillSwitchStep>(null);
  const [killSwitchPhrase, setKillSwitchPhrase] = useState('');

  const active = sessions.find((s) => s.id === activeId) ?? null;

  const refreshSessions = useCallback(async () => {
    const [list, status, healthView, syncView] = await Promise.all([
      api.listLiveSessions(),
      api.getLiveStatus(),
      api.getLiveHealth(),
      api.getLiveSynchronization(),
    ]);
    setSessions(list);
    setHealth(healthView);
    setSyncLogs(syncView.logs);
    setAlerts(healthView.alerts);
    setActiveId((current) => {
      if (current && list.some((s) => s.id === current)) return current;
      const running = status.activeSessions.find((s) => s.status === 'RUNNING');
      return running?.id ?? status.activeSessions[0]?.id ?? list[0]?.id ?? null;
    });
  }, []);

  const refreshActive = useCallback(async (sessionId: string) => {
    const [pf, ords, pos, evts] = await Promise.all([
      api.getLiveSessionPortfolio(sessionId),
      api.listLiveSessionOrders(sessionId),
      api.listLiveSessionPositions(sessionId),
      api.listLiveSessionEvents(sessionId),
    ]);
    setPortfolio(pf);
    setOrders(ords);
    setPositions(pos);
    setEvents(evts);
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await refreshSessions();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load live trading');
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
      setEvents([]);
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
          <h2 className="mt-1 text-2xl font-semibold">Live Trading</h2>
          <p className="mt-2 text-slate-400">
            Operational workspace for live sessions via Trading Core and Exchange Adapter.
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            to="/trading/exchanges"
            className="rounded border border-white/15 px-3 py-2 text-sm text-slate-200 hover:bg-white/5"
          >
            Exchanges
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

      {alerts.length > 0 ? (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3">
          <h3 className="text-sm font-medium text-amber-100">Alerts</h3>
          <ul className="mt-2 space-y-1 text-sm text-amber-200/90">
            {alerts.map((alert, idx) => (
              <li key={`${alert.type}-${idx}`}>
                <span className="uppercase tracking-wide text-xs text-amber-300/80">
                  {alert.severity}
                </span>{' '}
                {alert.message}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <div className="space-y-4">
          <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4">
            <h3 className="text-sm font-medium text-slate-200">Start Session</h3>
            <label className="mt-3 block text-xs text-slate-500">
              Exchange
              <select
                value={exchange}
                onChange={(e) => setExchange(e.target.value)}
                className="mt-1 w-full rounded border border-white/10 bg-slate-950 px-3 py-2 text-sm text-slate-100"
              >
                <option value="MOCK">MOCK</option>
                <option value="BINANCE">BINANCE</option>
                <option value="BYBIT">BYBIT</option>
                <option value="OKX">OKX</option>
              </select>
            </label>
            <label className="mt-3 block text-xs text-slate-500">
              Account ID
              <input
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="mt-1 w-full rounded border border-white/10 bg-slate-950 px-3 py-2 text-sm text-slate-100"
              />
            </label>
            <button
              type="button"
              disabled={busy}
              onClick={() =>
                void run(async () => {
                  const session = await api.startLiveSession({ exchange, accountId });
                  setActiveId(session.id);
                })
              }
              className="mt-4 w-full rounded bg-sky-600 px-3 py-2 text-sm font-medium text-white hover:bg-sky-500 disabled:opacity-50"
            >
              Start Live
            </button>
          </div>

          <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4">
            <h3 className="text-sm font-medium text-slate-200">Active Sessions</h3>
            <ul className="mt-3 space-y-2">
              {sessions.length === 0 ? (
                <li className="text-sm text-slate-500">No sessions yet.</li>
              ) : (
                sessions.map((session) => (
                  <li key={session.id}>
                    <button
                      type="button"
                      onClick={() => setActiveId(session.id)}
                      className={`w-full rounded border px-3 py-2 text-left text-sm ${
                        session.id === activeId
                          ? 'border-sky-500/40 bg-sky-500/10'
                          : 'border-white/10 hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium text-slate-100">{session.exchange}</span>
                        <span
                          className={`rounded px-2 py-0.5 text-xs ${statusClass(session.status)}`}
                        >
                          {session.status}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-slate-500">{session.accountId}</p>
                    </button>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>

        <div className="space-y-6">
          {active ? (
            <>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={busy || active.status !== 'RUNNING'}
                  onClick={() =>
                    void run(async () => {
                      await api.pauseLiveSession(active.id);
                    })
                  }
                  className="rounded border border-white/15 px-3 py-2 text-sm disabled:opacity-40"
                >
                  Pause
                </button>
                <button
                  type="button"
                  disabled={busy || active.status !== 'PAUSED'}
                  onClick={() =>
                    void run(async () => {
                      await api.resumeLiveSession(active.id);
                    })
                  }
                  className="rounded border border-white/15 px-3 py-2 text-sm disabled:opacity-40"
                >
                  Resume
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() =>
                    void run(async () => {
                      await api.reconnectLiveSession(active.id);
                    })
                  }
                  className="rounded border border-white/15 px-3 py-2 text-sm disabled:opacity-40"
                >
                  Reconnect
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() =>
                    void run(async () => {
                      await api.synchronizeLiveSession(active.id);
                    })
                  }
                  className="rounded border border-white/15 px-3 py-2 text-sm disabled:opacity-40"
                >
                  Synchronize
                </button>
                <button
                  type="button"
                  disabled={busy || active.tradingFrozen}
                  onClick={() => {
                    setKillSwitchPhrase('');
                    setKillSwitchStep('review');
                  }}
                  className="rounded border border-red-500/50 bg-red-600/90 px-3 py-2 text-sm font-semibold text-white hover:bg-red-500 disabled:opacity-40"
                >
                  Kill Switch
                </button>
                {active.tradingFrozen ? (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() =>
                      void run(async () => {
                        await api.clearKillSwitch(active.id);
                      })
                    }
                    className="rounded border border-amber-500/40 px-3 py-2 text-sm text-amber-100 disabled:opacity-40"
                  >
                    Clear Kill Switch
                  </button>
                ) : null}
                <button
                  type="button"
                  disabled={busy}
                  onClick={() =>
                    void run(async () => {
                      await api.stopLiveSession(active.id);
                    })
                  }
                  className="rounded border border-red-500/30 px-3 py-2 text-sm text-red-200 disabled:opacity-40"
                >
                  Stop
                </button>
              </div>

              {active.tradingFrozen ? (
                <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                  Kill switch active — trading is frozen. New orders are blocked until cleared.
                </div>
              ) : null}

              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Exchange Status</p>
                  <p className="mt-2 text-lg text-slate-100">{active.exchange}</p>
                  <p
                    className={`mt-1 inline-block rounded px-2 py-0.5 text-xs ${statusClass(active.status)}`}
                  >
                    {active.status}
                  </p>
                  <p className="mt-2 text-xs text-slate-500">Reconnects: {active.reconnectCount}</p>
                </div>
                <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Synchronization</p>
                  <p
                    className={`mt-2 inline-block rounded px-2 py-0.5 text-xs ${statusClass(active.synchronizationState)}`}
                  >
                    {active.synchronizationState}
                  </p>
                  <p className="mt-2 text-xs text-slate-500">
                    Heartbeat: {formatTime(active.lastHeartbeat)}
                  </p>
                </div>
                <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Health</p>
                  <p className="mt-2 text-lg text-slate-100">
                    {health?.healthy ? 'Healthy' : 'Degraded'}
                  </p>
                  <p className="mt-2 text-xs text-slate-500">
                    REST latency:{' '}
                    {health?.sessions.find((s) => s.sessionId === active.id)?.restLatencyMs ?? '—'}{' '}
                    ms
                  </p>
                </div>
              </div>

              <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4">
                <h3 className="text-sm font-medium text-slate-200">Submit Order</h3>
                <div className="mt-3 flex flex-wrap gap-3">
                  <input
                    value={symbol}
                    onChange={(e) => setSymbol(e.target.value)}
                    className="rounded border border-white/10 bg-slate-950 px-3 py-2 text-sm"
                    placeholder="Symbol"
                  />
                  <select
                    value={side}
                    onChange={(e) => setSide(e.target.value)}
                    className="rounded border border-white/10 bg-slate-950 px-3 py-2 text-sm"
                  >
                    <option value="BUY">BUY</option>
                    <option value="SELL">SELL</option>
                  </select>
                  <input
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="rounded border border-white/10 bg-slate-950 px-3 py-2 text-sm"
                    placeholder="Quantity"
                  />
                  <button
                    type="button"
                    disabled={busy || active.status !== 'RUNNING' || active.tradingFrozen}
                    onClick={() =>
                      void run(async () => {
                        await api.submitLiveOrder({
                          sessionId: active.id,
                          symbol,
                          side,
                          type: 'MARKET',
                          quantity,
                        });
                      })
                    }
                    className="rounded bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-40"
                  >
                    Submit
                  </button>
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4">
                  <h3 className="text-sm font-medium text-slate-200">Portfolio</h3>
                  <dl className="mt-3 space-y-1 text-sm text-slate-300">
                    <div className="flex justify-between">
                      <dt>Cash</dt>
                      <dd>{formatMoney(portfolio?.balance.cash)}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt>Equity</dt>
                      <dd>{formatMoney(portfolio?.equity.equity)}</dd>
                    </div>
                  </dl>
                </div>
                <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4">
                  <h3 className="text-sm font-medium text-slate-200">Positions</h3>
                  <ul className="mt-3 space-y-1 text-sm text-slate-300">
                    {positions.length === 0 ? (
                      <li className="text-slate-500">No positions</li>
                    ) : (
                      positions.map((p) => (
                        <li key={p.id} className="flex justify-between gap-2">
                          <span>
                            {p.symbol} {p.side}
                          </span>
                          <span>{p.quantity}</span>
                        </li>
                      ))
                    )}
                  </ul>
                </div>
              </div>

              <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4">
                <h3 className="text-sm font-medium text-slate-200">Orders</h3>
                <ul className="mt-3 space-y-1 text-sm text-slate-300">
                  {orders.length === 0 ? (
                    <li className="text-slate-500">No orders</li>
                  ) : (
                    orders.map((o) => (
                      <li key={o.id} className="flex justify-between gap-2">
                        <span>
                          {o.side} {o.quantity} {o.symbol}
                        </span>
                        <span className={`rounded px-2 py-0.5 text-xs ${statusClass(o.status)}`}>
                          {o.status}
                        </span>
                      </li>
                    ))
                  )}
                </ul>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4">
                  <h3 className="text-sm font-medium text-slate-200">Synchronization Log</h3>
                  <ul className="mt-3 max-h-48 space-y-1 overflow-auto text-xs text-slate-400">
                    {syncLogs
                      .filter((l) => l.sessionId === active.id)
                      .map((log) => (
                        <li key={log.id}>
                          {formatTime(log.startedAt)} · {log.kind} · {log.status}
                        </li>
                      ))}
                  </ul>
                </div>
                <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4">
                  <h3 className="text-sm font-medium text-slate-200">Event Stream</h3>
                  <ul className="mt-3 max-h-48 space-y-1 overflow-auto text-xs text-slate-400">
                    {events.length === 0 ? (
                      <li>No events</li>
                    ) : (
                      events.map((evt) => (
                        <li key={evt.id}>
                          {formatTime(evt.timestamp)} · {evt.type}
                        </li>
                      ))
                    )}
                  </ul>
                </div>
              </div>
            </>
          ) : (
            <div className="rounded-lg border border-dashed border-white/10 px-6 py-12 text-center text-slate-500">
              Start a live session to monitor portfolio, positions, orders, sync, and health.
            </div>
          )}
        </div>
      </div>

      <ConfirmationDialog
        open={killSwitchStep === 'review'}
        title="Activate Kill Switch?"
        message="This will freeze trading, cancel all open orders, disable strategy submission, and close open positions. This action is intended for emergencies only."
        confirmLabel="Continue"
        cancelLabel="Cancel"
        variant="danger"
        onCancel={() => {
          setKillSwitchStep(null);
          setKillSwitchPhrase('');
        }}
        onConfirm={() => {
          setKillSwitchPhrase('');
          setKillSwitchStep('confirm');
        }}
      />

      <ConfirmationDialog
        open={killSwitchStep === 'confirm'}
        title="Final confirmation"
        message="Type KILL to activate the kill switch. Accidental activation can liquidate open exposure."
        confirmLabel="Activate Kill Switch"
        cancelLabel="Go back"
        variant="danger"
        requireTypedPhrase="KILL"
        typedValue={killSwitchPhrase}
        onTypedValueChange={setKillSwitchPhrase}
        onCancel={() => {
          setKillSwitchPhrase('');
          setKillSwitchStep('review');
        }}
        onConfirm={() => {
          if (!activeId) return;
          const sessionId = activeId;
          setKillSwitchStep(null);
          setKillSwitchPhrase('');
          void run(async () => {
            await api.activateKillSwitch(sessionId, {
              closePositions: true,
              reason: 'manual kill switch',
            });
          });
        }}
      />
    </section>
  );
}
