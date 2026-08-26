import {
  isMarketCandleInterval,
  type MarketCandleInterval,
  type NormalizedMarketCandle,
  type ProviderCandleObservation,
} from './market-candle';

const DECIMAL_PATTERN = /^-?\d+(\.\d+)?$/;
const NON_NEGATIVE_DECIMAL_PATTERN = /^\d+(\.\d+)?$/;

/** Allow small provider/local clock skew before rejecting close timestamps. */
export const MARKET_CANDLE_CLOCK_SKEW_MS = 30_000;

/**
 * Deterministic normalization of a provider candle observation.
 * Unknown fields are never guessed. Invalid values return null.
 */
export function normalizeProviderCandle(input: {
  providerId: string;
  normalizedSymbol: string;
  interval: MarketCandleInterval;
  observation: ProviderCandleObservation;
  retrievalTimestamp: string;
}): NormalizedMarketCandle | null {
  const normalizedSymbol = input.normalizedSymbol.trim().toUpperCase();
  if (!/^[A-Z0-9]+-[A-Z0-9]+$/.test(normalizedSymbol)) {
    return null;
  }
  if (!isMarketCandleInterval(input.interval)) {
    return null;
  }

  const open = normalizeDecimal(input.observation.open);
  const high = normalizeDecimal(input.observation.high);
  const low = normalizeDecimal(input.observation.low);
  const close = normalizeDecimal(input.observation.close);
  const volume = normalizeNonNegativeDecimal(input.observation.volume);
  if (open === null || high === null || low === null || close === null || volume === null) {
    return null;
  }
  if (!isValidOhlc(open, high, low, close)) {
    return null;
  }

  const openTimeMs = input.observation.openTimeMs;
  const closeTimeMs = input.observation.closeTimeMs;
  if (!Number.isFinite(openTimeMs) || !Number.isFinite(closeTimeMs)) {
    return null;
  }
  if (openTimeMs <= 0 || closeTimeMs <= 0 || openTimeMs >= closeTimeMs) {
    return null;
  }

  const retrievalMs = Date.parse(input.retrievalTimestamp);
  if (!Number.isFinite(retrievalMs)) {
    return null;
  }
  if (closeTimeMs > retrievalMs + MARKET_CANDLE_CLOCK_SKEW_MS) {
    return null;
  }

  const tradeCount = normalizeTradeCount(input.observation.tradeCount);
  if (tradeCount === undefined) {
    return null;
  }

  const openTime = new Date(openTimeMs).toISOString();
  const closeTime = new Date(closeTimeMs).toISOString();

  return Object.freeze({
    normalizedSymbol,
    interval: input.interval,
    openTime,
    closeTime,
    open,
    high,
    low,
    close,
    volume,
    tradeCount,
    exchangeTimestamp: closeTime,
    retrievalTimestamp: input.retrievalTimestamp,
    providerId: input.providerId,
  });
}

function normalizeDecimal(value: string): string | null {
  const trimmed = value.trim();
  if (!DECIMAL_PATTERN.test(trimmed)) {
    return null;
  }
  return trimmed;
}

function normalizeNonNegativeDecimal(value: string): string | null {
  const trimmed = value.trim();
  if (!NON_NEGATIVE_DECIMAL_PATTERN.test(trimmed)) {
    return null;
  }
  return trimmed;
}

function isValidOhlc(open: string, high: string, low: string, close: string): boolean {
  const o = Number(open);
  const h = Number(high);
  const l = Number(low);
  const c = Number(close);
  if (![o, h, l, c].every(Number.isFinite)) {
    return false;
  }
  if (h < l) {
    return false;
  }
  if (h < o || h < c) {
    return false;
  }
  if (l > o || l > c) {
    return false;
  }
  return true;
}

/** undefined means invalid; null means unavailable and must not be guessed. */
function normalizeTradeCount(value: number | null): number | null | undefined {
  if (value === null) {
    return null;
  }
  if (!Number.isInteger(value) || value < 0) {
    return undefined;
  }
  return value;
}
