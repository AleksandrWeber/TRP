import { describe, expect, it } from 'vitest';
import {
  DEFAULT_MARKET_CACHE_CANDLES_TTL,
  DEFAULT_MARKET_CACHE_TICKER_TTL,
  resolveMarketDataCacheConfig,
} from './market-data-cache.config';

function resolve(overrides: Partial<Record<'enabled' | 'ticker' | 'candles', string>> = {}) {
  return resolveMarketDataCacheConfig({
    enabled: overrides.enabled,
    tickerTtlSeconds: overrides.ticker,
    candlesTtlSeconds: overrides.candles,
  });
}

describe('resolveMarketDataCacheConfig (US008)', () => {
  it('defaults: enabled with 5s ticker / 60s candles TTLs', () => {
    expect(resolve()).toEqual({
      enabled: true,
      tickerTtlMs: DEFAULT_MARKET_CACHE_TICKER_TTL * 1000,
      candlesTtlMs: DEFAULT_MARKET_CACHE_CANDLES_TTL * 1000,
    });
  });

  it('treats blank values as unset', () => {
    expect(resolve({ enabled: '  ', ticker: '', candles: ' ' })).toMatchObject({
      enabled: true,
      tickerTtlMs: 5000,
      candlesTtlMs: 60_000,
    });
  });

  it('parses MARKET_CACHE_ENABLED in both spellings and cases', () => {
    expect(resolve({ enabled: 'true' }).enabled).toBe(true);
    expect(resolve({ enabled: 'TRUE' }).enabled).toBe(true);
    expect(resolve({ enabled: '1' }).enabled).toBe(true);
    expect(resolve({ enabled: 'false' }).enabled).toBe(false);
    expect(resolve({ enabled: 'False' }).enabled).toBe(false);
    expect(resolve({ enabled: '0' }).enabled).toBe(false);
  });

  it('fails fast on an unparseable MARKET_CACHE_ENABLED', () => {
    expect(() => resolve({ enabled: 'yes' })).toThrow(/Invalid MARKET_CACHE_ENABLED 'yes'/);
  });

  it('parses TTL overrides in seconds', () => {
    expect(resolve({ ticker: '2', candles: '120' })).toMatchObject({
      tickerTtlMs: 2000,
      candlesTtlMs: 120_000,
    });
  });

  it('accepts fractional TTLs', () => {
    expect(resolve({ ticker: '0.5' }).tickerTtlMs).toBe(500);
  });

  it('fails fast on non-numeric or non-positive TTLs', () => {
    expect(() => resolve({ ticker: 'abc' })).toThrow(/Invalid MARKET_CACHE_TICKER_TTL 'abc'/);
    expect(() => resolve({ ticker: '0' })).toThrow(/MARKET_CACHE_TICKER_TTL/);
    expect(() => resolve({ candles: '-1' })).toThrow(/MARKET_CACHE_CANDLES_TTL/);
  });
});
