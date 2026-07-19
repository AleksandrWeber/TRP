import { describe, expect, it } from 'vitest';
import { Timeframe } from '../domain/timeframe';
import { MOCK_SERIES_ANCHOR_ISO, MockMarketDataProvider } from './mock-market-data-provider';

describe('MockMarketDataProvider (US006)', () => {
  const provider = new MockMarketDataProvider();

  it('returns identical tickers for identical requests', async () => {
    const first = await provider.getTicker('BTCUSDT');
    const second = await provider.getTicker('BTCUSDT');
    const fresh = await new MockMarketDataProvider().getTicker('BTCUSDT');

    expect(second).toEqual(first);
    expect(fresh).toEqual(first);
    expect(first.symbol).toBe('BTCUSDT');
    expect(first.price).toBeGreaterThan(0);
    expect(first.timestamp).toBe(MOCK_SERIES_ANCHOR_ISO);
  });

  it('differentiates symbols deterministically', async () => {
    const btc = await provider.getTicker('BTCUSDT');
    const eth = await provider.getTicker('ETHUSDT');
    expect(btc.price).not.toBe(eth.price);
  });

  it('returns identical candle series for identical requests', async () => {
    const first = await provider.getCandles('BTCUSDT', Timeframe.H1, 5);
    const second = await provider.getCandles('BTCUSDT', Timeframe.H1, 5);
    expect(second).toEqual(first);
    expect(first).toHaveLength(5);
  });

  it('produces contiguous buckets ending at the fixed anchor', async () => {
    const candles = await provider.getCandles('BTCUSDT', Timeframe.H1, 3);

    expect(candles[2].closeTime).toBe(MOCK_SERIES_ANCHOR_ISO);
    for (let i = 1; i < candles.length; i += 1) {
      expect(candles[i].openTime).toBe(candles[i - 1].closeTime);
    }
    for (const candle of candles) {
      expect(Date.parse(candle.closeTime) - Date.parse(candle.openTime)).toBe(3_600_000);
    }
  });

  it('respects OHLC invariants across timeframes', async () => {
    for (const timeframe of Object.values(Timeframe)) {
      const candles = await provider.getCandles('ETHUSDT', timeframe, 10);
      expect(candles).toHaveLength(10);
      for (const candle of candles) {
        expect(candle.high).toBeGreaterThanOrEqual(Math.max(candle.open, candle.close));
        expect(candle.low).toBeLessThanOrEqual(Math.min(candle.open, candle.close));
        expect(candle.volume).toBeGreaterThanOrEqual(0);
        expect(candle.timeframe).toBe(timeframe);
      }
    }
  });

  it('rejects a non-positive or fractional limit', async () => {
    await expect(provider.getCandles('BTCUSDT', Timeframe.H1, 0)).rejects.toThrow(/limit/);
    await expect(provider.getCandles('BTCUSDT', Timeframe.H1, 1.5)).rejects.toThrow(/limit/);
  });

  it('rejects an invalid symbol via the domain factory', async () => {
    await expect(provider.getTicker('btc/usdt')).rejects.toThrow(/symbol/);
  });

  it('reports healthy status', async () => {
    await expect(provider.health()).resolves.toMatchObject({
      providerId: 'mock',
      status: 'ok',
    });
  });
});
