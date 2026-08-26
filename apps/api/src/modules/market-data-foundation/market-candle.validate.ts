import {
  isMarketCandleInterval,
  type MarketCandleFreshness,
  type MarketCandleInterval,
  type NormalizedMarketCandle,
  type ProviderCandleObservation,
} from './market-candle';
import { calculateCandleFreshness } from './market-candle.freshness';
import { normalizeProviderCandle } from './market-candle.normalize';
import { isValidExchangeSymbol, isValidNormalizedSymbol } from './market-ticker.normalize';

export class MarketCandleValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MarketCandleValidationError';
  }
}

export class MarketCandleMalformedPayloadError extends MarketCandleValidationError {
  constructor(message = 'Malformed provider candlestick payload') {
    super(message);
    this.name = 'MarketCandleMalformedPayloadError';
  }
}

export class MarketCandleInvalidSymbolError extends MarketCandleValidationError {
  constructor(message = 'Invalid candlestick symbol') {
    super(message);
    this.name = 'MarketCandleInvalidSymbolError';
  }
}

export class MarketCandleInvalidIntervalError extends MarketCandleValidationError {
  constructor(message = 'Unsupported candlestick interval') {
    super(message);
    this.name = 'MarketCandleInvalidIntervalError';
  }
}

export class MarketCandleInvalidRangeError extends MarketCandleValidationError {
  constructor(message = 'Invalid candlestick range') {
    super(message);
    this.name = 'MarketCandleInvalidRangeError';
  }
}

export class MarketCandleDuplicateTimestampError extends MarketCandleValidationError {
  constructor(openTime: string) {
    super(`Duplicate candlestick open time: ${openTime}`);
    this.name = 'MarketCandleDuplicateTimestampError';
  }
}

/**
 * Validate request symbols, interval, and historical range before retrieval.
 */
export function validateCandleRetrievalRequest(input: {
  exchangeSymbol: string;
  normalizedSymbol: string;
  interval: string;
  rangeStart: string;
  rangeEnd: string;
}): {
  exchangeSymbol: string;
  normalizedSymbol: string;
  interval: MarketCandleInterval;
  rangeStartMs: number;
  rangeEndMs: number;
  rangeStart: string;
  rangeEnd: string;
} {
  const exchangeSymbol = input.exchangeSymbol.trim().toUpperCase();
  const normalizedSymbol = input.normalizedSymbol.trim().toUpperCase();
  if (!isValidExchangeSymbol(exchangeSymbol)) {
    throw new MarketCandleInvalidSymbolError('Invalid exchange symbol');
  }
  if (!isValidNormalizedSymbol(normalizedSymbol)) {
    throw new MarketCandleInvalidSymbolError('Invalid normalized symbol');
  }

  const interval = input.interval.trim();
  if (!isMarketCandleInterval(interval)) {
    throw new MarketCandleInvalidIntervalError('Unsupported candlestick interval');
  }

  const rangeStartMs = Date.parse(input.rangeStart);
  const rangeEndMs = Date.parse(input.rangeEnd);
  if (!Number.isFinite(rangeStartMs) || !Number.isFinite(rangeEndMs)) {
    throw new MarketCandleInvalidRangeError('Invalid candlestick range');
  }
  if (rangeStartMs >= rangeEndMs) {
    throw new MarketCandleInvalidRangeError('Candlestick range start must be before range end');
  }

  return {
    exchangeSymbol,
    normalizedSymbol,
    interval,
    rangeStartMs,
    rangeEndMs,
    rangeStart: new Date(rangeStartMs).toISOString(),
    rangeEnd: new Date(rangeEndMs).toISOString(),
  };
}

/**
 * Validate and normalize a provider candlestick batch.
 * Fail closed: malformed payloads, invalid OHLC, negative volume, and duplicates reject.
 */
export function validateAndNormalizeCandles(input: {
  providerId: string;
  normalizedSymbol: string;
  interval: MarketCandleInterval;
  observations: readonly ProviderCandleObservation[] | null | undefined;
  retrievalTimestamp: string;
}): {
  candles: readonly NormalizedMarketCandle[];
  freshness: MarketCandleFreshness;
} {
  if (input.observations === null || input.observations === undefined) {
    throw new MarketCandleMalformedPayloadError();
  }
  if (!Array.isArray(input.observations)) {
    throw new MarketCandleMalformedPayloadError('Invalid provider candlestick payload');
  }

  const seenOpenTimes = new Set<number>();
  const candles: NormalizedMarketCandle[] = [];

  for (const observation of input.observations) {
    if (observation === null || typeof observation !== 'object') {
      throw new MarketCandleMalformedPayloadError('Invalid provider candle observation');
    }
    if (seenOpenTimes.has(observation.openTimeMs)) {
      throw new MarketCandleDuplicateTimestampError(String(observation.openTimeMs));
    }
    seenOpenTimes.add(observation.openTimeMs);

    const normalized = normalizeProviderCandle({
      providerId: input.providerId,
      normalizedSymbol: input.normalizedSymbol,
      interval: input.interval,
      observation,
      retrievalTimestamp: input.retrievalTimestamp,
    });
    if (normalized === null) {
      throw new MarketCandleValidationError('Invalid provider candle observation');
    }
    candles.push(normalized);
  }

  candles.sort((a, b) => Date.parse(a.openTime) - Date.parse(b.openTime));

  const freshness =
    candles.length === 0
      ? ('UNKNOWN' as const)
      : calculateCandleFreshness({
          latestExchangeTimestamp: candles[candles.length - 1]!.exchangeTimestamp,
          retrievalTimestamp: input.retrievalTimestamp,
        });

  return {
    candles: Object.freeze(candles),
    freshness,
  };
}
