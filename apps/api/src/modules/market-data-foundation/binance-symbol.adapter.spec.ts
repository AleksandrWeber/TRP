import { describe, expect, it } from 'vitest';
import { BinanceSymbolDiscoveryAdapter, parseBinanceExchangeInfo } from './binance-symbol.adapter';
import { PlannedSymbolDiscoveryAdapter } from './planned-symbol.adapter';
import type { SymbolDiscoveryHttpRequest, SymbolDiscoveryHttpResponse } from './market-symbol.http';

function httpMock(
  handler: (request: SymbolDiscoveryHttpRequest) => Promise<SymbolDiscoveryHttpResponse>,
) {
  const requests: SymbolDiscoveryHttpRequest[] = [];
  return {
    requests,
    request: async (input: SymbolDiscoveryHttpRequest) => {
      requests.push(input);
      return handler(input);
    },
  };
}

describe('Binance symbol discovery mapping (W2-S03-b)', () => {
  it('maps exchangeInfo symbols without prices or book fields', async () => {
    const http = httpMock(async () => ({
      status: 200,
      bodyText: JSON.stringify({
        symbols: [
          {
            symbol: 'BTCUSDT',
            status: 'TRADING',
            baseAsset: 'BTC',
            quoteAsset: 'USDT',
            filters: [{ filterType: 'PRICE_FILTER' }],
          },
        ],
      }),
    }));
    const adapter = new BinanceSymbolDiscoveryAdapter(http);

    const result = await adapter.discover({
      nowMs: 1,
      signal: new AbortController().signal,
    });

    expect(result).toEqual({
      kind: 'discovered',
      definitions: [
        {
          exchangeSymbol: 'BTCUSDT',
          baseAsset: 'BTC',
          quoteAsset: 'USDT',
          tradingStatus: 'TRADING',
        },
      ],
    });
    expect(http.requests[0]?.url).toContain('/api/v3/exchangeInfo');
    expect(http.requests[0]?.url).not.toContain('/ticker');
    expect(http.requests[0]?.url).not.toContain('/klines');
    expect(http.requests[0]?.url).not.toContain('/depth');
    expect(JSON.stringify(result)).not.toMatch(/lastPrice|bidPrice|askPrice|openPrice/);
  });

  it('rejects malformed exchangeInfo payloads', () => {
    expect(parseBinanceExchangeInfo('{')).toBeNull();
    expect(parseBinanceExchangeInfo('[]')).toBeNull();
    expect(
      parseBinanceExchangeInfo(JSON.stringify({ symbols: [{ symbol: 'BTCUSDT' }] })),
    ).toBeNull();
  });

  it('maps provider unavailable and planned providers honestly', async () => {
    const unavailable = new BinanceSymbolDiscoveryAdapter(
      httpMock(async () => ({ status: 503, bodyText: 'unavailable' })),
    );
    await expect(
      unavailable.discover({ nowMs: 1, signal: new AbortController().signal }),
    ).resolves.toEqual({ kind: 'provider_unavailable' });

    const bybit = new PlannedSymbolDiscoveryAdapter('BYBIT');
    const okx = new PlannedSymbolDiscoveryAdapter('OKX');
    expect(bybit.implemented).toBe(false);
    expect(okx.implemented).toBe(false);
    await expect(
      bybit.discover({ nowMs: 1, signal: new AbortController().signal }),
    ).resolves.toEqual({ kind: 'not_implemented' });
  });
});
