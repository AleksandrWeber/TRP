import { Inject, Injectable } from '@nestjs/common';
import { createHmac } from 'node:crypto';
import {
  isAbortError,
  isNetworkError,
  mapHandshakeHttpFailure,
  readProviderErrorCode,
} from './exchange-handshake.errors';
import { type HandshakeHttpClient } from './exchange-handshake.http';
import { HANDSHAKE_HTTP_CLIENT } from './exchange-handshake.tokens';
import type {
  ExchangeHandshakeAdapterRequest,
  ExchangeHandshakeAdapterResult,
  ExchangeProviderAdapter,
} from './exchange-provider-adapter';

export const BINANCE_HANDSHAKE_PATH = '/sapi/v1/account/apiRestrictions';
export const BINANCE_HANDSHAKE_ORIGIN = 'https://api.binance.com';
export const BINANCE_HANDSHAKE_RECV_WINDOW_MS = 5_000;

/**
 * Binance authenticated handshake.
 *
 * Signs GET /sapi/v1/account/apiRestrictions. That endpoint proves the API key
 * is accepted. It does not request balances, orders, positions, or market data,
 * and it does not open a WebSocket.
 */
@Injectable()
export class BinanceHandshakeAdapter implements ExchangeProviderAdapter {
  readonly providerId = 'BINANCE';
  readonly implemented = true;

  constructor(
    @Inject(HANDSHAKE_HTTP_CLIENT)
    private readonly http: HandshakeHttpClient,
  ) {}

  async handshake(
    request: ExchangeHandshakeAdapterRequest,
  ): Promise<ExchangeHandshakeAdapterResult> {
    const apiKey = request.credentials.apiKey?.trim() ?? '';
    const apiSecret = request.credentials.apiSecret?.trim() ?? '';
    if (apiKey === '' || apiSecret === '') {
      return { kind: 'authentication_failed' };
    }

    const unsigned = `timestamp=${request.nowMs}&recvWindow=${BINANCE_HANDSHAKE_RECV_WINDOW_MS}`;
    const signature = createHmac('sha256', apiSecret).update(unsigned).digest('hex');
    const url = `${BINANCE_HANDSHAKE_ORIGIN}${BINANCE_HANDSHAKE_PATH}?${unsigned}&signature=${signature}`;

    try {
      const response = await this.http.request({
        url,
        method: 'GET',
        headers: { 'X-MBX-APIKEY': apiKey },
        signal: request.signal,
      });
      if (response.status === 200) {
        return { kind: 'authenticated' };
      }
      return {
        kind: mapHandshakeHttpFailure(response.status, readProviderErrorCode(response.bodyText)),
      };
    } catch (error) {
      if (isAbortError(error)) {
        return { kind: 'timeout' };
      }
      if (isNetworkError(error)) {
        return { kind: 'provider_unavailable' };
      }
      return { kind: 'failed' };
    }
  }
}
