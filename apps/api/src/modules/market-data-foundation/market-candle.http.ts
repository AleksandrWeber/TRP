import { Injectable } from '@nestjs/common';

export type CandleRetrievalHttpRequest = Readonly<{
  url: string;
  method: 'GET';
  headers?: Readonly<Record<string, string>>;
  signal: AbortSignal;
}>;

export type CandleRetrievalHttpResponse = Readonly<{
  status: number;
  bodyText: string;
}>;

export interface CandleRetrievalHttpClient {
  request(input: CandleRetrievalHttpRequest): Promise<CandleRetrievalHttpResponse>;
}

/** Candle payloads can be large for wide ranges; keep a bounded read. */
export const MAX_CANDLE_RETRIEVAL_BODY_CHARS = 5_000_000;

export const CANDLE_RETRIEVAL_HTTP_CLIENT = Symbol('CANDLE_RETRIEVAL_HTTP_CLIENT');
export const CANDLE_RETRIEVAL_TIMEOUT_MS = Symbol('CANDLE_RETRIEVAL_TIMEOUT_MS');
export const DEFAULT_CANDLE_RETRIEVAL_TIMEOUT_MS = 30_000;

/**
 * Adapter-only HTTP transport for candlestick retrieval.
 * Not part of the public Market Data domain contract.
 */
@Injectable()
export class FetchCandleRetrievalHttpClient implements CandleRetrievalHttpClient {
  async request(input: CandleRetrievalHttpRequest): Promise<CandleRetrievalHttpResponse> {
    const response = await fetch(input.url, {
      method: input.method,
      headers: input.headers,
      redirect: 'error',
      signal: input.signal,
    });
    const raw = await response.text();
    if (raw.length > MAX_CANDLE_RETRIEVAL_BODY_CHARS) {
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
