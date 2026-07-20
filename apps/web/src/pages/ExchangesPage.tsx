import { useCallback, useEffect, useState } from 'react';
import {
  api,
  type ExchangeCapabilitiesView,
  type ExchangeConnectionView,
  type ExchangeStatusView,
  type ExchangeView,
} from '../shared/api';

function statusClass(status: string): string {
  if (status === 'CONNECTED') return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200';
  if (status === 'CONNECTING' || status === 'RECONNECTING') {
    return 'border-amber-500/30 bg-amber-500/10 text-amber-200';
  }
  if (status === 'ERROR') return 'border-red-500/30 bg-red-500/10 text-red-200';
  return 'border-slate-500/30 bg-slate-500/10 text-slate-300';
}

function capabilityFlags(caps: ExchangeCapabilitiesView): string[] {
  const flags: string[] = [];
  if (caps.supportsSpot) flags.push('Spot');
  if (caps.supportsMargin) flags.push('Margin');
  if (caps.supportsFutures) flags.push('Futures');
  if (caps.supportsWebSocket) flags.push('WebSocket');
  if (caps.supportsMarketOrders) flags.push('Market');
  if (caps.supportsLimitOrders) flags.push('Limit');
  if (caps.supportsOCO) flags.push('OCO');
  if (caps.supportsReduceOnly) flags.push('Reduce-only');
  return flags;
}

