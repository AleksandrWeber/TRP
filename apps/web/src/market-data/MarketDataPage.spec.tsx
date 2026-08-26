import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { ConnectionMetadataView, MarketDataProviderCatalogView } from '../shared/api';
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

const baseProps: Omit<MarketDataViewProps, 'discovery'> = {
  providers,
  connections: [connection],
  selectedConnectionId: 'connection-1',
  loading: false,
  discovering: false,
  error: null,
  onSelectConnection: () => undefined,
  onDiscover: () => undefined,
};

describe('Market Data UI (W2-S03-b)', () => {
  it('renders exchange selection and symbol list without ticker or trading controls', () => {
    const html = renderToStaticMarkup(
      <MarketDataView
        {...baseProps}
        discovery={{
          connectionId: 'connection-1',
          providerId: 'BINANCE',
          discoveredAt: '2026-08-26T00:00:00.000Z',
          outcome: 'COMPLETED',
          failureReason: null,
          symbols: [
            {
              exchangeSymbol: 'BTCUSDT',
              normalizedSymbol: 'BTC-USDT',
              baseAsset: 'BTC',
              quoteAsset: 'USDT',
              tradingStatus: 'TRADING',
              providerId: 'BINANCE',
            },
          ],
        }}
      />,
    );

    expect(html).toContain('Market Data');
    expect(html).toContain('Select Exchange');
    expect(html).toContain('Binance');
    expect(html).toContain('Load Symbols');
    expect(html).toContain('BTC-USDT');
    expect(html).toContain('Normalized symbols');
    expect(html).not.toContain('Ticker');
    expect(html).not.toContain('Candles');
    expect(html).not.toContain('Order Book');
    expect(html).not.toContain('Place order');
    expect(html).not.toContain('Balances');
    expect(html).not.toContain('Positions');
  });

  it('shows discovery failure and provider unavailable honestly', () => {
    const failed = renderToStaticMarkup(
      <MarketDataView
        {...baseProps}
        discovery={{
          connectionId: 'connection-1',
          providerId: 'BINANCE',
          discoveredAt: '2026-08-26T00:00:00.000Z',
          outcome: 'FAILED',
          failureReason: 'Malformed provider symbol payload',
          symbols: [],
        }}
      />,
    );
    expect(failed).toContain('Symbol discovery failed');
    expect(failed).toContain('Malformed provider symbol payload');

    const unavailable = renderToStaticMarkup(
      <MarketDataView
        {...baseProps}
        discovery={{
          connectionId: 'connection-1',
          providerId: 'BYBIT',
          discoveredAt: '2026-08-26T00:00:00.000Z',
          outcome: 'NOT_IMPLEMENTED',
          failureReason: 'Symbol discovery is not implemented for this provider',
          symbols: [],
        }}
      />,
    );
    expect(unavailable).toContain('not implemented');
  });
});
