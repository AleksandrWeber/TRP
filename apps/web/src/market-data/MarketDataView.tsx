import type {
  ConnectionMetadataView,
  MarketCandleInterval,
  MarketCandleRetrievalView,
  MarketDataProviderCatalogView,
  MarketOrderBookDepth,
  MarketOrderBookRetrievalView,
  MarketSymbolDiscoveryView,
  MarketSymbolView,
  MarketTickerRetrievalView,
} from '../shared/api';

export const MARKET_DATA_CANDLE_INTERVALS: readonly MarketCandleInterval[] = [
  '1m',
  '5m',
  '15m',
  '1h',
  '4h',
  '1d',
];

export const MARKET_DATA_ORDER_BOOK_DEPTHS: readonly MarketOrderBookDepth[] = [10, 20, 50, 100];

export type MarketDataViewProps = {
  providers: MarketDataProviderCatalogView | null;
  connections: ConnectionMetadataView[];
  selectedConnectionId: string;
  discovery: MarketSymbolDiscoveryView | null;
  selectedSymbol: MarketSymbolView | null;
  ticker: MarketTickerRetrievalView | null;
  selectedInterval: MarketCandleInterval;
  candles: MarketCandleRetrievalView | null;
  selectedDepth: MarketOrderBookDepth;
  orderBook: MarketOrderBookRetrievalView | null;
  loading: boolean;
  discovering: boolean;
  retrievingTicker: boolean;
  retrievingCandles: boolean;
  retrievingOrderBook: boolean;
  error: string | null;
  onSelectConnection: (connectionId: string) => void;
  onDiscover: () => void;
  onSelectSymbol: (symbol: MarketSymbolView | null) => void;
  onRetrieveTicker: () => void;
  onSelectInterval: (interval: MarketCandleInterval) => void;
  onRetrieveCandles: () => void;
  onSelectDepth: (depth: MarketOrderBookDepth) => void;
  onRetrieveOrderBook: () => void;
};

