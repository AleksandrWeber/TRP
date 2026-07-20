import { describe, expect, it } from 'vitest';
import { createCandle } from './candle';
import { createTicker } from './ticker';
import { Timeframe, isTimeframe, timeframeToMillis } from './timeframe';

const validCandle = {
  symbol: 'BTCUSDT',
  timeframe: Timeframe.H1,
  openTime: '2026-01-01T00:00:00.000Z',
  closeTime: '2026-01-01T01:00:00.000Z',
  open: 100,
  high: 110,
  low: 95,
  close: 105,
  volume: 1000,
};

describe('Market Data Domain models (US006)', () => {
  it('creates a frozen valid candle', () => {
    const candle = createCandle(validCandle);
    expect(candle).toEqual(validCandle);
    expect(Object.isFrozen(candle)).toBe(true);
  });

  it('rejects OHLC invariant violations', () => {
    expect(() => createCandle({ ...validCandle, high: 104 })).toThrow(/high/);
    expect(() => createCandle({ ...validCandle, low: 101 })).toThrow(/low/);
    expect(() => createCandle({ ...validCandle, open: -1 })).toThrow(/open/);
    expect(() => createCandle({ ...validCandle, volume: -1 })).toThrow(/volume/);
  });

  it('rejects invalid symbol and time window', () => {
    expect(() => createCandle({ ...validCandle, symbol: 'btc/usdt' })).toThrow(/symbol/);
    expect(() => createCandle({ ...validCandle, openTime: 'not-a-date' })).toThrow(/ISO-8601/);
    expect(() => createCandle({ ...validCandle, closeTime: validCandle.openTime })).toThrow(
      /before closeTime/,
    );
  });

  it('creates a valid ticker and rejects invalid ones', () => {
    const ticker = createTicker({
      symbol: 'BTCUSDT',
      price: 42_000,
      timestamp: '2026-01-01T00:00:00.000Z',
    });
    expect(Object.isFrozen(ticker)).toBe(true);

    expect(() =>
      createTicker({ symbol: 'BTCUSDT', price: 0, timestamp: ticker.timestamp }),
    ).toThrow(/price/);
    expect(() => createTicker({ symbol: 'BTCUSDT', price: 1, timestamp: 'nope' })).toThrow(
      /timestamp/,
    );
  });

  it('exposes the six supported timeframes with bucket durations', () => {
    expect(Object.values(Timeframe)).toEqual(['1m', '5m', '15m', '1h', '4h', '1d']);
    expect(isTimeframe('15m')).toBe(true);
    expect(isTimeframe('30m')).toBe(false);
    expect(timeframeToMillis(Timeframe.M1)).toBe(60_000);
    expect(timeframeToMillis(Timeframe.D1)).toBe(86_400_000);
  });
});
