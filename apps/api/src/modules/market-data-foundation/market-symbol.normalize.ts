import {
  isMarketSymbolTradingStatus,
  type NormalizedMarketSymbol,
  type ProviderSymbolDefinition,
} from './market-symbol';

/**
 * Deterministic normalization of a provider symbol definition.
 * Unknown trading statuses are not guessed — they fail validation later.
 */
export function normalizeProviderSymbol(
  providerId: string,
  definition: ProviderSymbolDefinition,
): NormalizedMarketSymbol | null {
  const exchangeSymbol = definition.exchangeSymbol.trim().toUpperCase();
  const baseAsset = definition.baseAsset.trim().toUpperCase();
  const quoteAsset = definition.quoteAsset.trim().toUpperCase();
  const tradingStatusRaw = definition.tradingStatus.trim().toUpperCase();

  if (exchangeSymbol === '' || baseAsset === '' || quoteAsset === '') {
    return null;
  }
  if (!isMarketSymbolTradingStatus(tradingStatusRaw)) {
    return null;
  }

  return Object.freeze({
    exchangeSymbol,
    normalizedSymbol: `${baseAsset}-${quoteAsset}`,
    baseAsset,
    quoteAsset,
    tradingStatus: tradingStatusRaw,
    providerId,
  });
}

export function normalizeProviderSymbols(
  providerId: string,
  definitions: readonly ProviderSymbolDefinition[],
): {
  symbols: readonly NormalizedMarketSymbol[];
  rejectedCount: number;
} {
  const symbols: NormalizedMarketSymbol[] = [];
  let rejectedCount = 0;
  for (const definition of definitions) {
    const normalized = normalizeProviderSymbol(providerId, definition);
    if (normalized === null) {
      rejectedCount += 1;
      continue;
    }
    symbols.push(normalized);
  }
  return { symbols: Object.freeze(symbols), rejectedCount };
}
