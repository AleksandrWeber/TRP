import { describe, expect, it } from 'vitest';
import { normalizeProviderTicker } from './market-ticker.normalize';

describe('Market ticker normalization (W2-S03-c)', () => {
  const retrievalTimestamp = '2026-08-26T12:00:00.000Z';

  it('normalizes a valid provider observation deterministically', () => {
    const ticker = normalizeProviderTicker({
      providerId: 'BINANCE',
      normalizedSymbol: 'btc-usdt',
      retrievalTimestamp,
      observation: {
        exchangeSymbol: 'btcusdt',
        lastPrice: '65000.12',
        bid: '64999.00',
        ask: '65001.00',
        changePercent24h: '1.25',
        high24h: '66000.00',
        low24h: '64000.00',
        volume24h: '1234.5',
        exchangeTimestampMs: Date.parse(retrievalTimestamp) - 5_000,
      },
    });
    expect(ticker).toEqual({
      normalizedSymbol: 'BTC-USDT',
      lastPrice: '65000.12',
      bid: '64999.00',
      ask: '65001.00',
      changePercent24h: '1.25',
      high24h: '66000.00',
      low24h: '64000.00',
      volume24h: '1234.5',
      exchangeTimestamp: '2026-08-26T11:59:55.000Z',
      retrievalTimestamp,
      providerId: 'BINANCE',
      freshness: 'FRESH',
    });
  });

  it('does not guess unknown or invalid fields', () => {
    expect(
      normalizeProviderTicker({
        providerId: 'BINANCE',
        normalizedSymbol: 'BTC-USDT',
        retrievalTimestamp,
        observation: {
          exchangeSymbol: 'BTCUSDT',
          lastPrice: 'not-a-price',
          bid: '1',
          ask: '2',
          changePercent24h: '0',
          high24h: '3',
          low24h: '0.5',
          volume24h: '10',
          exchangeTimestampMs: Date.parse(retrievalTimestamp),
        },
      }),
    ).toBeNull();
  });
});
