import {
  isMarketOrderBookDepth,
  type MarketOrderBookDepth,
  type NormalizedMarketOrderBook,
  type ProviderOrderBookSnapshot,
} from './market-order-book';
import { normalizeProviderOrderBook } from './market-order-book.normalize';
import { isValidExchangeSymbol, isValidNormalizedSymbol } from './market-ticker.normalize';

export class MarketOrderBookValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MarketOrderBookValidationError';
  }
}

export class MarketOrderBookMalformedPayloadError extends MarketOrderBookValidationError {
  constructor(message = 'Malformed provider order book payload') {
    super(message);
    this.name = 'MarketOrderBookMalformedPayloadError';
  }
}

export class MarketOrderBookInvalidSymbolError extends MarketOrderBookValidationError {
  constructor(message = 'Invalid order book symbol') {
    super(message);
    this.name = 'MarketOrderBookInvalidSymbolError';
  }
}

export class MarketOrderBookInvalidDepthError extends MarketOrderBookValidationError {
  constructor(message = 'Unsupported order book depth') {
    super(message);
    this.name = 'MarketOrderBookInvalidDepthError';
  }
}

export class MarketOrderBookDuplicatePriceError extends MarketOrderBookValidationError {
  constructor(price: string) {
    super(`Duplicate order book price level: ${price}`);
    this.name = 'MarketOrderBookDuplicatePriceError';
  }
}

/**
 * Validate request symbols and depth before retrieval.
 */
export function validateOrderBookRetrievalRequest(input: {
  exchangeSymbol: string;
  normalizedSymbol: string;
  depthLimit: number;
}): {
  exchangeSymbol: string;
  normalizedSymbol: string;
  depthLimit: MarketOrderBookDepth;
} {
  const exchangeSymbol = input.exchangeSymbol.trim().toUpperCase();
  const normalizedSymbol = input.normalizedSymbol.trim().toUpperCase();
  if (!isValidExchangeSymbol(exchangeSymbol)) {
    throw new MarketOrderBookInvalidSymbolError('Invalid exchange symbol');
  }
  if (!isValidNormalizedSymbol(normalizedSymbol)) {
    throw new MarketOrderBookInvalidSymbolError('Invalid normalized symbol');
  }
  if (!Number.isInteger(input.depthLimit) || !isMarketOrderBookDepth(input.depthLimit)) {
    throw new MarketOrderBookInvalidDepthError('Unsupported order book depth');
  }
  return { exchangeSymbol, normalizedSymbol, depthLimit: input.depthLimit };
}

/**
 * Validate and normalize a provider order book snapshot.
 * Fail closed: malformed payloads, invalid prices/quantities, and duplicates reject.
 */
export function validateAndNormalizeOrderBook(input: {
  providerId: string;
  normalizedSymbol: string;
  depthLimit: MarketOrderBookDepth;
  snapshot: ProviderOrderBookSnapshot | null | undefined;
  retrievalTimestamp: string;
}): NormalizedMarketOrderBook {
  if (input.snapshot === null || input.snapshot === undefined) {
    throw new MarketOrderBookMalformedPayloadError();
  }
  if (typeof input.snapshot !== 'object') {
    throw new MarketOrderBookMalformedPayloadError('Invalid provider order book snapshot');
  }

  const snapshot = input.snapshot;
  if (!isValidExchangeSymbol(snapshot.exchangeSymbol)) {
    throw new MarketOrderBookInvalidSymbolError('Invalid exchange symbol in provider payload');
  }

  assertNoDuplicatePrices(snapshot.bids, 'bids');
  assertNoDuplicatePrices(snapshot.asks, 'asks');

  const normalized = normalizeProviderOrderBook({
    providerId: input.providerId,
    normalizedSymbol: input.normalizedSymbol,
    depthLimit: input.depthLimit,
    snapshot,
    retrievalTimestamp: input.retrievalTimestamp,
  });
  if (normalized === null) {
    throw new MarketOrderBookValidationError('Invalid provider order book snapshot');
  }
  return normalized;
}

function assertNoDuplicatePrices(
  levels: readonly { price: string }[],
  side: 'bids' | 'asks',
): void {
  if (!Array.isArray(levels)) {
    throw new MarketOrderBookMalformedPayloadError(`Invalid provider order book ${side}`);
  }
  const seen = new Set<string>();
  for (const level of levels) {
    if (level === null || typeof level !== 'object' || typeof level.price !== 'string') {
      throw new MarketOrderBookMalformedPayloadError(`Invalid provider order book ${side}`);
    }
    const price = level.price.trim();
    if (seen.has(price)) {
      throw new MarketOrderBookDuplicatePriceError(price);
    }
    seen.add(price);
  }
}
