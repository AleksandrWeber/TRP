import { calculateTickerFreshness } from './market-ticker.freshness';
import type { NormalizedMarketTicker, ProviderTickerObservation } from './market-ticker';

const DECIMAL_PATTERN = /^-?\d+(\.\d+)?$/;
const EXCHANGE_SYMBOL_PATTERN = /^[A-Z0-9]{2,32}$/;
const NORMALIZED_SYMBOL_PATTERN = /^[A-Z0-9]+-[A-Z0-9]+$/;

/** Allow small provider/local clock skew before rejecting exchange timestamps. */
export const MARKET_TICKER_CLOCK_SKEW_MS = 30_000;

/**
 * Deterministic normalization of a provider ticker observation.
 * Unknown fields are never guessed. Invalid values return null.
 */
export function normalizeProviderTicker(input: {
  providerId: string;
  normalizedSymbol: string;
  observation: ProviderTickerObservation;
  retrievalTimestamp: string;
}): NormalizedMarketTicker | null {
  const exchangeSymbol = input.observation.exchangeSymbol.trim().toUpperCase();
  const normalizedSymbol = input.normalizedSymbol.trim().toUpperCase();
  if (!EXCHANGE_SYMBOL_PATTERN.test(exchangeSymbol)) {
    return null;
  }
  if (!NORMALIZED_SYMBOL_PATTERN.test(normalizedSymbol)) {
    return null;
  }

  const lastPrice = normalizeDecimal(input.observation.lastPrice);
  const bid = normalizeDecimal(input.observation.bid);
  const ask = normalizeDecimal(input.observation.ask);
  const changePercent24h = normalizeDecimal(input.observation.changePercent24h);
  const high24h = normalizeDecimal(input.observation.high24h);
  const low24h = normalizeDecimal(input.observation.low24h);
  const volume24h = normalizeDecimal(input.observation.volume24h);
  if (
    lastPrice === null ||
    bid === null ||
    ask === null ||
    changePercent24h === null ||
    high24h === null ||
    low24h === null ||
    volume24h === null
  ) {
    return null;
  }

  const exchangeMs = input.observation.exchangeTimestampMs;
  if (!Number.isFinite(exchangeMs) || exchangeMs <= 0) {
    return null;
  }
  const exchangeTimestamp = new Date(exchangeMs).toISOString();
  const retrievalMs = Date.parse(input.retrievalTimestamp);
  if (!Number.isFinite(retrievalMs)) {
    return null;
  }
  if (exchangeMs > retrievalMs + MARKET_TICKER_CLOCK_SKEW_MS) {
    return null;
  }

  const freshness = calculateTickerFreshness({
    exchangeTimestamp,
    retrievalTimestamp: input.retrievalTimestamp,
  });

  return Object.freeze({
    normalizedSymbol,
    lastPrice,
    bid,
    ask,
    changePercent24h,
    high24h,
    low24h,
    volume24h,
    exchangeTimestamp,
    retrievalTimestamp: input.retrievalTimestamp,
    providerId: input.providerId,
    freshness,
  });
}

function normalizeDecimal(value: string): string | null {
  const trimmed = value.trim();
  if (!DECIMAL_PATTERN.test(trimmed)) {
    return null;
  }
  return trimmed;
}

export function isValidExchangeSymbol(value: string): boolean {
  return EXCHANGE_SYMBOL_PATTERN.test(value.trim().toUpperCase());
}

export function isValidNormalizedSymbol(value: string): boolean {
  return NORMALIZED_SYMBOL_PATTERN.test(value.trim().toUpperCase());
}
