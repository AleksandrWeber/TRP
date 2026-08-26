import { useEffect, useState } from 'react';
import { useWorkspace } from '../app/WorkspaceContext';
import {
  api,
  type ConnectionMetadataView,
  type MarketCandleInterval,
  type MarketCandleRetrievalView,
  type MarketDataProviderCatalogView,
  type MarketOrderBookDepth,
  type MarketOrderBookRetrievalView,
  type MarketSymbolDiscoveryView,
  type MarketSymbolView,
  type MarketTickerRetrievalView,
} from '../shared/api';
import { toUserFacingError } from '../shared/mapApiError';
import { MarketDataView } from './MarketDataView';

function defaultCandleRange(interval: MarketCandleInterval): {
  rangeStart: string;
  rangeEnd: string;
} {
  const endMs = Date.now();
  const spanMs =
    interval === '1m'
      ? 2 * 60 * 60 * 1000
      : interval === '5m'
        ? 6 * 60 * 60 * 1000
        : interval === '15m'
          ? 12 * 60 * 60 * 1000
          : interval === '1h'
            ? 2 * 24 * 60 * 60 * 1000
            : interval === '4h'
              ? 7 * 24 * 60 * 60 * 1000
              : 30 * 24 * 60 * 60 * 1000;
  return {
    rangeStart: new Date(endMs - spanMs).toISOString(),
    rangeEnd: new Date(endMs).toISOString(),
  };
}

export function MarketDataPage() {
  const { activeWorkspace } = useWorkspace();
  const [providers, setProviders] = useState<MarketDataProviderCatalogView | null>(null);
  const [connections, setConnections] = useState<ConnectionMetadataView[]>([]);
  const [selectedConnectionId, setSelectedConnectionId] = useState('');
  const [discovery, setDiscovery] = useState<MarketSymbolDiscoveryView | null>(null);
  const [selectedSymbol, setSelectedSymbol] = useState<MarketSymbolView | null>(null);
  const [ticker, setTicker] = useState<MarketTickerRetrievalView | null>(null);
  const [selectedInterval, setSelectedInterval] = useState<MarketCandleInterval>('1h');
  const [candles, setCandles] = useState<MarketCandleRetrievalView | null>(null);
  const [selectedDepth, setSelectedDepth] = useState<MarketOrderBookDepth>(20);
  const [orderBook, setOrderBook] = useState<MarketOrderBookRetrievalView | null>(null);
  const [loading, setLoading] = useState(true);
  const [discovering, setDiscovering] = useState(false);
  const [retrievingTicker, setRetrievingTicker] = useState(false);
  const [retrievingCandles, setRetrievingCandles] = useState(false);
  const [retrievingOrderBook, setRetrievingOrderBook] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setDiscovery(null);
    setSelectedSymbol(null);
    setTicker(null);
    setCandles(null);
    setOrderBook(null);
    Promise.all([api.getMarketDataProviders(), api.listConnections()])
      .then(([providerCatalog, connectionViews]) => {
        if (cancelled) return;
        setProviders(providerCatalog);
        setConnections(connectionViews);
        const firstExchange = connectionViews.find((item) => item.connectionType === 'EXCHANGE');
        setSelectedConnectionId(firstExchange?.id ?? '');
      })
      .catch((reason: unknown) => {
        if (!cancelled) setError(toUserFacingError(reason, 'Could not load Market Data.'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activeWorkspace.id]);

  async function discover() {
    if (!selectedConnectionId) return;
    setDiscovering(true);
    setError(null);
    setSelectedSymbol(null);
    setTicker(null);
    setCandles(null);
    setOrderBook(null);
    try {
      const view = await api.discoverMarketDataSymbols(selectedConnectionId);
      setDiscovery(view);
    } catch (reason) {
      setDiscovery(null);
      setError(toUserFacingError(reason, 'Symbol discovery could not be completed.'));
    } finally {
      setDiscovering(false);
    }
  }

  async function retrieveTicker() {
    if (!selectedConnectionId || !selectedSymbol) return;
    setRetrievingTicker(true);
    setError(null);
    try {
      const view = await api.retrieveMarketDataTicker(selectedConnectionId, {
        exchangeSymbol: selectedSymbol.exchangeSymbol,
        normalizedSymbol: selectedSymbol.normalizedSymbol,
      });
      setTicker(view);
    } catch (reason) {
      setTicker(null);
      setError(toUserFacingError(reason, 'Ticker retrieval could not be completed.'));
    } finally {
      setRetrievingTicker(false);
    }
  }

  async function retrieveCandles() {
    if (!selectedConnectionId || !selectedSymbol) return;
    setRetrievingCandles(true);
    setError(null);
    try {
      const range = defaultCandleRange(selectedInterval);
      const view = await api.retrieveMarketDataCandles(selectedConnectionId, {
        exchangeSymbol: selectedSymbol.exchangeSymbol,
        normalizedSymbol: selectedSymbol.normalizedSymbol,
        interval: selectedInterval,
        rangeStart: range.rangeStart,
        rangeEnd: range.rangeEnd,
      });
      setCandles(view);
    } catch (reason) {
      setCandles(null);
      setError(toUserFacingError(reason, 'Candlestick retrieval could not be completed.'));
    } finally {
      setRetrievingCandles(false);
    }
  }

  async function retrieveOrderBook() {
    if (!selectedConnectionId || !selectedSymbol) return;
    setRetrievingOrderBook(true);
    setError(null);
    try {
      const view = await api.retrieveMarketDataOrderBook(selectedConnectionId, {
        exchangeSymbol: selectedSymbol.exchangeSymbol,
        normalizedSymbol: selectedSymbol.normalizedSymbol,
        depthLimit: selectedDepth,
      });
      setOrderBook(view);
    } catch (reason) {
      setOrderBook(null);
      setError(toUserFacingError(reason, 'Order book retrieval could not be completed.'));
    } finally {
      setRetrievingOrderBook(false);
    }
  }

  return (
    <MarketDataView
      providers={providers}
      connections={connections}
      selectedConnectionId={selectedConnectionId}
      discovery={discovery}
      selectedSymbol={selectedSymbol}
      ticker={ticker}
      selectedInterval={selectedInterval}
      candles={candles}
      selectedDepth={selectedDepth}
      orderBook={orderBook}
      loading={loading}
      discovering={discovering}
      retrievingTicker={retrievingTicker}
      retrievingCandles={retrievingCandles}
      retrievingOrderBook={retrievingOrderBook}
      error={error}
      onSelectConnection={(connectionId) => {
        setSelectedConnectionId(connectionId);
        setDiscovery(null);
        setSelectedSymbol(null);
        setTicker(null);
        setCandles(null);
        setOrderBook(null);
      }}
      onDiscover={discover}
      onSelectSymbol={(symbol) => {
        setSelectedSymbol(symbol);
        setTicker(null);
        setCandles(null);
        setOrderBook(null);
      }}
      onRetrieveTicker={retrieveTicker}
      onSelectInterval={(interval) => {
        setSelectedInterval(interval);
        setCandles(null);
      }}
      onRetrieveCandles={retrieveCandles}
      onSelectDepth={(depth) => {
        setSelectedDepth(depth);
        setOrderBook(null);
      }}
      onRetrieveOrderBook={retrieveOrderBook}
    />
  );
}
