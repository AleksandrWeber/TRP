import { Inject, Injectable } from '@nestjs/common';
import type {
  MarketSymbolDiscoveryAdapter,
  MarketSymbolDiscoveryAdapterRequest,
  MarketSymbolDiscoveryAdapterResult,
} from './market-symbol.discovery';
import type { ProviderSymbolDefinition } from './market-symbol';
import { SYMBOL_DISCOVERY_HTTP_CLIENT, type SymbolDiscoveryHttpClient } from './market-symbol.http';

export const BINANCE_SYMBOL_DISCOVERY_ORIGIN = 'https://api.binance.com';
export const BINANCE_SYMBOL_DISCOVERY_PATH = '/api/v3/exchangeInfo';

/**
 * Binance symbol discovery adapter.
 *
 * Reads public exchangeInfo. That endpoint lists tradable symbols and does not
 * return ticker, candles, order book, balances, or positions. It does not open
 * a streaming socket. Transport choice stays inside this adapter.
 */
@Injectable()
export class BinanceSymbolDiscoveryAdapter implements MarketSymbolDiscoveryAdapter {
  readonly providerId = 'BINANCE';
  readonly implemented = true;

  constructor(
    @Inject(SYMBOL_DISCOVERY_HTTP_CLIENT)
    private readonly http: SymbolDiscoveryHttpClient,
  ) {}

  async discover(
    request: MarketSymbolDiscoveryAdapterRequest,
  ): Promise<MarketSymbolDiscoveryAdapterResult> {
    const url = `${BINANCE_SYMBOL_DISCOVERY_ORIGIN}${BINANCE_SYMBOL_DISCOVERY_PATH}`;

    try {
      const response = await this.http.request({
        url,
        method: 'GET',
        signal: request.signal,
      });
      if (response.status === 418 || response.status === 429 || response.status >= 500) {
        return { kind: 'provider_unavailable' };
      }
      if (response.status !== 200) {
        return { kind: 'failed' };
      }
      if (response.bodyText.trim() === '') {
        return { kind: 'malformed' };
      }
      const definitions = parseBinanceExchangeInfo(response.bodyText);
      if (definitions === null) {
        return { kind: 'malformed' };
      }
      return { kind: 'discovered', definitions };
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

export function parseBinanceExchangeInfo(
  bodyText: string,
): readonly ProviderSymbolDefinition[] | null {
  try {
    const parsed = JSON.parse(bodyText) as unknown;
    if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return null;
    }
    const symbols = (parsed as { symbols?: unknown }).symbols;
    if (!Array.isArray(symbols)) {
      return null;
    }
    const definitions: ProviderSymbolDefinition[] = [];
    for (const entry of symbols) {
      if (entry === null || typeof entry !== 'object' || Array.isArray(entry)) {
        return null;
      }
      const row = entry as Record<string, unknown>;
      if (
        typeof row.symbol !== 'string' ||
        typeof row.baseAsset !== 'string' ||
        typeof row.quoteAsset !== 'string' ||
        typeof row.status !== 'string'
      ) {
        return null;
      }
      definitions.push({
        exchangeSymbol: row.symbol,
        baseAsset: row.baseAsset,
        quoteAsset: row.quoteAsset,
        tradingStatus: row.status,
      });
    }
    return Object.freeze(definitions);
  } catch {
    return null;
  }
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
