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
    {
      id: 'BYBIT',
      displayName: 'Bybit',
      capabilities: ['SYMBOLS', 'TICKER', 'CANDLES', 'ORDER_BOOK'],
      availability: 'AVAILABLE',
    },
    {
      id: 'OKX',
      displayName: 'OKX',
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

const baseProps: Omit<MarketDataViewProps, 'discovery' | 'selectedSymbol' | 'ticker'> = {
  providers,
  connections: [connection],
  selectedConnectionId: 'connection-1',
  loading: false,
  discovering: false,
  retrievingTicker: false,
  error: null,
  onSelectConnection: () => undefined,
  onDiscover: () => undefined,
  onSelectSymbol: () => undefined,
  onRetrieveTicker: () => undefined,
};

describe('Market Data UI (W2-S03-c)', () => {
  it('renders ticker with freshness and without candles or trading controls', () => {
    const html = renderToStaticMarkup(
      <MarketDataView
        {...baseProps}
        selectedSymbol={symbol}
        discovery={{
          connectionId: 'connection-1',
          providerId: 'BINANCE',
          discoveredAt: '2026-08-26T00:00:00.000Z',
          outcome: 'COMPLETED',
          failureReason: null,
          symbols: [symbol],
        }}
        ticker={{
          connectionId: 'connection-1',
          providerId: 'BINANCE',
          exchangeSymbol: 'BTCUSDT',
          freshness: 'FRESH',
          outcome: 'COMPLETED',
          failureReason: null,
          ticker: {
            normalizedSymbol: 'BTC-USDT',
            lastPrice: '65000.12',
            bid: '64999.00',
            ask: '65001.00',
            changePercent24h: '1.25',
            high24h: '66000.00',
            low24h: '64000.00',
            volume24h: '1234.5',
            exchangeTimestamp: '2026-08-26T11:59:55.000Z',
            retrievalTimestamp: '2026-08-26T12:00:00.000Z',
            providerId: 'BINANCE',
            freshness: 'FRESH',
          },
        }}
      />,
    );

    expect(html).toContain('Market Data');
    expect(html).toContain('Select Exchange');
    expect(html).toContain('Select Symbol');
    expect(html).toContain('Load Ticker');
    expect(html).toContain('65000.12');
    expect(html).toContain('Fresh');
    expect(html).not.toContain('Candles');
    expect(html).not.toContain('Order Book');
    expect(html).not.toContain('Place order');
    expect(html).not.toContain('Balances');
    expect(html).not.toContain('Positions');
  });

  it('shows ticker failure and provider unavailable honestly', () => {
    const failed = renderToStaticMarkup(
      <MarketDataView
        {...baseProps}
        selectedSymbol={symbol}
        discovery={{
          connectionId: 'connection-1',
          providerId: 'BINANCE',
          discoveredAt: '2026-08-26T00:00:00.000Z',
          outcome: 'COMPLETED',
          failureReason: null,
          symbols: [symbol],
        }}
        ticker={{
          connectionId: 'connection-1',
          providerId: 'BINANCE',
          exchangeSymbol: 'BTCUSDT',
          freshness: 'UNKNOWN',
          outcome: 'FAILED',
          failureReason: 'Malformed provider ticker payload',
          ticker: null,
        }}
      />,
    );
    expect(failed).toContain('Ticker retrieval failed');
    expect(failed).toContain('Malformed provider ticker payload');
    expect(failed).toContain('Unknown');

    const unavailable = renderToStaticMarkup(
      <MarketDataView
        {...baseProps}
        selectedSymbol={symbol}
        discovery={{
          connectionId: 'connection-1',
          providerId: 'BYBIT',
          discoveredAt: '2026-08-26T00:00:00.000Z',
          outcome: 'COMPLETED',
          failureReason: null,
          symbols: [{ ...symbol, providerId: 'BYBIT' }],
        }}
        ticker={{
          connectionId: 'connection-1',
          providerId: 'BYBIT',
          exchangeSymbol: 'BTCUSDT',
          freshness: 'UNAVAILABLE',
          outcome: 'NOT_IMPLEMENTED',
          failureReason: 'Ticker retrieval is not implemented for this provider',
          ticker: null,
        }}
      />,
    );
    expect(unavailable).toContain('not implemented');
    expect(unavailable).toContain('Unavailable');
  });
});
