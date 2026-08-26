import { describe, expect, it } from 'vitest';
import { normalizeProviderCandle } from './market-candle.normalize';

describe('Market candle normalization (W2-S03-d)', () => {
  const retrievalTimestamp = '2026-08-26T12:00:00.000Z';

  it('normalizes a valid OHLCV observation deterministically', () => {
    const candle = normalizeProviderCandle({
      providerId: 'BINANCE',
      normalizedSymbol: 'btc-usdt',
      interval: '1h',
      retrievalTimestamp,
      observation: {
        openTimeMs: Date.parse('2026-08-26T10:00:00.000Z'),
        closeTimeMs: Date.parse('2026-08-26T10:59:59.999Z'),
        open: '100',
        high: '110',
        low: '90',
        close: '105',
        volume: '12.5',
        tradeCount: 42,
      },
    });
    expect(candle).toMatchObject({
      normalizedSymbol: 'BTC-USDT',
      interval: '1h',
      open: '100',
      high: '110',
      low: '90',
      close: '105',
      volume: '12.5',
      tradeCount: 42,
      providerId: 'BINANCE',
    });
  });

  it('rejects invalid OHLC and negative volume without guessing', () => {
    expect(
      normalizeProviderCandle({
        providerId: 'BINANCE',
        normalizedSymbol: 'BTC-USDT',
        interval: '1h',
        retrievalTimestamp,
        observation: {
          openTimeMs: 1,
          closeTimeMs: 2,
          open: '100',
          high: '90',
          low: '95',
          close: '105',
          volume: '1',
          tradeCount: 1,
        },
      }),
    ).toBeNull();

    expect(
      normalizeProviderCandle({
        providerId: 'BINANCE',
        normalizedSymbol: 'BTC-USDT',
        interval: '1h',
        retrievalTimestamp,
        observation: {
          openTimeMs: 1,
          closeTimeMs: 2,
          open: '100',
          high: '110',
          low: '90',
          close: '105',
          volume: '-1',
          tradeCount: 1,
        },
      }),
    ).toBeNull();
  });
});
