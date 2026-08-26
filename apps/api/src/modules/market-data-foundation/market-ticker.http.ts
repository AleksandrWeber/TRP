import { Injectable } from '@nestjs/common';

export type TickerRetrievalHttpRequest = Readonly<{
  url: string;
  method: 'GET';
  headers?: Readonly<Record<string, string>>;
  signal: AbortSignal;
}>;

export type TickerRetrievalHttpResponse = Readonly<{
  status: number;
  bodyText: string;
}>;

export interface TickerRetrievalHttpClient {
  request(input: TickerRetrievalHttpRequest): Promise<TickerRetrievalHttpResponse>;
}

/** Ticker payloads are small; keep a tight bound. */
export const MAX_TICKER_RETRIEVAL_BODY_CHARS = 100_000;

export const TICKER_RETRIEVAL_HTTP_CLIENT = Symbol('TICKER_RETRIEVAL_HTTP_CLIENT');
export const TICKER_RETRIEVAL_TIMEOUT_MS = Symbol('TICKER_RETRIEVAL_TIMEOUT_MS');
export const DEFAULT_TICKER_RETRIEVAL_TIMEOUT_MS = 15_000;

/**
 * Adapter-only HTTP transport for ticker retrieval.
 * Not part of the public Market Data domain contract.
 */
@Injectable()
export class FetchTickerRetrievalHttpClient implements TickerRetrievalHttpClient {
  async request(input: TickerRetrievalHttpRequest): Promise<TickerRetrievalHttpResponse> {
    const response = await fetch(input.url, {
      method: input.method,
      headers: input.headers,
      redirect: 'error',
      signal: input.signal,
    });
    const raw = await response.text();
    if (raw.length > MAX_TICKER_RETRIEVAL_BODY_CHARS) {
      return {
        status: response.status,
        bodyText: '',
      };
    }
    return {
      status: response.status,
      bodyText: raw,
    };
  }
}
