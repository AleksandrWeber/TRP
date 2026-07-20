/**
 * Provider-independent in-memory TTL cache (US008).
 * Pure data structure — no Nest, no provider, no I/O knowledge. Values are
 * stored with an absolute expiry; a lookup at or past the expiry is a miss
 * and evicts the stale entry, so consumers always refresh through their
 * source of truth.
 */

export type MarketDataCacheMetrics = Readonly<{
  hits: number;
  misses: number;
  entries: number;
  /** hits / (hits + misses), 0 when the cache has never been read. */
  hitRatio: number;
  /** ISO-8601 of the last successful store, null before the first store. */
  lastRefresh: string | null;
}>;

type CacheEntry<T> = {
  value: T;
  expiresAtMs: number;
};

export class MarketDataCache<T = unknown> {
  private readonly store = new Map<string, CacheEntry<T>>();
  private hits = 0;
  private misses = 0;
  private lastRefreshMs: number | null = null;
  private readonly now: () => number;

  constructor(
    readonly name: string,
    readonly ttlMs: number,
    now: () => number = Date.now,
  ) {
    if (name.trim() === '') {
      throw new Error('MarketDataCache name must not be empty');
    }
    if (!Number.isFinite(ttlMs) || ttlMs <= 0) {
      throw new Error(`MarketDataCache '${name}' ttlMs must be a finite positive number`);
    }
    this.now = now;
  }

  /** Returns the cached value on a fresh hit; evicts and misses when expired. */
  get(key: string): T | undefined {
    const entry = this.store.get(key);
    if (entry !== undefined && entry.expiresAtMs > this.now()) {
      this.hits += 1;
      return entry.value;
    }
    if (entry !== undefined) {
      this.store.delete(key);
    }
    this.misses += 1;
    return undefined;
  }

  set(key: string, value: T): void {
    const nowMs = this.now();
    this.store.set(key, { value, expiresAtMs: nowMs + this.ttlMs });
    this.lastRefreshMs = nowMs;
  }

  /** Live (non-expired) entry count — expired entries are purged on read. */
  entryCount(): number {
    const nowMs = this.now();
    for (const [key, entry] of this.store) {
      if (entry.expiresAtMs <= nowMs) {
        this.store.delete(key);
      }
    }
    return this.store.size;
  }

  metrics(): MarketDataCacheMetrics {
    const lookups = this.hits + this.misses;
    return Object.freeze({
      hits: this.hits,
      misses: this.misses,
      entries: this.entryCount(),
      hitRatio: lookups === 0 ? 0 : roundRatio(this.hits / lookups),
      lastRefresh: this.lastRefreshMs === null ? null : new Date(this.lastRefreshMs).toISOString(),
    });
  }

  clear(): void {
    this.store.clear();
  }
}

export function roundRatio(ratio: number): number {
  return Math.round(ratio * 10_000) / 10_000;
}
