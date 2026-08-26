import { Inject, Injectable } from '@nestjs/common';
import type { ProviderTickerObservation } from './market-ticker';
import type {
  MarketTickerRetrievalAdapter,
  MarketTickerRetrievalAdapterRequest,
  MarketTickerRetrievalAdapterResult,
} from './market-ticker.retrieval';
import { TICKER_RETRIEVAL_HTTP_CLIENT, type TickerRetrievalHttpClient } from './market-ticker.http';

export const BINANCE_TICKER_RETRIEVAL_ORIGIN = 'https://api.binance.com';
export const BINANCE_TICKER_RETRIEVAL_PATH = '/api/v3/ticker/24hr';

/**
 * Binance ticker retrieval adapter.
 *
 * Reads the public 24hr ticker for one symbol. That endpoint returns current
 * ticker statistics and does not return candles, order book, balances, or
 * positions. It does not open a streaming socket. Transport stays inside this adapter.
 */
@Injectable()
export class BinanceTickerRetrievalAdapter implements MarketTickerRetrievalAdapter {
  readonly providerId = 'BINANCE';
  readonly implemented = true;

  constructor(
    @Inject(TICKER_RETRIEVAL_HTTP_CLIENT)
    private readonly http: TickerRetrievalHttpClient,
  ) {}

  async retrieve(
    request: MarketTickerRetrievalAdapterRequest,
  ): Promise<MarketTickerRetrievalAdapterResult> {
    const symbol = request.exchangeSymbol.trim().toUpperCase();
    const url = `${BINANCE_TICKER_RETRIEVAL_ORIGIN}${BINANCE_TICKER_RETRIEVAL_PATH}?symbol=${encodeURIComponent(symbol)}`;

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
      const observation = parseBinanceTicker24hr(response.bodyText, symbol);
      if (observation === null) {
        return { kind: 'malformed' };
      }
      return { kind: 'retrieved', observation };
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

export function parseBinanceTicker24hr(
  bodyText: string,
  expectedSymbol: string,
): ProviderTickerObservation | null {
  try {
    const parsed = JSON.parse(bodyText) as unknown;
    if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return null;
    }
    const row = parsed as Record<string, unknown>;
    if (typeof row.symbol !== 'string') {
      return null;
    }
    if (row.symbol.toUpperCase() !== expectedSymbol.toUpperCase()) {
      return null;
    }
    const lastPrice = asDecimalString(row.lastPrice);
    const bid = asDecimalString(row.bidPrice);
    const ask = asDecimalString(row.askPrice);
    const changePercent24h = asDecimalString(row.priceChangePercent);
    const high24h = asDecimalString(row.highPrice);
    const low24h = asDecimalString(row.lowPrice);
    const volume24h = asDecimalString(row.volume);
    const exchangeTimestampMs = asPositiveNumber(row.closeTime);
    if (
      lastPrice === null ||
      bid === null ||
      ask === null ||
      changePercent24h === null ||
      high24h === null ||
      low24h === null ||
      volume24h === null ||
      exchangeTimestampMs === null
    ) {
      return null;
    }
    return Object.freeze({
      exchangeSymbol: row.symbol.toUpperCase(),
      lastPrice,
      bid,
      ask,
      changePercent24h,
      high24h,
      low24h,
      volume24h,
      exchangeTimestampMs,
    });
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
