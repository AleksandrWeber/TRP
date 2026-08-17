import { createHmac } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import {
  BINANCE_HANDSHAKE_ORIGIN,
  BINANCE_HANDSHAKE_PATH,
  BINANCE_HANDSHAKE_RECV_WINDOW_MS,
  BinanceHandshakeAdapter,
} from './binance-handshake.adapter';
import type { HandshakeHttpRequest, HandshakeHttpResponse } from './exchange-handshake.http';
import { PlannedExchangeHandshakeAdapter } from './planned-handshake.adapter';

function httpMock(handler: (request: HandshakeHttpRequest) => Promise<HandshakeHttpResponse>) {
  const requests: HandshakeHttpRequest[] = [];
  return {
    requests,
    request: async (input: HandshakeHttpRequest) => {
      requests.push(input);
      return handler(input);
    },
  };
}

describe('Exchange provider adapter abstraction (W2-S02-b)', () => {
  it('exposes only handshake on the adapter contract', () => {
    const binance = new BinanceHandshakeAdapter(
      httpMock(async () => ({ status: 200, bodyText: '{}' })),
    );
    const bybit = new PlannedExchangeHandshakeAdapter('BYBIT');

    expect(binance).toHaveProperty('handshake');
    expect(binance).not.toHaveProperty('balances');
    expect(binance).not.toHaveProperty('orders');
    expect(binance).not.toHaveProperty('positions');
    expect(binance).not.toHaveProperty('subscribe');
    expect(bybit).not.toHaveProperty('connect');
  });
});

describe('Binance handshake adapter (W2-S02-b)', () => {
  it('sends a signed API-restriction request and treats HTTP 200 as authenticated', async () => {
    const http = httpMock(async () => ({ status: 200, bodyText: '{"enableReading":true}' }));
    const adapter = new BinanceHandshakeAdapter(http);
    const nowMs = 1_710_000_000_000;
    const unsigned = `timestamp=${nowMs}&recvWindow=${BINANCE_HANDSHAKE_RECV_WINDOW_MS}`;
    const signature = createHmac('sha256', 'secret-one').update(unsigned).digest('hex');

    await expect(
      adapter.handshake({
        credentials: { apiKey: 'key-one', apiSecret: 'secret-one' },
        nowMs,
        signal: new AbortController().signal,
      }),
    ).resolves.toEqual({ kind: 'authenticated' });

    expect(http.requests).toEqual([
      {
        url: `${BINANCE_HANDSHAKE_ORIGIN}${BINANCE_HANDSHAKE_PATH}?${unsigned}&signature=${signature}`,
        method: 'GET',
        headers: { 'X-MBX-APIKEY': 'key-one' },
        signal: expect.any(AbortSignal),
      },
    ]);
    expect(http.requests[0]?.url).not.toContain('/api/v3/account?');
    expect(http.requests[0]?.url).not.toContain('/api/v3/order');
    expect(http.requests[0]?.url).not.toContain('/api/v3/ticker');
    expect(http.requests[0]?.url).not.toContain('wss://');
  });

  it('maps authentication, unavailability, and timeout without exposing the provider body', async () => {
    const adapter401 = new BinanceHandshakeAdapter(
      httpMock(async () => ({ status: 401, bodyText: '{"code":-2015,"msg":"Invalid API-key"}' })),
    );
    await expect(
      adapter401.handshake({
        credentials: { apiKey: 'key-one', apiSecret: 'secret-one' },
        nowMs: 1,
        signal: new AbortController().signal,
      }),
    ).resolves.toEqual({ kind: 'authentication_failed' });

    const adapter5xx = new BinanceHandshakeAdapter(
      httpMock(async () => ({ status: 503, bodyText: 'upstream unavailable' })),
    );
    await expect(
      adapter5xx.handshake({
        credentials: { apiKey: 'key-one', apiSecret: 'secret-one' },
        nowMs: 1,
        signal: new AbortController().signal,
      }),
    ).resolves.toEqual({ kind: 'provider_unavailable' });

    const adapterTimeout = new BinanceHandshakeAdapter(
      httpMock(async () => {
        const error = new Error('aborted');
        error.name = 'AbortError';
        throw error;
      }),
    );
    await expect(
      adapterTimeout.handshake({
        credentials: { apiKey: 'key-one', apiSecret: 'secret-one' },
        nowMs: 1,
        signal: new AbortController().signal,
      }),
    ).resolves.toEqual({ kind: 'timeout' });
  });
});

describe('Planned handshake adapters (W2-S02-b)', () => {
  it('returns not implemented for Bybit and OKX', async () => {
    const request = {
      credentials: { apiKey: 'key-one', apiSecret: 'secret-one' },
      nowMs: 1,
      signal: new AbortController().signal,
    };
    await expect(new PlannedExchangeHandshakeAdapter('BYBIT').handshake(request)).resolves.toEqual({
      kind: 'not_implemented',
    });
    await expect(new PlannedExchangeHandshakeAdapter('OKX').handshake(request)).resolves.toEqual({
      kind: 'not_implemented',
    });
  });
});
