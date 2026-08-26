import { describe, expect, it } from 'vitest';
import { parseBinanceKlines } from './binance-candle.adapter';

describe('Binance candle provider mapping (W2-S03-d)', () => {
  it('maps Binance kline rows without inventing values', () => {
    const observations = parseBinanceKlines(
      JSON.stringify([
        [
          1_724_668_800_000,
          '100.0',
          '110.0',
          '90.0',
          '105.0',
          '12.5',
          1_724_672_399_999,
          '1300.0',
          42,
          '5.0',
          '500.0',
          '0',
        ],
      ]),
    );
    expect(observations).toEqual([
      {
        openTimeMs: 1_724_668_800_000,
        closeTimeMs: 1_724_672_399_999,
        open: '100.0',
        high: '110.0',
        low: '90.0',
        close: '105.0',
        volume: '12.5',
        tradeCount: 42,
      },
    ]);
  });

  it('rejects malformed Binance kline payloads', () => {
    expect(parseBinanceKlines('{')).toBeNull();
    expect(parseBinanceKlines(JSON.stringify([{ not: 'an-array' }]))).toBeNull();
    expect(parseBinanceKlines(JSON.stringify([[1, '1', '2']]))).toBeNull();
  });
});
