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

const baseProps: Omit<
  MarketDataViewProps,
  'discovery' | 'selectedSymbol' | 'ticker' | 'candles' | 'selectedInterval'
> = {
  providers,
  connections: [connection],
  selectedConnectionId: 'connection-1',
  loading: false,
  discovering: false,
  retrievingTicker: false,
  retrievingCandles: false,
  error: null,
  onSelectConnection: () => undefined,
  onDiscover: () => undefined,
  onSelectSymbol: () => undefined,
  onRetrieveTicker: () => undefined,
  onSelectInterval: () => undefined,
  onRetrieveCandles: () => undefined,
};

describe('Market Data UI (W2-S03-d)', () => {
  it('renders interval selector, candles, and freshness without order book or trading', () => {
    const html = renderToStaticMarkup(
      <MarketDataView
        {...baseProps}
        selectedSymbol={symbol}
        selectedInterval="1h"
        discovery={{
          connectionId: 'connection-1',
          providerId: 'BINANCE',
          discoveredAt: '2026-08-26T00:00:00.000Z',
          outcome: 'COMPLETED',
          failureReason: null,
          symbols: [symbol],
        }}
        ticker={null}
        candles={{
          connectionId: 'connection-1',
          providerId: 'BINANCE',
          exchangeSymbol: 'BTCUSDT',
          interval: '1h',
          rangeStart: '2026-08-26T00:00:00.000Z',
          rangeEnd: '2026-08-26T12:00:00.000Z',
          freshness: 'STALE',
          outcome: 'COMPLETED',
          failureReason: null,
          candles: [
            {
              normalizedSymbol: 'BTC-USDT',
              interval: '1h',
              openTime: '2026-08-26T10:00:00.000Z',
              closeTime: '2026-08-26T10:59:59.999Z',
              open: '100',
              high: '110',
              low: '90',
              close: '105',
              volume: '12.5',
              tradeCount: 42,
              exchangeTimestamp: '2026-08-26T10:59:59.999Z',
              retrievalTimestamp: '2026-08-26T12:00:00.000Z',
              providerId: 'BINANCE',
            },
          ],
        }}
      />,
    );

    expect(html).toContain('Select Interval');
    expect(html).toContain('Load Candles');
    expect(html).toContain('105');
    expect(html).toContain('Stale');
    expect(html).not.toContain('Order Book');
    expect(html).not.toContain('Place order');
    expect(html).not.toContain('Balances');
    expect(html).not.toContain('Positions');
  });

  it('shows candlestick failure and provider unavailable honestly', () => {
    const failed = renderToStaticMarkup(
      <MarketDataView
        {...baseProps}
        selectedSymbol={symbol}
        selectedInterval="1h"
        discovery={{
          connectionId: 'connection-1',
          providerId: 'BINANCE',
          discoveredAt: '2026-08-26T00:00:00.000Z',
          outcome: 'COMPLETED',
          failureReason: null,
          symbols: [symbol],
        }}
        ticker={null}
        candles={{
          connectionId: 'connection-1',
          providerId: 'BINANCE',
          exchangeSymbol: 'BTCUSDT',
          interval: '1h',
          rangeStart: '2026-08-26T00:00:00.000Z',
          rangeEnd: '2026-08-26T12:00:00.000Z',
          freshness: 'UNKNOWN',
          outcome: 'FAILED',
          failureReason: 'Malformed provider candlestick payload',
          candles: [],
        }}
      />,
    );
    expect(failed).toContain('Candlestick retrieval failed');
    expect(failed).toContain('Malformed provider candlestick payload');

    const unavailable = renderToStaticMarkup(
      <MarketDataView
        {...baseProps}
        selectedSymbol={symbol}
        selectedInterval="1h"
        discovery={{
          connectionId: 'connection-1',
          providerId: 'BYBIT',
          discoveredAt: '2026-08-26T00:00:00.000Z',
          outcome: 'COMPLETED',
          failureReason: null,
          symbols: [{ ...symbol, providerId: 'BYBIT' }],
        }}
        ticker={null}
        candles={{
          connectionId: 'connection-1',
          providerId: 'BYBIT',
          exchangeSymbol: 'BTCUSDT',
          interval: '1h',
          rangeStart: '2026-08-26T00:00:00.000Z',
          rangeEnd: '2026-08-26T12:00:00.000Z',
          freshness: 'UNAVAILABLE',
          outcome: 'NOT_IMPLEMENTED',
          failureReason: 'Candlestick retrieval is not implemented for this provider',
          candles: [],
        }}
      />,
    );
    expect(unavailable).toContain('not implemented');
    expect(unavailable).toContain('Unavailable');
  });
});
