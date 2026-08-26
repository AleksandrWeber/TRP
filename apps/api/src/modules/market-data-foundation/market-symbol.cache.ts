import { Injectable } from '@nestjs/common';
import type { NormalizedMarketSymbol } from './market-symbol';

export type MarketSymbolCacheEntry = Readonly<{
  providerId: string;
  discoveredAt: string;
  symbols: readonly NormalizedMarketSymbol[];
}>;

/**
 * Session-safe symbol cache (W2-S03-b).
 *
 * Caches only normalized symbols. No prices, ticker, candles, or order book.
 * Entries are scoped to one workspace connection and are not persisted.
 */
@Injectable()
export class MarketSymbolCache {
  private readonly entries = new Map<string, MarketSymbolCacheEntry>();

  get(workspaceId: string, connectionId: string): MarketSymbolCacheEntry | null {
    return this.entries.get(cacheKey(workspaceId, connectionId)) ?? null;
  }

  set(workspaceId: string, connectionId: string, entry: MarketSymbolCacheEntry): void {
    this.entries.set(
      cacheKey(workspaceId, connectionId),
      Object.freeze({
        providerId: entry.providerId,
        discoveredAt: entry.discoveredAt,
        symbols: Object.freeze([...entry.symbols]),
      }),
    );
  }

  clear(workspaceId: string, connectionId: string): void {
    this.entries.delete(cacheKey(workspaceId, connectionId));
  }

  /**
   * Lookup a known symbol for an offered Market Data provider in a workspace.
   * Used by Paper Orders (W2-S04-b) without exposing transport or prices.
   */
  findByProviderAndSymbol(
    workspaceId: string,
    providerId: string,
    symbol: string,
  ): NormalizedMarketSymbol | null {
    const needle = symbol.trim().toUpperCase();
    if (!needle) return null;
    for (const [key, entry] of this.entries) {
      if (!key.startsWith(`${workspaceId}:`)) continue;
      if (entry.providerId !== providerId) continue;
      const match = entry.symbols.find(
        (item) =>
          item.exchangeSymbol.toUpperCase() === needle ||
          item.normalizedSymbol.toUpperCase() === needle,
      );
      if (match) return match;
    }
    return null;
  }
}

function cacheKey(workspaceId: string, connectionId: string): string {
  return `${workspaceId}:${connectionId}`;
}