function formatTime(value: string | null | undefined): string {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

export function ExchangesPage() {
  const [status, setStatus] = useState<ExchangeStatusView | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const next = await api.getExchangeStatus();
      setStatus(next);
      setSelectedId((current) => {
        if (current && next.exchanges.some((e) => e.exchangeId === current)) return current;
        const connected = next.exchanges.find((e) => e.connection?.status === 'CONNECTED');
        return connected?.exchangeId ?? next.exchanges[0]?.exchangeId ?? null;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load exchanges');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const selected: ExchangeView | null =
    status?.exchanges.find((e) => e.exchangeId === selectedId) ?? null;
  const connection: ExchangeConnectionView | null = selected?.connection ?? null;

  async function connect(exchangeId: string) {
    setBusy(exchangeId);
    setError(null);
    try {
      await api.connectExchange(exchangeId);
      await refresh();
      setSelectedId(exchangeId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect');
    } finally {
      setBusy(null);
    }
  }

  async function disconnect(exchangeId: string) {
    setBusy(exchangeId);
    setError(null);
    try {
      await api.disconnectExchange(exchangeId);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to disconnect');
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-8">
      <header className="space-y-2">
        <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Trading</p>
        <h1 className="text-3xl font-semibold text-slate-50">Exchanges</h1>
        <p className="max-w-2xl text-slate-400">
          Exchange adapter connections, latency, heartbeats, and declared capabilities. Trading Core
          stays exchange-agnostic.
        </p>
      </header>

      {error ? (
        <div className="rounded border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-200">
          {error}
        </div>
      ) : null}

      {loading && !status ? (
        <p className="text-slate-400">Loading exchanges…</p>
      ) : (
        <>
          <section className="flex flex-wrap gap-4 text-sm text-slate-300">
            <span>
              Connected: <strong className="text-slate-100">{status?.connectedCount ?? 0}</strong>
            </span>
            <span>
              Registered: <strong className="text-slate-100">{status?.totalCount ?? 0}</strong>
            </span>
            <button
              type="button"
              onClick={() => void refresh()}
              className="text-sky-300 underline-offset-2 hover:underline"
            >
              Refresh
            </button>
          </section>

          <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
            <aside className="space-y-2">
              {(status?.exchanges ?? []).map((exchange) => {
                const conn = exchange.connection;
                const active = exchange.exchangeId === selectedId;
                return (
                  <button
                    key={exchange.exchangeId}
                    type="button"
                    onClick={() => setSelectedId(exchange.exchangeId)}
                    className={`w-full rounded border px-3 py-3 text-left transition ${
                      active
                        ? 'border-sky-500/40 bg-sky-500/10'
                        : 'border-slate-700/80 bg-slate-900/40 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-slate-100">{exchange.exchangeId}</span>
                      <span
                        className={`rounded border px-2 py-0.5 text-xs ${statusClass(
                          conn?.status ?? 'DISCONNECTED',
                        )}`}
                      >
                        {conn?.status ?? 'DISCONNECTED'}
                      </span>
                    </div>
                    {conn?.latencyMs != null ? (
                      <p className="mt-1 text-xs text-slate-400">{conn.latencyMs} ms</p>
                    ) : null}
                  </button>
                );
              })}
            </aside>

            <section className="space-y-6 rounded border border-slate-700/80 bg-slate-900/30 p-6">
              {selected ? (
                <>
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <h2 className="text-2xl font-semibold text-slate-50">
                        {selected.exchangeId}
                      </h2>
                      <p className="mt-1 text-sm text-slate-400">
                        Adapter boundary — events only, no portfolio or order mutations.
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {connection?.status === 'CONNECTED' ? (
                        <button
                          type="button"
                          disabled={busy === selected.exchangeId}
                          onClick={() => void disconnect(selected.exchangeId)}
                          className="rounded border border-slate-600 px-3 py-2 text-sm text-slate-200 hover:bg-slate-800 disabled:opacity-50"
                        >
                          Disconnect
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={busy === selected.exchangeId}
                          onClick={() => void connect(selected.exchangeId)}
                          className="rounded border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-100 hover:bg-emerald-500/20 disabled:opacity-50"
                        >
                          Connect
                        </button>
                      )}
                    </div>
                  </div>

                  <dl className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <dt className="text-xs uppercase tracking-wide text-slate-500">
                        Connection state
                      </dt>
                      <dd className="mt-1">
                        <span
                          className={`rounded border px-2 py-0.5 text-sm ${statusClass(
                            connection?.status ?? 'DISCONNECTED',
                          )}`}
                        >
                          {connection?.status ?? 'DISCONNECTED'}
                        </span>
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs uppercase tracking-wide text-slate-500">Latency</dt>
                      <dd className="mt-1 text-slate-200">
                        {connection?.latencyMs != null ? `${connection.latencyMs} ms` : '—'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs uppercase tracking-wide text-slate-500">
                        Last heartbeat
                      </dt>
                      <dd className="mt-1 text-slate-200">
                        {formatTime(connection?.lastHeartbeatAt)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs uppercase tracking-wide text-slate-500">
                        Last synchronization
                      </dt>
                      <dd className="mt-1 text-slate-200">
                        {formatTime(connection?.lastSynchronizedAt)}
                      </dd>
                    </div>
                  </dl>

                  <div>
                    <h3 className="text-sm font-medium text-slate-300">Capabilities</h3>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {capabilityFlags(selected.capabilities).map((flag) => (
                        <span
                          key={flag}
                          className="rounded border border-slate-600/80 px-2 py-1 text-xs text-slate-300"
                        >
                          {flag}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <h3 className="text-sm font-medium text-slate-300">API permissions</h3>
                      <ul className="mt-2 space-y-1 text-sm text-slate-400">
                        {(connection?.apiPermissions?.length
                          ? connection.apiPermissions
                          : ['—']
                        ).map((p) => (
                          <li key={p}>{p}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-slate-300">Supported markets</h3>
                      <ul className="mt-2 space-y-1 text-sm text-slate-400">
                        {(connection?.supportedMarkets?.length
                          ? connection.supportedMarkets
                          : selected.exchangeId === 'MOCK'
                            ? ['spot']
                            : ['—']
                        ).map((m) => (
                          <li key={m}>{m}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-slate-400">Select an exchange.</p>
              )}
            </section>
          </div>
        </>
      )}
    </div>
  );
}
