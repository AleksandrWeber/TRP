import { useEffect, useState } from 'react';
import { useWorkspace } from '../app/WorkspaceContext';
import {
  api,
  type ConnectionMetadataView,
  type MarketDataProviderCatalogView,
  type MarketSymbolDiscoveryView,
  type MarketSymbolView,
  type MarketTickerRetrievalView,
} from '../shared/api';
import { toUserFacingError } from '../shared/mapApiError';
import { MarketDataView } from './MarketDataView';

export function MarketDataPage() {
  const { activeWorkspace } = useWorkspace();
  const [providers, setProviders] = useState<MarketDataProviderCatalogView | null>(null);
  const [connections, setConnections] = useState<ConnectionMetadataView[]>([]);
  const [selectedConnectionId, setSelectedConnectionId] = useState('');
  const [discovery, setDiscovery] = useState<MarketSymbolDiscoveryView | null>(null);
  const [selectedSymbol, setSelectedSymbol] = useState<MarketSymbolView | null>(null);
  const [ticker, setTicker] = useState<MarketTickerRetrievalView | null>(null);
  const [loading, setLoading] = useState(true);
  const [discovering, setDiscovering] = useState(false);
  const [retrievingTicker, setRetrievingTicker] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setDiscovery(null);
    setSelectedSymbol(null);
    setTicker(null);
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

  return (
    <MarketDataView
      providers={providers}
      connections={connections}
      selectedConnectionId={selectedConnectionId}
      discovery={discovery}
      selectedSymbol={selectedSymbol}
      ticker={ticker}
      loading={loading}
      discovering={discovering}
      retrievingTicker={retrievingTicker}
      error={error}
      onSelectConnection={(connectionId) => {
        setSelectedConnectionId(connectionId);
        setDiscovery(null);
        setSelectedSymbol(null);
        setTicker(null);
      }}
      onDiscover={discover}
      onSelectSymbol={(symbol) => {
        setSelectedSymbol(symbol);
        setTicker(null);
      }}
      onRetrieveTicker={retrieveTicker}
    />
  );
}
