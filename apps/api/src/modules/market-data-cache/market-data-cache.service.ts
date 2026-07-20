import { Inject, Injectable } from '@nestjs/common';
import type { Candle } from '../market-data-domain/domain/candle';
import type { Ticker } from '../market-data-domain/domain/ticker';
import type { Timeframe } from '../market-data-domain/domain/timeframe';
import { MarketDataCache, roundRatio } from './market-data-cache';
import { MarketDataCacheRegistry, type NamedCacheMetrics } from './market-data-cache-registry';
import { MARKET_DATA_CACHE_CONFIG, type MarketDataCacheConfig } from './market-data-cache.config';

export const TICKER_CACHE_NAME = 'ticker';
export const CANDLES_CACHE_NAME = 'candles';

export function tickerCacheKey(symbol: string): string {
  return `ticker:${symbol}`;
}

export function candlesCacheKey(symbol: string, timeframe: Timeframe, limit: number): string {
  return `candles:${symbol}:${timeframe}:${limit}`;
}

export type MarketCacheStatsView = Readonly<{
  enabled: boolean;
  hits: number;
  misses: number;
  entries: number;
  hitRatio: number;
  lastRefresh: string | null;
  providerCalls: number;
  caches: Readonly<Record<string, NamedCacheMetrics>>;
  generatedAt: string;
}>;

/**
 * Read-through cache between the market controller and the active provider
 * (US008). On a hit the cached object is returned; on a miss (or when the
 * cache is disabled) the caller-supplied loader — the only path to the
 * provider — is invoked, counted as a provider call, and its result stored.
 *
 * The service never references a provider implementation or the provider
 * registry, so the cache module stays independent and provider changes can
 * never leak into caching behavior.
 */
@Injectable()
export class MarketDataCacheService {
  private readonly tickerCache: MarketDataCache<Ticker>;
  private readonly candlesCache: MarketDataCache<Candle[]>;
  private providerCalls = 0;

  constructor(
    @Inject(MARKET_DATA_CACHE_CONFIG) private readonly config: MarketDataCacheConfig,
    // Explicit token — vitest (esbuild) emits no design:paramtypes metadata.
    @Inject(MarketDataCacheRegistry) private readonly cacheRegistry: MarketDataCacheRegistry,
  ) {
    this.tickerCache = new MarketDataCache<Ticker>(TICKER_CACHE_NAME, config.tickerTtlMs);
    this.candlesCache = new MarketDataCache<Candle[]>(CANDLES_CACHE_NAME, config.candlesTtlMs);
    cacheRegistry.register(this.tickerCache as MarketDataCache);
    cacheRegistry.register(this.candlesCache as MarketDataCache);
  }

  async getTicker(symbol: string, load: () => Promise<Ticker>): Promise<Ticker> {
    return this.readThrough(this.tickerCache, tickerCacheKey(symbol), load);
  }

  async getCandles(
    symbol: string,
    timeframe: Timeframe,
    limit: number,
    load: () => Promise<Candle[]>,
  ): Promise<Candle[]> {
    return this.readThrough(this.candlesCache, candlesCacheKey(symbol, timeframe, limit), load);
  }

  stats(): MarketCacheStatsView {
    const caches = this.cacheRegistry.metrics();
    let hits = 0;
    let misses = 0;
    let entries = 0;
    let lastRefreshMs: number | null = null;
    for (const metrics of Object.values(caches)) {
      hits += metrics.hits;
      misses += metrics.misses;
      entries += metrics.entries;
      if (metrics.lastRefresh !== null) {
        const refreshMs = Date.parse(metrics.lastRefresh);
        lastRefreshMs = lastRefreshMs === null ? refreshMs : Math.max(lastRefreshMs, refreshMs);
      }
    }
    const lookups = hits + misses;
    return Object.freeze({
      enabled: this.config.enabled,
      hits,
      misses,
      entries,
      hitRatio: lookups === 0 ? 0 : roundRatio(hits / lookups),
      lastRefresh: lastRefreshMs === null ? null : new Date(lastRefreshMs).toISOString(),
      providerCalls: this.providerCalls,
      caches,
      generatedAt: new Date().toISOString(),
    });
  }

  private async readThrough<T>(
    cache: MarketDataCache<T>,
    key: string,
    load: () => Promise<T>,
  ): Promise<T> {
    if (!this.config.enabled) {
      this.providerCalls += 1;
      return load();
    }
    const cached = cache.get(key);
    if (cached !== undefined) {
      return cached;
    }
    this.providerCalls += 1;
    const value = await load();
    cache.set(key, value);
    return value;
  }
}
