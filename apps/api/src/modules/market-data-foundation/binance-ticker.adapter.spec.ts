import { describe, expect, it } from 'vitest';
import { parseBinanceTicker24hr } from './binance-ticker.adapter';

describe('Binance ticker provider mapping (W2-S03-c)', () => {
  it('maps Binance 24hr ticker fields without inventing values', () => {
    const observation = parseBinanceTicker24hr(
      JSON.stringify({
        symbol: 'BTCUSDT',
        lastPrice: '65000.12',
        bidPrice: '64999.00',
        askPrice: '65001.00',
        priceChangePercent: '1.25',
        highPrice: '66000.00',
        lowPrice: '64000.00',
        volume: '1234.5',
        closeTime: 1_724_668_800_000,
      }),
      'BTCUSDT',
    );
    expect(observation).toEqual({
      exchangeSymbol: 'BTCUSDT',
      lastPrice: '65000.12',
      bid: '64999.00',
      ask: '65001.00',
      changePercent24h: '1.25',
      high24h: '66000.00',
      low24h: '64000.00',
      volume24h: '1234.5',
      exchangeTimestampMs: 1_724_668_800_000,
    });
  });

  it('rejects malformed or mismatched Binance payloads', () => {
    expect(parseBinanceTicker24hr('{', 'BTCUSDT')).toBeNull();
    expect(
      parseBinanceTicker24hr(
        JSON.stringify({
          symbol: 'ETHUSDT',
          lastPrice: '1',
          bidPrice: '1',
          askPrice: '1',
          priceChangePercent: '0',
          highPrice: '1',
          lowPrice: '1',
          volume: '1',
          closeTime: 1,
        }),
        'BTCUSDT',
      ),
    ).toBeNull();
    expect(
      parseBinanceTicker24hr(
        JSON.stringify({
          symbol: 'BTCUSDT',
          lastPrice: '1',
          bidPrice: '1',
          askPrice: '1',
          priceChangePercent: '0',
          highPrice: '1',
          lowPrice: '1',
          volume: '1',
        }),
        'BTCUSDT',
      ),
    ).toBeNull();
  });
});
