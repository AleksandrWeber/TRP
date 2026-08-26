import { Inject, Injectable } from '@nestjs/common';
import type { ProviderCandleObservation } from './market-candle';
import type {
  MarketCandleRetrievalAdapter,
  MarketCandleRetrievalAdapterRequest,
  MarketCandleRetrievalAdapterResult,
} from './market-candle.retrieval';
import { CANDLE_RETRIEVAL_HTTP_CLIENT, type CandleRetrievalHttpClient } from './market-candle.http';

export const BINANCE_CANDLE_RETRIEVAL_ORIGIN = 'https://api.binance.com';
export const BINANCE_CANDLE_RETRIEVAL_PATH = '/api/v3/klines';

/** Binance returns at most 1000 klines per request; caller range is still honored. */
export const BINANCE_CANDLE_MAX_LIMIT = 1000;

/**
 * Binance candlestick retrieval adapter.
 *
 * Reads public klines for one symbol and interval within a caller-specified
 * range. That endpoint returns historical OHLCV only and does not return
 * order book, trades stream, balances, or positions. It does not open a
 * streaming socket. Transport stays inside this adapter.
 */
@Injectable()
export class BinanceCandleRetrievalAdapter implements MarketCandleRetrievalAdapter {
  readonly providerId = 'BINANCE';
  readonly implemented = true;

  constructor(
    @Inject(CANDLE_RETRIEVAL_HTTP_CLIENT)
    private readonly http: CandleRetrievalHttpClient,
  ) {}

  async retrieve(
    request: MarketCandleRetrievalAdapterRequest,
  ): Promise<MarketCandleRetrievalAdapterResult> {
    const symbol = request.exchangeSymbol.trim().toUpperCase();
    const interval = request.interval;
    const params = new URLSearchParams({
      symbol,
      interval,
      startTime: String(request.rangeStartMs),
      endTime: String(request.rangeEndMs),
      limit: String(BINANCE_CANDLE_MAX_LIMIT),
    });
    const url = `${BINANCE_CANDLE_RETRIEVAL_ORIGIN}${BINANCE_CANDLE_RETRIEVAL_PATH}?${params.toString()}`;

    try {
      const response = await this.http.request({
        url,
        method: 'GET',
        signal: request.signal,
      });
      if (response.status === 418 || response.status === 429 || response.status >= 500) {
        return { kind: 'provider_unavailable' };
      }
      if (response.status === 400) {
        return { kind: 'failed' };
      }
      if (response.status !== 200) {
        return { kind: 'failed' };
      }
      if (response.bodyText.trim() === '') {
        return { kind: 'malformed' };
      }
      const observations = parseBinanceKlines(response.bodyText);
      if (observations === null) {
        return { kind: 'malformed' };
      }
      return { kind: 'retrieved', observations };
    } catch (error) {
      if (isAbortError(error)) {
        return { kind: 'failed' };
      }
      if (isNetworkError(error)) {
        return { kind: 'provider_unavailable' };
      }
      return { kind: 'failed' };
    }
  }
}

export function parseBinanceKlines(bodyText: string): readonly ProviderCandleObservation[] | null {
  try {
    const parsed = JSON.parse(bodyText) as unknown;
    if (!Array.isArray(parsed)) {
      return null;
    }
    const observations: ProviderCandleObservation[] = [];
    for (const row of parsed) {
      if (!Array.isArray(row) || row.length < 9) {
        return null;
      }
      const openTimeMs = asPositiveNumber(row[0]);
      const open = asDecimalString(row[1]);
      const high = asDecimalString(row[2]);
      const low = asDecimalString(row[3]);
      const close = asDecimalString(row[4]);
      const volume = asDecimalString(row[5]);
      const closeTimeMs = asPositiveNumber(row[6]);
      const tradeCount = asNonNegativeInteger(row[8]);
      if (
        openTimeMs === null ||
        open === null ||
        high === null ||
        low === null ||
        close === null ||
        volume === null ||
        closeTimeMs === null ||
        tradeCount === undefined
      ) {
        return null;
      }
      observations.push(
        Object.freeze({
          openTimeMs,
          closeTimeMs,
          open,
          high,
          low,
          close,
          volume,
          tradeCount,
        }),
      );
    }
    return Object.freeze(observations);
  } catch {
    return null;
  }
}

function asDecimalString(value: unknown): string | null {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return /^-?\d+(\.\d+)?$/.test(trimmed) ? trimmed : null;
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }
  return null;
}

function asPositiveNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
    return value;
  }
  if (typeof value === 'string' && /^-?\d+(\.\d+)?$/.test(value.trim())) {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  }
  return null;
}

function asNonNegativeInteger(value: unknown): number | null | undefined {
  if (typeof value === 'number' && Number.isInteger(value) && value >= 0) {
    return value;
  }
  if (typeof value === 'string' && /^\d+$/.test(value.trim())) {
    return Number(value);
  }
  return undefined;
}

function isAbortError(error: unknown): boolean {
  if (!error || typeof error !== 'object') {
    return false;
  }
  const candidate = error as { name?: unknown };
  return candidate.name === 'AbortError' || candidate.name === 'TimeoutError';
}

function isNetworkError(error: unknown): boolean {
  if (!error || typeof error !== 'object') {
    return false;
  }
  const candidate = error as { code?: unknown; cause?: { code?: unknown }; message?: unknown };
  const code = typeof candidate.code === 'string' ? candidate.code : candidate.cause?.code;
  if (
    code === 'ENOTFOUND' ||
    code === 'ECONNREFUSED' ||
    code === 'ECONNRESET' ||
    code === 'ETIMEDOUT' ||
    code === 'EHOSTUNREACH' ||
    code === 'UND_ERR_CONNECT_TIMEOUT'
  ) {
    return true;
  }
  return typeof candidate.message === 'string' && /fetch failed|network/i.test(candidate.message);
}
