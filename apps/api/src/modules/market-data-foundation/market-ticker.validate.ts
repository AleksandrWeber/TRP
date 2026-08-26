import type { NormalizedMarketTicker, ProviderTickerObservation } from './market-ticker';
import {
  isValidExchangeSymbol,
  isValidNormalizedSymbol,
  normalizeProviderTicker,
} from './market-ticker.normalize';

export class MarketTickerValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MarketTickerValidationError';
  }
}

export class MarketTickerMalformedPayloadError extends MarketTickerValidationError {
  constructor(message = 'Malformed provider ticker payload') {
    super(message);
    this.name = 'MarketTickerMalformedPayloadError';
  }
}

export class MarketTickerInvalidSymbolError extends MarketTickerValidationError {
  constructor(message = 'Invalid ticker symbol') {
    super(message);
    this.name = 'MarketTickerInvalidSymbolError';
  }
}

/**
 * Validate request symbols before adapter retrieval.
 */
export function validateTickerSymbolRequest(input: {
  exchangeSymbol: string;
  normalizedSymbol: string;
}): { exchangeSymbol: string; normalizedSymbol: string } {
  const exchangeSymbol = input.exchangeSymbol.trim().toUpperCase();
  const normalizedSymbol = input.normalizedSymbol.trim().toUpperCase();
  if (!isValidExchangeSymbol(exchangeSymbol)) {
    throw new MarketTickerInvalidSymbolError('Invalid exchange symbol');
  }
  if (!isValidNormalizedSymbol(normalizedSymbol)) {
    throw new MarketTickerInvalidSymbolError('Invalid normalized symbol');
  }
  return { exchangeSymbol, normalizedSymbol };
}

/**
 * Validate and normalize a provider ticker observation.
 * Fail closed: malformed payloads, invalid prices, and inconsistent timestamps reject.
 */
export function validateAndNormalizeTicker(input: {
  providerId: string;
  normalizedSymbol: string;
  observation: ProviderTickerObservation | null | undefined;
  retrievalTimestamp: string;
}): NormalizedMarketTicker {
  if (input.observation === null || input.observation === undefined) {
    throw new MarketTickerMalformedPayloadError();
  }
  if (typeof input.observation !== 'object') {
    throw new MarketTickerMalformedPayloadError('Invalid provider ticker observation');
  }

  const observation = input.observation;
  const expectedExchange = observation.exchangeSymbol.trim().toUpperCase();
  if (!isValidExchangeSymbol(expectedExchange)) {
    throw new MarketTickerInvalidSymbolError('Invalid exchange symbol in provider payload');
  }

  const normalized = normalizeProviderTicker({
    providerId: input.providerId,
    normalizedSymbol: input.normalizedSymbol,
    observation,
    retrievalTimestamp: input.retrievalTimestamp,
  });
  if (normalized === null) {
    throw new MarketTickerValidationError('Invalid provider ticker observation');
  }
  return normalized;
}
