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
}

function cacheKey(workspaceId: string, connectionId: string, exchangeSymbol: string): string {
  return `${workspaceId}:${connectionId}:${exchangeSymbol.toUpperCase()}`;
}
