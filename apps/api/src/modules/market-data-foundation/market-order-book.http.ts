import { Injectable } from '@nestjs/common';

export type OrderBookRetrievalHttpRequest = Readonly<{
  url: string;
  method: 'GET';
  headers?: Readonly<Record<string, string>>;
  signal: AbortSignal;
}>;

export type OrderBookRetrievalHttpResponse = Readonly<{
  status: number;
  bodyText: string;
}>;

export interface OrderBookRetrievalHttpClient {
  request(input: OrderBookRetrievalHttpRequest): Promise<OrderBookRetrievalHttpResponse>;
}

export const MAX_ORDER_BOOK_RETRIEVAL_BODY_CHARS = 1_000_000;

export const ORDER_BOOK_RETRIEVAL_HTTP_CLIENT = Symbol('ORDER_BOOK_RETRIEVAL_HTTP_CLIENT');
export const ORDER_BOOK_RETRIEVAL_TIMEOUT_MS = Symbol('ORDER_BOOK_RETRIEVAL_TIMEOUT_MS');
export const DEFAULT_ORDER_BOOK_RETRIEVAL_TIMEOUT_MS = 15_000;

/**
 * Adapter-only HTTP transport for order book snapshot retrieval.
 * Not part of the public Market Data domain contract.
 */
@Injectable()
export class FetchOrderBookRetrievalHttpClient implements OrderBookRetrievalHttpClient {
  async request(input: OrderBookRetrievalHttpRequest): Promise<OrderBookRetrievalHttpResponse> {
    const response = await fetch(input.url, {
      method: input.method,
      headers: input.headers,
      redirect: 'error',
      signal: input.signal,
    });
    const raw = await response.text();
    if (raw.length > MAX_ORDER_BOOK_RETRIEVAL_BODY_CHARS) {
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
