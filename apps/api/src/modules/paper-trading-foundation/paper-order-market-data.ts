import { listMarketDataProviders } from '../market-data-foundation/market-data-provider-catalog';
import { MarketSymbolCache } from '../market-data-foundation/market-symbol.cache';

/**
 * Abstract Market Data consumption for Paper Orders (W2-S04-b).
 * Offered exchanges and known symbols only — no ticker, candles, book, or execution.
 */
export class PaperOrderMarketDataGateway {
  constructor(private readonly symbols: MarketSymbolCache) {}

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
}
