import { Injectable } from '@nestjs/common';

export type HandshakeHttpRequest = Readonly<{
  url: string;
  method: 'GET';
  headers: Readonly<Record<string, string>>;
  signal: AbortSignal;
}>;

export type HandshakeHttpResponse = Readonly<{
  status: number;
  bodyText: string;
}>;

export interface HandshakeHttpClient {
  request(input: HandshakeHttpRequest): Promise<HandshakeHttpResponse>;
}

const MAX_ERROR_BODY_CHARS = 512;

/**
 * Shared HTTP transport for handshake adapters. Adapters own URL, headers, and
 * query format. This client never logs bodies and truncates error text so
 * provider payloads cannot leak into later mapping beyond a status code.
 */
@Injectable()
export class FetchHandshakeHttpClient implements HandshakeHttpClient {
  async request(input: HandshakeHttpRequest): Promise<HandshakeHttpResponse> {
    const response = await fetch(input.url, {
      method: input.method,
      headers: input.headers,
      redirect: 'error',
      signal: input.signal,
    });
    const raw = await response.text();
    return {
      status: response.status,
      bodyText: raw.slice(0, MAX_ERROR_BODY_CHARS),
    };
  }
}
