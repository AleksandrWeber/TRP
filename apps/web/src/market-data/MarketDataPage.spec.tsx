import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type {
  ConnectionMetadataView,
  MarketDataProviderCatalogView,
  MarketSymbolView,
} from '../shared/api';
import { MarketDataView, type MarketDataViewProps } from './MarketDataView';

const providers: MarketDataProviderCatalogView = {
  providers: [
    {
      id: 'BINANCE',
      displayName: 'Binance',
      capabilities: ['SYMBOLS', 'TICKER', 'CANDLES', 'ORDER_BOOK'],
      availability: 'AVAILABLE',
    },
  ],
};

const connection: ConnectionMetadataView = {
  id: 'connection-1',
  workspaceId: 'workspace-a',
  displayName: 'Primary Binance',
  provider: 'BINANCE',
  connectionType: 'EXCHANGE',
  status: 'CONNECTED',
  credentialsStored: true,
  exchangeProvider: null,
  session: null,
  capabilities: null,
  createdAt: '2026-08-26T00:00:00.000Z',
  updatedAt: '2026-08-26T00:00:00.000Z',
};

const symbol: MarketSymbolView = {
  exchangeSymbol: 'BTCUSDT',
  normalizedSymbol: 'BTC-USDT',
  baseAsset: 'BTC',
  quoteAsset: 'USDT',
  tradingStatus: 'TRADING',
  providerId: 'BINANCE',
};

const baseProps: Omit<
  MarketDataViewProps,
  | 'discovery'
  | 'selectedSymbol'
  | 'ticker'
  | 'candles'
  | 'selectedInterval'
  | 'orderBook'
  | 'selectedDepth'
> = {
  providers,
  connections: [connection],
  selectedConnectionId: 'connection-1',
  loading: false,
  discovering: false,
  retrievingTicker: false,
  retrievingCandles: false,
  retrievingOrderBook: false,
  error: null,
  onSelectConnection: () => undefined,
  onDiscover: () => undefined,
  onSelectSymbol: () => undefined,
  onRetrieveTicker: () => undefined,
  onSelectInterval: () => undefined,
  onRetrieveCandles: () => undefined,
  onSelectDepth: () => undefined,
  onRetrieveOrderBook: () => undefined,
};

describe('Market Data UI (W2-S03-e)', () => {
  it('renders depth selector, order book, and freshness without trades or trading', () => {
    const html = renderToStaticMarkup(
      <MarketDataView
        {...baseProps}
        selectedSymbol={symbol}
        selectedInterval="1h"
        selectedDepth={20}
        discovery={{
          connectionId: 'connection-1',
          providerId: 'BINANCE',
          discoveredAt: '2026-08-26T00:00:00.000Z',
          outcome: 'COMPLETED',
          failureReason: null,
          symbols: [symbol],
        }}
        ticker={null}
        candles={null}
        orderBook={{
          connectionId: 'connection-1',
          providerId: 'BINANCE',
          exchangeSymbol: 'BTCUSDT',
          depthLimit: 20,
          freshness: 'UNKNOWN',
          outcome: 'COMPLETED',
          failureReason: null,
          orderBook: {
            normalizedSymbol: 'BTC-USDT',
            depthLimit: 20,
            bids: [{ price: '100.0', quantity: '2.0' }],
            asks: [{ price: '101.0', quantity: '3.0' }],
            exchangeTimestamp: null,
            retrievalTimestamp: '2026-08-26T12:00:00.000Z',
            providerId: 'BINANCE',
            freshness: 'UNKNOWN',
          },
        }}
      />,
    );

    expect(html).toContain('Select Depth');
    expect(html).toContain('Load Order Book');
    expect(html).toContain('100.0');
    expect(html).toContain('Unknown');
    expect(html).not.toContain('Place order');
    expect(html).not.toContain('Balances');
    expect(html).not.toContain('Positions');
    expect(html).not.toContain('Streaming');
  });

  it('shows order book failure and provider unavailable honestly', () => {
    const failed = renderToStaticMarkup(
      <MarketDataView
        {...baseProps}
        selectedSymbol={symbol}
        selectedInterval="1h"
        selectedDepth={20}
        discovery={{
          connectionId: 'connection-1',
          providerId: 'BINANCE',
          discoveredAt: '2026-08-26T00:00:00.000Z',
          outcome: 'COMPLETED',
          failureReason: null,
          symbols: [symbol],
        }}
        ticker={null}
        candles={null}
        orderBook={{
          connectionId: 'connection-1',
          providerId: 'BINANCE',
          exchangeSymbol: 'BTCUSDT',
          depthLimit: 20,
          freshness: 'UNKNOWN',
          outcome: 'FAILED',
          failureReason: 'Malformed provider order book payload',
          orderBook: null,
        }}
      />,
    );
    expect(failed).toContain('Order book retrieval failed');
    expect(failed).toContain('Malformed provider order book payload');
  });
});
