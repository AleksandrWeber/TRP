import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createTicker, type Ticker } from '../market-data-domain/domain/ticker';
import { Timeframe } from '../market-data-domain/domain/timeframe';
import type { Candle } from '../market-data-domain/domain/candle';
import { MarketDataCacheRegistry } from './market-data-cache-registry';
import type { MarketDataCacheConfig } from './market-data-cache.config';
import {
  candlesCacheKey,
  MarketDataCacheService,
  tickerCacheKey,
} from './market-data-cache.service';

const CONFIG: MarketDataCacheConfig = Object.freeze({
  enabled: true,
  tickerTtlMs: 5000,
  candlesTtlMs: 60_000,
});

function buildTicker(price: number): Ticker {
  return createTicker({
    symbol: 'BTCUSDT',
    price,
    timestamp: new Date().toISOString(),
  });
}

const CANDLES: Candle[] = [];

describe('cache key format (US008)', () => {
  it('ticker key is ticker:<symbol>', () => {
    expect(tickerCacheKey('BTCUSDT')).toBe('ticker:BTCUSDT');
  });

  it('candles key is candles:<symbol>:<timeframe>:<limit>', () => {
    expect(candlesCacheKey('ETHUSDT', Timeframe.H1, 100)).toBe('candles:ETHUSDT:1h:100');
  });
});

describe('MarketDataCacheService (US008)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('loads through the provider on a miss and serves the hit from the cache', async () => {
    const service = new MarketDataCacheService(CONFIG, new MarketDataCacheRegistry());
    const load = vi.fn(async () => buildTicker(100));

    const first = await service.getTicker('BTCUSDT', load);
    const second = await service.getTicker('BTCUSDT', load);

    expect(load).toHaveBeenCalledTimes(1);
    expect(second).toBe(first);
    expect(service.stats()).toMatchObject({ hits: 1, misses: 1, providerCalls: 1 });
  });

  it('refreshes the ticker after its TTL elapses', async () => {
    const service = new MarketDataCacheService(CONFIG, new MarketDataCacheRegistry());
    let price = 100;
    const load = vi.fn(async () => buildTicker(price));

    const first = await service.getTicker('BTCUSDT', load);
    vi.advanceTimersByTime(5000);
    price = 200;
    const refreshed = await service.getTicker('BTCUSDT', load);

    expect(load).toHaveBeenCalledTimes(2);
    expect(first.price).toBe(100);
    expect(refreshed.price).toBe(200);
  });

  it('keys candles by symbol, timeframe, and limit', async () => {
    const service = new MarketDataCacheService(CONFIG, new MarketDataCacheRegistry());
    const load = vi.fn(async () => CANDLES);

    await service.getCandles('BTCUSDT', Timeframe.H1, 100, load);
    await service.getCandles('BTCUSDT', Timeframe.H1, 100, load);
    await service.getCandles('BTCUSDT', Timeframe.H1, 50, load);
    await service.getCandles('BTCUSDT', Timeframe.M5, 100, load);
    await service.getCandles('ETHUSDT', Timeframe.H1, 100, load);

    expect(load).toHaveBeenCalledTimes(4);
    expect(service.stats()).toMatchObject({ hits: 1, misses: 4, providerCalls: 4 });
  });

  it('applies the candles TTL independently of the ticker TTL', async () => {
    const service = new MarketDataCacheService(CONFIG, new MarketDataCacheRegistry());
    const load = vi.fn(async () => CANDLES);

    await service.getCandles('BTCUSDT', Timeframe.H1, 100, load);
    vi.advanceTimersByTime(59_999);
    await service.getCandles('BTCUSDT', Timeframe.H1, 100, load);
    expect(load).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(1);
    await service.getCandles('BTCUSDT', Timeframe.H1, 100, load);
    expect(load).toHaveBeenCalledTimes(2);
  });

  it('does not cache when the loader throws — the next call retries', async () => {
    const service = new MarketDataCacheService(CONFIG, new MarketDataCacheRegistry());
    const load = vi
      .fn<() => Promise<Ticker>>()
      .mockRejectedValueOnce(new Error('provider down'))
      .mockResolvedValueOnce(buildTicker(100));

    await expect(service.getTicker('BTCUSDT', load)).rejects.toThrow('provider down');
    const recovered = await service.getTicker('BTCUSDT', load);

    expect(recovered.price).toBe(100);
    expect(load).toHaveBeenCalledTimes(2);
    expect(service.stats()).toMatchObject({ misses: 2, providerCalls: 2 });
  });

  it('bypasses the cache entirely when disabled', async () => {
    const service = new MarketDataCacheService(
      { ...CONFIG, enabled: false },
      new MarketDataCacheRegistry(),
    );
    const load = vi.fn(async () => buildTicker(100));

    await service.getTicker('BTCUSDT', load);
    await service.getTicker('BTCUSDT', load);

    expect(load).toHaveBeenCalledTimes(2);
    expect(service.stats()).toMatchObject({
      enabled: false,
      hits: 0,
      misses: 0,
      entries: 0,
      providerCalls: 2,
    });
  });

  it('aggregates stats across the ticker and candles caches', async () => {
    const service = new MarketDataCacheService(CONFIG, new MarketDataCacheRegistry());

    await service.getTicker('BTCUSDT', async () => buildTicker(100));
    await service.getTicker('BTCUSDT', async () => buildTicker(100));
    await service.getCandles('BTCUSDT', Timeframe.H1, 100, async () => CANDLES);

    const stats = service.stats();
    expect(stats).toMatchObject({
      enabled: true,
      hits: 1,
      misses: 2,
      entries: 2,
      providerCalls: 2,
    });
    expect(stats.hitRatio).toBeCloseTo(1 / 3, 4);
    expect(stats.caches.ticker).toMatchObject({ hits: 1, misses: 1, entries: 1, ttlSeconds: 5 });
    expect(stats.caches.candles).toMatchObject({ hits: 0, misses: 1, entries: 1, ttlSeconds: 60 });
    expect(stats.lastRefresh).toBe(new Date().toISOString());
    expect(Number.isFinite(Date.parse(stats.generatedAt))).toBe(true);
  });
});