export function MarketDataView({
  providers,
  connections,
  selectedConnectionId,
  discovery,
  selectedSymbol,
  ticker,
  selectedInterval,
  candles,
  selectedDepth,
  orderBook,
  loading,
  discovering,
  retrievingTicker,
  retrievingCandles,
  retrievingOrderBook,
  error,
  onSelectConnection,
  onDiscover,
  onSelectSymbol,
  onRetrieveTicker,
  onSelectInterval,
  onRetrieveCandles,
  onSelectDepth,
  onRetrieveOrderBook,
}: MarketDataViewProps) {
  const exchangeConnections = connections.filter((item) => item.connectionType === 'EXCHANGE');
  const selected = exchangeConnections.find((item) => item.id === selectedConnectionId) ?? null;

  return (
    <section className="space-y-8">
      <div>
        <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Market Data</p>
        <h2 className="mt-1 text-3xl font-semibold">Market Data</h2>
        <p className="mt-2 max-w-3xl text-slate-400">
          Load tradable symbols, the current ticker, historical OHLCV candles, and order book
          snapshots from a supported exchange connection. Data is normalized into one product model.
          This surface does not show trades, streaming state, balances, positions, or trading
          controls.
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
                  {provider.id === 'BINANCE'
                    ? 'Symbols, ticker, candles, and order book supported'
                    : 'Symbols, ticker, candles, and order book not implemented'}
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
              <label className="mt-4 block text-sm text-slate-300">
                Select Symbol
                <select
                  className="mt-2 w-full rounded border border-white/10 bg-slate-950 px-3 py-2"
                  value={selectedSymbol?.exchangeSymbol ?? ''}
                  onChange={(event) => {
                    const next =
                      discovery.symbols.find(
                        (symbol) => symbol.exchangeSymbol === event.target.value,
                      ) ?? null;
                    onSelectSymbol(next);
                  }}
                >
                  <option value="">Select a symbol</option>
                  {discovery.symbols.map((symbol) => (
                    <option key={symbol.exchangeSymbol} value={symbol.exchangeSymbol}>
                      {symbol.normalizedSymbol} ({symbol.exchangeSymbol})
                    </option>
                  ))}
                </select>
              </label>
              <ul className="mt-4 max-h-64 space-y-2 overflow-auto text-sm">
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

      <section className="rounded border border-white/10 p-5">
        <h3 className="text-lg font-medium">Ticker</h3>
        <p className="mt-2 text-sm text-slate-400">
          Load the current ticker for the selected symbol. Freshness reflects observed exchange and
          retrieval timestamps only.
        </p>
        <button
          type="button"
          className="mt-4 rounded bg-sky-700 px-4 py-2 text-sm font-medium disabled:opacity-50"
          onClick={onRetrieveTicker}
          disabled={!selected || !selectedSymbol || retrievingTicker || loading}
        >
          {retrievingTicker ? 'Loading ticker…' : 'Load Ticker'}
        </button>

        {!ticker ? (
          <p className="mt-4 text-slate-400">Select a symbol and load the current ticker.</p>
        ) : null}

        {ticker?.outcome === 'COMPLETED' && ticker.ticker ? (
          <div className="mt-4 space-y-2 text-sm" data-testid="ticker-panel">
            <p>
              <span className="text-slate-400">Symbol</span>{' '}
              <span className="font-medium">{ticker.ticker.normalizedSymbol}</span>
            </p>
            <p>
              <span className="text-slate-400">Last</span>{' '}
              <span className="font-medium">{ticker.ticker.lastPrice}</span>
            </p>
            <p>
              <span className="text-slate-400">Bid / Ask</span>{' '}
              <span className="font-medium">
                {ticker.ticker.bid} / {ticker.ticker.ask}
              </span>
            </p>
            <p>
              <span className="text-slate-400">24h change %</span>{' '}
              <span className="font-medium">{ticker.ticker.changePercent24h}</span>
            </p>
            <p>
              <span className="text-slate-400">24h high / low</span>{' '}
              <span className="font-medium">
                {ticker.ticker.high24h} / {ticker.ticker.low24h}
              </span>
            </p>
            <p>
              <span className="text-slate-400">24h volume</span>{' '}
              <span className="font-medium">{ticker.ticker.volume24h}</span>
            </p>
            <p>
              <span className="text-slate-400">Freshness</span>{' '}
              <span className="font-medium" data-testid="ticker-freshness">
                {formatFreshness(ticker.freshness)}
              </span>
            </p>
            <p className="text-slate-500">
              Exchange {ticker.ticker.exchangeTimestamp} · Retrieved{' '}
              {ticker.ticker.retrievalTimestamp}
            </p>
          </div>
        ) : null}

        {ticker && ticker.outcome !== 'COMPLETED' ? (
          <div className="mt-4" role="status">
            <p className="font-medium text-amber-200">
              {ticker.outcome === 'PROVIDER_UNAVAILABLE'
                ? 'Provider Unavailable'
                : ticker.outcome === 'NOT_IMPLEMENTED'
                  ? 'Provider unavailable — ticker retrieval not implemented'
                  : 'Ticker retrieval failed'}
            </p>
            <p className="mt-2 text-sm text-slate-400">
              Freshness: {formatFreshness(ticker.freshness)}
            </p>
            {ticker.failureReason ? (
              <p className="mt-2 text-sm text-slate-400">{ticker.failureReason}</p>
            ) : null}
          </div>
        ) : null}
      </section>

      <section className="rounded border border-white/10 p-5">
        <h3 className="text-lg font-medium">Candles</h3>
        <p className="mt-2 text-sm text-slate-400">
          Load historical OHLCV candles for the selected symbol and interval. Freshness reflects the
          latest observed candle close versus retrieval time.
        </p>
        <label className="mt-4 block text-sm text-slate-300">
          Select Interval
          <select
            className="mt-2 w-full max-w-xs rounded border border-white/10 bg-slate-950 px-3 py-2"
            value={selectedInterval}
            onChange={(event) => onSelectInterval(event.target.value as MarketCandleInterval)}
          >
            {MARKET_DATA_CANDLE_INTERVALS.map((interval) => (
              <option key={interval} value={interval}>
                {interval}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          className="mt-4 rounded bg-sky-700 px-4 py-2 text-sm font-medium disabled:opacity-50"
          onClick={onRetrieveCandles}
          disabled={!selected || !selectedSymbol || retrievingCandles || loading}
        >
          {retrievingCandles ? 'Loading candles…' : 'Load Candles'}
        </button>

        {!candles ? (
          <p className="mt-4 text-slate-400">Select a symbol and interval, then load candles.</p>
        ) : null}

        {candles?.outcome === 'COMPLETED' ? (
          <div className="mt-4 space-y-3 text-sm" data-testid="candles-panel">
            <p>
              <span className="text-slate-400">Freshness</span>{' '}
              <span className="font-medium" data-testid="candles-freshness">
                {formatFreshness(candles.freshness)}
              </span>
              <span className="ml-3 text-slate-400">
                {candles.candles.length} candles · {candles.interval}
              </span>
            </p>
            <p className="text-slate-500">
              Range {candles.rangeStart} → {candles.rangeEnd}
            </p>
            <ul className="max-h-80 space-y-2 overflow-auto">
              {candles.candles.map((candle) => (
                <li
                  key={candle.openTime}
                  className="border-b border-white/5 py-2 font-mono text-xs"
                >
                  <span className="font-medium">{candle.openTime}</span>
                  <span className="ml-2 text-slate-400">
                    O {candle.open} H {candle.high} L {candle.low} C {candle.close} V{' '}
                    {candle.volume}
                    {candle.tradeCount !== null ? ` T ${candle.tradeCount}` : ''}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {candles && candles.outcome !== 'COMPLETED' ? (
          <div className="mt-4" role="status">
            <p className="font-medium text-amber-200">
              {candles.outcome === 'PROVIDER_UNAVAILABLE'
                ? 'Provider Unavailable'
                : candles.outcome === 'NOT_IMPLEMENTED'
                  ? 'Provider unavailable — candlestick retrieval not implemented'
                  : 'Candlestick retrieval failed'}
            </p>
            <p className="mt-2 text-sm text-slate-400">
              Freshness: {formatFreshness(candles.freshness)}
            </p>
            {candles.failureReason ? (
              <p className="mt-2 text-sm text-slate-400">{candles.failureReason}</p>
            ) : null}
          </div>
        ) : null}
      </section>

      <section className="rounded border border-white/10 p-5">
        <h3 className="text-lg font-medium">Order Book</h3>
        <p className="mt-2 text-sm text-slate-400">
          Load the current order book snapshot for the selected symbol and depth. Freshness reflects
          observed exchange timestamps only; missing exchange timestamps remain Unknown.
        </p>
        <label className="mt-4 block text-sm text-slate-300">
          Select Depth
          <select
            className="mt-2 w-full max-w-xs rounded border border-white/10 bg-slate-950 px-3 py-2"
            value={selectedDepth}
            onChange={(event) => onSelectDepth(Number(event.target.value) as MarketOrderBookDepth)}
          >
            {MARKET_DATA_ORDER_BOOK_DEPTHS.map((depth) => (
              <option key={depth} value={depth}>
                {depth}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          className="mt-4 rounded bg-sky-700 px-4 py-2 text-sm font-medium disabled:opacity-50"
          onClick={onRetrieveOrderBook}
          disabled={!selected || !selectedSymbol || retrievingOrderBook || loading}
        >
          {retrievingOrderBook ? 'Loading order book…' : 'Load Order Book'}
        </button>

        {!orderBook ? (
          <p className="mt-4 text-slate-400">
            Select a symbol and depth, then load the order book.
          </p>
        ) : null}

        {orderBook?.outcome === 'COMPLETED' && orderBook.orderBook ? (
          <div className="mt-4 space-y-3 text-sm" data-testid="order-book-panel">
            <p>
              <span className="text-slate-400">Freshness</span>{' '}
              <span className="font-medium" data-testid="order-book-freshness">
                {formatFreshness(orderBook.freshness)}
              </span>
              <span className="ml-3 text-slate-400">Depth {orderBook.depthLimit}</span>
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h4 className="font-medium">Bids</h4>
                <ul className="mt-2 max-h-64 space-y-1 overflow-auto font-mono text-xs">
                  {orderBook.orderBook.bids.map((level) => (
                    <li key={`bid-${level.price}`}>
                      {level.price} × {level.quantity}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="font-medium">Asks</h4>
                <ul className="mt-2 max-h-64 space-y-1 overflow-auto font-mono text-xs">
                  {orderBook.orderBook.asks.map((level) => (
                    <li key={`ask-${level.price}`}>
                      {level.price} × {level.quantity}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ) : null}

        {orderBook && orderBook.outcome !== 'COMPLETED' ? (
          <div className="mt-4" role="status">
            <p className="font-medium text-amber-200">
              {orderBook.outcome === 'PROVIDER_UNAVAILABLE'
                ? 'Provider Unavailable'
                : orderBook.outcome === 'NOT_IMPLEMENTED'
                  ? 'Provider unavailable — order book retrieval not implemented'
                  : 'Order book retrieval failed'}
            </p>
            <p className="mt-2 text-sm text-slate-400">
              Freshness: {formatFreshness(orderBook.freshness)}
            </p>
            {orderBook.failureReason ? (
              <p className="mt-2 text-sm text-slate-400">{orderBook.failureReason}</p>
            ) : null}
          </div>
        ) : null}
      </section>
    </section>
  );
}

function formatFreshness(value: string): string {
  switch (value) {
    case 'FRESH':
      return 'Fresh';
    case 'STALE':
      return 'Stale';
    case 'UNAVAILABLE':
      return 'Unavailable';
    default:
      return 'Unknown';
  }
}
