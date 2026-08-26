import { Injectable } from '@nestjs/common';
import type {
  MarketOrderBookDepth,
  MarketOrderBookFreshness,
  NormalizedMarketOrderBook,
} from './market-order-book';

export type MarketOrderBookCacheEntry = Readonly<{
  providerId: string;
  exchangeSymbol: string;
  depthLimit: MarketOrderBookDepth;
  retrievedAt: string;
  freshness: MarketOrderBookFreshness;
  orderBook: NormalizedMarketOrderBook;
}>;

/**
 * Session-safe order book cache (W2-S03-e).
 *
 * Caches only normalized snapshots. No trades, streaming messages, or
 * historical depth. Entries are scoped to one workspace connection symbol
 * and depth and are not persisted. Cache behavior is transport-independent.
 */
@Injectable()
export class MarketOrderBookCache {
  private readonly entries = new Map<string, MarketOrderBookCacheEntry>();

  get(
    workspaceId: string,
    connectionId: string,
    exchangeSymbol: string,
    depthLimit: MarketOrderBookDepth,
  ): MarketOrderBookCacheEntry | null {
    return (
      this.entries.get(cacheKey(workspaceId, connectionId, exchangeSymbol, depthLimit)) ?? null
    );
  }

  set(
    workspaceId: string,
    connectionId: string,
    exchangeSymbol: string,
    depthLimit: MarketOrderBookDepth,
    entry: MarketOrderBookCacheEntry,
  ): void {
    this.entries.set(
      cacheKey(workspaceId, connectionId, exchangeSymbol, depthLimit),
      Object.freeze({
        providerId: entry.providerId,
        exchangeSymbol: entry.exchangeSymbol,
        depthLimit: entry.depthLimit,
        retrievedAt: entry.retrievedAt,
        freshness: entry.freshness,
        orderBook: Object.freeze({
          ...entry.orderBook,
          bids: Object.freeze(entry.orderBook.bids.map((level) => Object.freeze({ ...level }))),
          asks: Object.freeze(entry.orderBook.asks.map((level) => Object.freeze({ ...level }))),
        }),
      }),
    );
  }

  clear(
    workspaceId: string,
    connectionId: string,
    exchangeSymbol: string,
    depthLimit: MarketOrderBookDepth,
  ): void {
    this.entries.delete(cacheKey(workspaceId, connectionId, exchangeSymbol, depthLimit));
  }
}

function cacheKey(
  workspaceId: string,
  connectionId: string,
  exchangeSymbol: string,
  depthLimit: number,
): string {
  return `${workspaceId}:${connectionId}:${exchangeSymbol.toUpperCase()}:${depthLimit}`;
}
