import type {
  ConnectionMetadataView,
  MarketDataProviderCatalogView,
  MarketSymbolDiscoveryView,
} from '../shared/api';

export type MarketDataViewProps = {
  providers: MarketDataProviderCatalogView | null;
  connections: ConnectionMetadataView[];
  selectedConnectionId: string;
  discovery: MarketSymbolDiscoveryView | null;
  loading: boolean;
  discovering: boolean;
  error: string | null;
  onSelectConnection: (connectionId: string) => void;
  onDiscover: () => void;
};

export function MarketDataView({
  providers,
  connections,
  selectedConnectionId,
  discovery,
  loading,
  discovering,
  error,
  onSelectConnection,
  onDiscover,
}: MarketDataViewProps) {
  const exchangeConnections = connections.filter((item) => item.connectionType === 'EXCHANGE');
  const selected = exchangeConnections.find((item) => item.id === selectedConnectionId) ?? null;

  return (
    <section className="space-y-8">
      <div>
        <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Market Data</p>
        <h2 className="mt-1 text-3xl font-semibold">Market Data</h2>
        <p className="mt-2 max-w-3xl text-slate-400">
          Load tradable symbols from a supported exchange connection. Symbols are normalized into
          one product model. This surface does not show ticker, candles, order book, balances,
          positions, or trading controls.
        </p>
      </div>

      {error ? (
        <p role="alert" className="rounded bg-red-950/50 p-3 text-red-200">
          {error}
        </p>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded border border-white/10 p-5">
          <h3 className="text-lg font-medium">Select Exchange</h3>
          {loading ? <p className="mt-3 text-slate-400">Loading Market Data…</p> : null}
          <div className="mt-4 space-y-3">
            {providers?.providers.map((provider) => (
              <div key={provider.id}>
                <h4 className="font-medium">{provider.displayName}</h4>
                <p className="mt-1 text-sm text-slate-400">
                  {provider.availability === 'AVAILABLE' ? 'Available' : 'Unavailable'}
                  {' · '}
                  Symbols
                  {provider.id === 'BINANCE'
                    ? ' discovery supported'
                    : ' discovery not implemented'}
                </p>
              </div>
            ))}
          </div>

          <label className="mt-6 block text-sm text-slate-300">
            Exchange connection
            <select
              className="mt-2 w-full rounded border border-white/10 bg-slate-950 px-3 py-2"
              value={selectedConnectionId}
              onChange={(event) => onSelectConnection(event.target.value)}
              disabled={loading || exchangeConnections.length === 0}
            >
              <option value="">Select a connection</option>
              {exchangeConnections.map((connection) => (
                <option key={connection.id} value={connection.id}>
                  {connection.displayName} ({connection.provider}) — {connection.status}
                </option>
              ))}
            </select>
          </label>

          <button
            type="button"
            className="mt-4 rounded bg-sky-700 px-4 py-2 text-sm font-medium disabled:opacity-50"
            onClick={onDiscover}
            disabled={!selected || discovering || loading}
          >
            {discovering ? 'Loading symbols…' : 'Load Symbols'}
          </button>
        </section>

        <section className="rounded border border-white/10 p-5">
          <h3 className="text-lg font-medium">Normalized symbols</h3>
          {!discovery ? (
            <p className="mt-3 text-slate-400">Select an exchange connection and load symbols.</p>
          ) : null}
          {discovery?.outcome === 'COMPLETED' ? (
            <div className="mt-3">
              <p className="text-sm text-slate-400">
                {discovery.symbols.length} symbols from {discovery.providerId}
              </p>
              <ul className="mt-4 max-h-96 space-y-2 overflow-auto text-sm">
                {discovery.symbols.map((symbol) => (
                  <li key={symbol.exchangeSymbol} className="border-b border-white/5 py-2">
                    <span className="font-medium">{symbol.normalizedSymbol}</span>
                    <span className="ml-2 text-slate-400">
                      {symbol.exchangeSymbol} · {symbol.tradingStatus}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {discovery && discovery.outcome !== 'COMPLETED' ? (
            <div className="mt-3" role="status">
              <p className="font-medium text-amber-200">
                {discovery.outcome === 'PROVIDER_UNAVAILABLE'
                  ? 'Provider Unavailable'
                  : discovery.outcome === 'NOT_IMPLEMENTED'
                    ? 'Provider unavailable — symbol discovery not implemented'
                    : 'Symbol discovery failed'}
              </p>
              {discovery.failureReason ? (
                <p className="mt-2 text-sm text-slate-400">{discovery.failureReason}</p>
              ) : null}
            </div>
          ) : null}
        </section>
      </div>
    </section>
  );
}
