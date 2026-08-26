import { listMarketDataProviders } from '../market-data-foundation/market-data-provider-catalog';
import { MarketSymbolCache } from '../market-data-foundation/market-symbol.cache';
import {
  MarketTickerCache,
  type MarketTickerCacheEntry,
} from '../market-data-foundation/market-ticker.cache';
import type { NormalizedMarketTicker } from '../market-data-foundation/market-ticker';

/**
 * Abstract Market Data consumption for Paper Orders and Execution (W2-S04-b/c).
 * Catalog, symbols, and ticker snapshots only — no REST, streaming transport, or provider payloads.
 */
export class PaperOrderMarketDataGateway {
  constructor(
    private readonly symbols: MarketSymbolCache,
    private readonly tickers: MarketTickerCache,
  ) {}

  isOfferedExchange(exchange: string): boolean {
    const id = exchange.trim().toUpperCase();
    return listMarketDataProviders().some((provider) => provider.id === id);
  }

  isKnownSymbol(workspaceId: string, exchange: string, symbol: string): boolean {
    if (!this.isOfferedExchange(exchange)) return false;
    return (
      this.symbols.findByProviderAndSymbol(workspaceId, exchange.trim().toUpperCase(), symbol) !==
      null
    );
  }

  listOfferedExchanges(): readonly string[] {
    return listMarketDataProviders().map((provider) => provider.id);
  }

  /**
   * Returns a normalized ticker snapshot for matching, or null when unavailable.
   * Does not fetch, invent, interpolate, or stream.
   */
  getTickerSnapshot(
    workspaceId: string,
    exchange: string,
    symbol: string,
  ): NormalizedMarketTicker | null {
    if (!this.isOfferedExchange(exchange)) return null;
    const known = this.symbols.findByProviderAndSymbol(
      workspaceId,
      exchange.trim().toUpperCase(),
      symbol,
    );
    if (!known) return null;
    const entry: MarketTickerCacheEntry | null = this.tickers.findByProviderAndSymbol(
      workspaceId,
      exchange.trim().toUpperCase(),
      known.exchangeSymbol,
    );
    if (!entry) {
      return (
        this.tickers.findByProviderAndSymbol(
          workspaceId,
          exchange.trim().toUpperCase(),
          known.normalizedSymbol,
        )?.ticker ?? null
      );
    }
    return entry.ticker;
  }
}
