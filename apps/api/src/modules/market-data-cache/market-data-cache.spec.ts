import { describe, expect, it } from 'vitest';
import { MarketDataCache, roundRatio } from './market-data-cache';

function buildClock(startMs = 0): { now: () => number; advance: (ms: number) => void } {
  let currentMs = startMs;
  return {
    now: () => currentMs,
    advance: (ms: number) => {
      currentMs += ms;
    },
  };
}

describe('MarketDataCache (US008)', () => {
  it('rejects an empty name and a non-positive TTL', () => {
    expect(() => new MarketDataCache('', 1000)).toThrow(/name must not be empty/);
    expect(() => new MarketDataCache('ticker', 0)).toThrow(/ttlMs/);
    expect(() => new MarketDataCache('ticker', -5)).toThrow(/ttlMs/);
    expect(() => new MarketDataCache('ticker', Number.NaN)).toThrow(/ttlMs/);
  });

  it('misses on an unknown key and hits after a store', () => {
    const clock = buildClock();
    const cache = new MarketDataCache<string>('ticker', 5000, clock.now);

    expect(cache.get('ticker:BTCUSDT')).toBeUndefined();
    cache.set('ticker:BTCUSDT', 'value');
    expect(cache.get('ticker:BTCUSDT')).toBe('value');
    expect(cache.metrics()).toMatchObject({ hits: 1, misses: 1, entries: 1 });
  });

  it('serves the value until the TTL elapses, then misses and evicts', () => {
    const clock = buildClock();
    const cache = new MarketDataCache<string>('ticker', 5000, clock.now);
    cache.set('k', 'v');

    clock.advance(4999);
    expect(cache.get('k')).toBe('v');

    clock.advance(1); // exactly at expiry — expired
    expect(cache.get('k')).toBeUndefined();
    expect(cache.metrics()).toMatchObject({ hits: 1, misses: 1, entries: 0 });
  });

  it('refreshes the expiry when a key is re-stored', () => {
    const clock = buildClock();
    const cache = new MarketDataCache<string>('ticker', 5000, clock.now);
    cache.set('k', 'v1');
    clock.advance(4000);
    cache.set('k', 'v2');
    clock.advance(4000); // 8000 since first store, 4000 since refresh
    expect(cache.get('k')).toBe('v2');
  });

  it('tracks lastRefresh as the time of the most recent store', () => {
    const clock = buildClock(1_000_000);
    const cache = new MarketDataCache<string>('ticker', 5000, clock.now);
    expect(cache.metrics().lastRefresh).toBeNull();

    cache.set('a', '1');
    expect(cache.metrics().lastRefresh).toBe(new Date(1_000_000).toISOString());

    clock.advance(2000);
    cache.set('b', '2');
    expect(cache.metrics().lastRefresh).toBe(new Date(1_002_000).toISOString());
  });

  it('computes the hit ratio from hits and misses', () => {
    const clock = buildClock();
    const cache = new MarketDataCache<string>('ticker', 5000, clock.now);
    expect(cache.metrics().hitRatio).toBe(0);

    cache.get('missing'); // miss
    cache.set('k', 'v');
    cache.get('k'); // hit
    cache.get('k'); // hit
    expect(cache.metrics()).toMatchObject({ hits: 2, misses: 1, hitRatio: roundRatio(2 / 3) });
  });

  it('purges expired entries from the entry count', () => {
    const clock = buildClock();
    const cache = new MarketDataCache<string>('candles', 1000, clock.now);
    cache.set('a', '1');
    cache.set('b', '2');
    expect(cache.entryCount()).toBe(2);

    clock.advance(1000);
    expect(cache.entryCount()).toBe(0);
  });

  it('clear removes all entries but keeps counters', () => {
    const clock = buildClock();
    const cache = new MarketDataCache<string>('ticker', 5000, clock.now);
    cache.set('k', 'v');
    cache.get('k');
    cache.clear();
    expect(cache.metrics()).toMatchObject({ hits: 1, misses: 0, entries: 0 });
  });
});
