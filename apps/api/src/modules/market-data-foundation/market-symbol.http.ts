import { Injectable } from '@nestjs/common';

export type SymbolDiscoveryHttpRequest = Readonly<{
  url: string;
  method: 'GET';
  headers?: Readonly<Record<string, string>>;
  signal: AbortSignal;
}>;

export type SymbolDiscoveryHttpResponse = Readonly<{
  status: number;
  bodyText: string;
}>;

export interface SymbolDiscoveryHttpClient {
  request(input: SymbolDiscoveryHttpRequest): Promise<SymbolDiscoveryHttpResponse>;
}

/** Symbol lists are large; cap to bound memory without truncating valid payloads mid-JSON. */
export const MAX_SYMBOL_DISCOVERY_BODY_CHARS = 15_000_000;

export const SYMBOL_DISCOVERY_HTTP_CLIENT = Symbol('SYMBOL_DISCOVERY_HTTP_CLIENT');
export const SYMBOL_DISCOVERY_TIMEOUT_MS = Symbol('SYMBOL_DISCOVERY_TIMEOUT_MS');
export const DEFAULT_SYMBOL_DISCOVERY_TIMEOUT_MS = 30_000;

/**
 * Adapter-only HTTP transport for symbol discovery.
 * Not part of the public Market Data domain contract.
 */
@Injectable()
export class FetchSymbolDiscoveryHttpClient implements SymbolDiscoveryHttpClient {
  async request(input: SymbolDiscoveryHttpRequest): Promise<SymbolDiscoveryHttpResponse> {
    const response = await fetch(input.url, {
      method: input.method,
      headers: input.headers,
      redirect: 'error',
      signal: input.signal,
    });
    const raw = await response.text();
    if (raw.length > MAX_SYMBOL_DISCOVERY_BODY_CHARS) {
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
