import type { NormalizedMarketSymbol, ProviderSymbolDefinition } from './market-symbol';
import { normalizeProviderSymbol } from './market-symbol.normalize';

export class MarketSymbolValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MarketSymbolValidationError';
  }
}

export class MarketSymbolDuplicateError extends MarketSymbolValidationError {
  constructor(normalizedSymbol: string) {
    super(`Duplicate normalized symbol: ${normalizedSymbol}`);
    this.name = 'MarketSymbolDuplicateError';
  }
}

export class MarketSymbolMalformedPayloadError extends MarketSymbolValidationError {
  constructor(message = 'Malformed provider symbol payload') {
    super(message);
    this.name = 'MarketSymbolMalformedPayloadError';
  }
}

/**
 * Validate and normalize a provider payload into unique normalized symbols.
 * Fail closed: any invalid definition or duplicate rejects the whole batch.
 */
export function validateAndNormalizeSymbols(
  providerId: string,
  definitions: readonly ProviderSymbolDefinition[],
): readonly NormalizedMarketSymbol[] {
  if (!Array.isArray(definitions)) {
    throw new MarketSymbolMalformedPayloadError();
  }

  const seenExchange = new Set<string>();
  const seenNormalized = new Set<string>();
  const symbols: NormalizedMarketSymbol[] = [];

  for (const definition of definitions) {
    if (definition === null || typeof definition !== 'object') {
      throw new MarketSymbolMalformedPayloadError('Invalid provider symbol definition');
    }
    const normalized = normalizeProviderSymbol(providerId, definition);
    if (normalized === null) {
      throw new MarketSymbolValidationError('Invalid provider symbol definition');
    }
    if (seenExchange.has(normalized.exchangeSymbol)) {
      throw new MarketSymbolDuplicateError(normalized.exchangeSymbol);
    }
    if (seenNormalized.has(normalized.normalizedSymbol)) {
      throw new MarketSymbolDuplicateError(normalized.normalizedSymbol);
    }
    seenExchange.add(normalized.exchangeSymbol);
    seenNormalized.add(normalized.normalizedSymbol);
    symbols.push(normalized);
  }

  return Object.freeze(symbols);
}
