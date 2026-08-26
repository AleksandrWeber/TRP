import { Injectable } from '@nestjs/common';
import type { NormalizedMarketTicker } from './market-ticker';

export type MarketTickerCacheEntry = Readonly<{
  providerId: string;
  exchangeSymbol: string;
  retrievedAt: string;
  ticker: NormalizedMarketTicker;
}>;

/**
 * Session-safe ticker cache (W2-S03-c).
 *
 * Caches only normalized ticker objects. No candles, order book, or trades.
 * Entries are scoped to one workspace connection symbol and are not persisted.
 * Cache behavior is transport-independent.
 */
@Injectable()
export class MarketTickerCache {
  private readonly entries = new Map<string, MarketTickerCacheEntry>();

  get(
    workspaceId: string,
    connectionId: string,
    exchangeSymbol: string,
  ): MarketTickerCacheEntry | null {
    return this.entries.get(cacheKey(workspaceId, connectionId, exchangeSymbol)) ?? null;
  }

  set(
    workspaceId: string,
    connectionId: string,
    exchangeSymbol: string,
    entry: MarketTickerCacheEntry,
  ): void {
    this.entries.set(
      cacheKey(workspaceId, connectionId, exchangeSymbol),
      Object.freeze({
        providerId: entry.providerId,
        exchangeSymbol: entry.exchangeSymbol,
        retrievedAt: entry.retrievedAt,
        ticker: Object.freeze({ ...entry.ticker }),
      }),
    );
  }

  clear(workspaceId: string, connectionId: string, exchangeSymbol: string): void {
    this.entries.delete(cacheKey(workspaceId, connectionId, exchangeSymbol));
  }

  /**
   * Lookup a cached ticker snapshot for an offered Market Data provider + symbol.
   * Used by Paper Execution (W2-S04-c) without exposing transport or fabricating prices.
   */
  findByProviderAndSymbol(
    workspaceId: string,
    providerId: string,
    symbol: string,
  ): MarketTickerCacheEntry | null {
    const needle = symbol.trim().toUpperCase();
    if (!needle) return null;
    for (const [key, entry] of this.entries) {
      if (!key.startsWith(`${workspaceId}:`)) continue;
      if (entry.providerId !== providerId) continue;
      const tickerSymbol = entry.ticker.normalizedSymbol.toUpperCase();
      const exchangeSymbol = entry.exchangeSymbol.toUpperCase();
      if (exchangeSymbol === needle || tickerSymbol === needle) {
        return entry;
      }
    }
    return null;
  }
}

function cacheKey(workspaceId: string, connectionId: string, exchangeSymbol: string): string {
  return `${workspaceId}:${connectionId}:${exchangeSymbol.toUpperCase()}`;
}
