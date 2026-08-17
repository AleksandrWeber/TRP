import { createHmac } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { BinanceCapabilityAdapter } from './binance-capability.adapter';
import {
  BINANCE_HANDSHAKE_ORIGIN,
  BINANCE_HANDSHAKE_PATH,
  BINANCE_HANDSHAKE_RECV_WINDOW_MS,
} from './binance-handshake.adapter';
import type { HandshakeHttpRequest, HandshakeHttpResponse } from './exchange-handshake.http';
import { PlannedExchangeCapabilityAdapter } from './planned-capability.adapter';

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

const request = {
  credentials: { apiKey: 'key-one', apiSecret: 'secret-one' },
  nowMs: 1_710_000_000_000,
  signal: new AbortController().signal,
};

describe('Binance capability adapter (W2-S02-d)', () => {
  it('reads API restrictions without requesting balances, orders, or market data', async () => {
    const http = httpMock(async () => ({
      status: 200,
      bodyText: JSON.stringify({
        enableSpotAndMarginTrading: true,
        enableMargin: false,
        enableFutures: true,
        enableWithdrawals: false,
      }),
    }));
    const adapter = new BinanceCapabilityAdapter(http);
    const unsigned = `timestamp=${request.nowMs}&recvWindow=${BINANCE_HANDSHAKE_RECV_WINDOW_MS}`;
    const signature = createHmac('sha256', 'secret-one').update(unsigned).digest('hex');

    await expect(adapter.verify(request)).resolves.toEqual({
      kind: 'verified',
      evidence: {
        spot: true,
        margin: false,
        futures: true,
        withdraw: false,
      },
    });
    expect(http.requests[0]?.url).toBe(
      `${BINANCE_HANDSHAKE_ORIGIN}${BINANCE_HANDSHAKE_PATH}?${unsigned}&signature=${signature}`,
    );
    expect(http.requests[0]?.url).not.toContain('/api/v3/account?');
    expect(http.requests[0]?.url).not.toContain('/api/v3/order');
    expect(http.requests[0]?.url).not.toContain('/api/v3/ticker');
    expect(http.requests[0]?.url).not.toContain('wss://');
    expect(adapter).not.toHaveProperty('balances');
    expect(adapter).not.toHaveProperty('orders');
    expect(adapter).not.toHaveProperty('positions');
  });

  it('maps provider unavailability and malformed bodies without guessing', async () => {
    const unavailable = new BinanceCapabilityAdapter(
      httpMock(async () => ({ status: 503, bodyText: 'upstream unavailable' })),
    );
    await expect(unavailable.verify(request)).resolves.toEqual({ kind: 'provider_unavailable' });

    const malformed = new BinanceCapabilityAdapter(
      httpMock(async () => ({ status: 200, bodyText: 'not-json' })),
    );
    await expect(malformed.verify(request)).resolves.toEqual({ kind: 'failed' });

    const network = new BinanceCapabilityAdapter(
      httpMock(async () => {
        const error = new Error('fetch failed');
        throw error;
      }),
    );
    await expect(network.verify(request)).resolves.toEqual({ kind: 'provider_unavailable' });
  });
});

describe('Planned capability adapters (W2-S02-d)', () => {
  it('returns not implemented for Bybit and OKX', async () => {
    await expect(new PlannedExchangeCapabilityAdapter('BYBIT').verify(request)).resolves.toEqual({
      kind: 'not_implemented',
    });
    await expect(new PlannedExchangeCapabilityAdapter('OKX').verify(request)).resolves.toEqual({
      kind: 'not_implemented',
    });
  });
});
