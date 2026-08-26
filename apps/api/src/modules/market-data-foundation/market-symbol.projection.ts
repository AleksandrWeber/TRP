import type { NormalizedMarketSymbol } from './market-symbol';

/**
 * Public Market Data symbol projection.
 * No prices, ticker, candles, order book, or exchange-private fields.
 */
export type MarketSymbolView = Readonly<{
  exchangeSymbol: string;
  normalizedSymbol: string;
  baseAsset: string;
  quoteAsset: string;
  tradingStatus: string;
  providerId: string;
}>;

export type MarketSymbolDiscoveryView = Readonly<{
  connectionId: string;
  providerId: string;
  discoveredAt: string;
  symbols: readonly MarketSymbolView[];
  outcome: 'COMPLETED' | 'FAILED' | 'PROVIDER_UNAVAILABLE' | 'NOT_IMPLEMENTED';
  failureReason: string | null;
}>;

export function projectMarketSymbol(symbol: NormalizedMarketSymbol): MarketSymbolView {
  return Object.freeze({
    exchangeSymbol: symbol.exchangeSymbol,
    normalizedSymbol: symbol.normalizedSymbol,
    baseAsset: symbol.baseAsset,
    quoteAsset: symbol.quoteAsset,
    tradingStatus: symbol.tradingStatus,
    providerId: symbol.providerId,
  });
}

export function projectMarketSymbols(
  symbols: readonly NormalizedMarketSymbol[],
): readonly MarketSymbolView[] {
  return Object.freeze(symbols.map(projectMarketSymbol));
}

export function projectSymbolDiscovery(input: {
  connectionId: string;
  providerId: string;
  discoveredAt: string;
  symbols: readonly NormalizedMarketSymbol[];
  outcome: MarketSymbolDiscoveryView['outcome'];
  failureReason: string | null;
}): MarketSymbolDiscoveryView {
  return Object.freeze({
    connectionId: input.connectionId,
    providerId: input.providerId,
    discoveredAt: input.discoveredAt,
    symbols: projectMarketSymbols(input.symbols),
    outcome: input.outcome,
    failureReason: input.failureReason,
  });
}
