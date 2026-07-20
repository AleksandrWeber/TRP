import { Injectable } from '@nestjs/common';
import { MarketDataCache, type MarketDataCacheMetrics } from './market-data-cache';

export type NamedCacheMetrics = MarketDataCacheMetrics & Readonly<{ ttlSeconds: number }>;

/**
 * Registry of named MarketDataCache instances (US008).
 * One cache per data kind ('ticker', 'candles') so each kind carries its own
 * TTL and metrics; the registry is the single enumeration point for the
 * /market/cache statistics endpoint.
 */
@Injectable()
export class MarketDataCacheRegistry {
  private readonly caches = new Map<string, MarketDataCache>();

  register(cache: MarketDataCache): void {
    if (this.caches.has(cache.name)) {
      throw new Error(`MarketDataCache already registered: ${cache.name}`);
    }
    this.caches.set(cache.name, cache);
  }

  get(name: string): MarketDataCache {
    const cache = this.caches.get(name);
    if (!cache) {
      throw new Error(`No MarketDataCache registered for name: ${name}`);
    }
    return cache;
  }

  list(): ReadonlyArray<string> {
    return Object.freeze([...this.caches.keys()]);
  }

  metrics(): Readonly<Record<string, NamedCacheMetrics>> {
    const result: Record<string, NamedCacheMetrics> = {};
    for (const [name, cache] of this.caches) {
      result[name] = Object.freeze({
        ...cache.metrics(),
        ttlSeconds: cache.ttlMs / 1000,
      });
    }
    return Object.freeze(result);
  }

  clearAll(): void {
    for (const cache of this.caches.values()) {
      cache.clear();
    }
  }
}
