import { Inject, Injectable } from '@nestjs/common';
import type { ProviderOrderBookLevel, ProviderOrderBookSnapshot } from './market-order-book';
import type {
  MarketOrderBookRetrievalAdapter,
  MarketOrderBookRetrievalAdapterRequest,
  MarketOrderBookRetrievalAdapterResult,
} from './market-order-book.retrieval';
import {
  ORDER_BOOK_RETRIEVAL_HTTP_CLIENT,
  type OrderBookRetrievalHttpClient,
} from './market-order-book.http';

export const BINANCE_ORDER_BOOK_RETRIEVAL_ORIGIN = 'https://api.binance.com';
export const BINANCE_ORDER_BOOK_RETRIEVAL_PATH = '/api/v3/depth';

/**
 * Binance order book snapshot retrieval adapter.
 *
 * Reads the public depth snapshot for one symbol and depth limit. That
 * endpoint returns a current bid/ask snapshot and does not return trades,
 * candles, balances, or positions. It does not open a streaming socket and
 * does not apply incremental depth updates. Transport stays inside this adapter.
 *
 * Binance depth does not include a wall-clock exchange timestamp; the adapter
 * reports null rather than inventing one.
 */
@Injectable()
export class BinanceOrderBookRetrievalAdapter implements MarketOrderBookRetrievalAdapter {
  readonly providerId = 'BINANCE';
  readonly implemented = true;

  constructor(
    @Inject(ORDER_BOOK_RETRIEVAL_HTTP_CLIENT)
    private readonly http: OrderBookRetrievalHttpClient,
  ) {}

  async retrieve(
    request: MarketOrderBookRetrievalAdapterRequest,
  ): Promise<MarketOrderBookRetrievalAdapterResult> {
    const symbol = request.exchangeSymbol.trim().toUpperCase();
    const params = new URLSearchParams({
      symbol,
      limit: String(request.depthLimit),
    });
    const url = `${BINANCE_ORDER_BOOK_RETRIEVAL_ORIGIN}${BINANCE_ORDER_BOOK_RETRIEVAL_PATH}?${params.toString()}`;

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
      const snapshot = parseBinanceDepth(response.bodyText, symbol);
      if (snapshot === null) {
        return { kind: 'malformed' };
      }
      return { kind: 'retrieved', snapshot };
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

export function parseBinanceDepth(
  bodyText: string,
  expectedSymbol: string,
): ProviderOrderBookSnapshot | null {
  try {
    const parsed = JSON.parse(bodyText) as unknown;
    if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return null;
    }
    const row = parsed as Record<string, unknown>;
    const bids = parseLevels(row.bids);
    const asks = parseLevels(row.asks);
    if (bids === null || asks === null) {
      return null;
    }
    return Object.freeze({
      exchangeSymbol: expectedSymbol.toUpperCase(),
      bids: Object.freeze(bids),
      asks: Object.freeze(asks),
      exchangeTimestampMs: null,
    });
  } catch {
    return null;
  }
}

function parseLevels(value: unknown): ProviderOrderBookLevel[] | null {
  if (!Array.isArray(value)) {
    return null;
  }
  const levels: ProviderOrderBookLevel[] = [];
  for (const entry of value) {
    if (!Array.isArray(entry) || entry.length < 2) {
      return null;
    }
    const price = asPositiveDecimalString(entry[0]);
    const quantity = asPositiveDecimalString(entry[1]);
    if (price === null || quantity === null) {
      return null;
    }
    levels.push(Object.freeze({ price, quantity }));
  }
  return levels;
}

function asPositiveDecimalString(value: unknown): string | null {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!/^\d+(\.\d+)?$/.test(trimmed) || Number(trimmed) <= 0) {
      return null;
    }
    return trimmed;
  }
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
    return String(value);
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
