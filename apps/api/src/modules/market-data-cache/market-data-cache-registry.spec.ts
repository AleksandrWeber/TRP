import { describe, expect, it } from 'vitest';
import { MarketDataCache } from './market-data-cache';
import { MarketDataCacheRegistry } from './market-data-cache-registry';

describe('MarketDataCacheRegistry (US008)', () => {
  it('registers caches and lists them in registration order', () => {
    const registry = new MarketDataCacheRegistry();
    registry.register(new MarketDataCache('ticker', 5000));
    registry.register(new MarketDataCache('candles', 60_000));
    expect(registry.list()).toEqual(['ticker', 'candles']);
  });

  it('rejects duplicate cache names', () => {
    const registry = new MarketDataCacheRegistry();
    registry.register(new MarketDataCache('ticker', 5000));
    expect(() => registry.register(new MarketDataCache('ticker', 1000))).toThrow(
      /already registered: ticker/,
    );
  });

  it('resolves a cache by name and fails on unknown names', () => {
    const registry = new MarketDataCacheRegistry();
    const cache = new MarketDataCache('ticker', 5000);
    registry.register(cache);
    expect(registry.get('ticker')).toBe(cache);
    expect(() => registry.get('nope')).toThrow(/No MarketDataCache registered for name: nope/);
  });

  it('aggregates per-cache metrics with the TTL in seconds', () => {
    const registry = new MarketDataCacheRegistry();
    const ticker = new MarketDataCache<string>('ticker', 5000);
    registry.register(ticker as MarketDataCache);
    ticker.set('k', 'v');
    ticker.get('k');

    const metrics = registry.metrics();
    expect(metrics.ticker).toMatchObject({
      hits: 1,
      misses: 0,
      entries: 1,
      hitRatio: 1,
      ttlSeconds: 5,
    });
  });

  it('clearAll empties every registered cache', () => {
    const registry = new MarketDataCacheRegistry();
    const ticker = new MarketDataCache<string>('ticker', 5000);
    const candles = new MarketDataCache<string>('candles', 60_000);
    registry.register(ticker as MarketDataCache);
    registry.register(candles as MarketDataCache);
    ticker.set('a', '1');
    candles.set('b', '2');

    registry.clearAll();
    expect(registry.metrics().ticker.entries).toBe(0);
    expect(registry.metrics().candles.entries).toBe(0);
  });
});
