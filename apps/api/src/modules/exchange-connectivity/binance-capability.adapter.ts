import { Inject, Injectable } from '@nestjs/common';
import { createHmac } from 'node:crypto';
import {
  BINANCE_HANDSHAKE_ORIGIN,
  BINANCE_HANDSHAKE_PATH,
  BINANCE_HANDSHAKE_RECV_WINDOW_MS,
} from './binance-handshake.adapter';
import type {
  ExchangeCapabilityAdapter,
  ExchangeCapabilityAdapterEvidence,
  ExchangeCapabilityAdapterRequest,
  ExchangeCapabilityAdapterResult,
} from './exchange-capability.adapter';
import {
  isAbortError,
  isNetworkError,
  mapHandshakeHttpFailure,
  readProviderErrorCode,
} from './exchange-handshake.errors';
import { type HandshakeHttpClient } from './exchange-handshake.http';
import { HANDSHAKE_HTTP_CLIENT } from './exchange-handshake.tokens';

/**
 * Binance capability verification.
 *
 * Reuses GET /sapi/v1/account/apiRestrictions after handshake. That endpoint
 * reports API-key restrictions. It does not request balances, orders,
 * positions, or market data, and it does not open a WebSocket.
 */
@Injectable()
export class BinanceCapabilityAdapter implements ExchangeCapabilityAdapter {
  readonly providerId = 'BINANCE';
  readonly implemented = true;

  constructor(
    @Inject(HANDSHAKE_HTTP_CLIENT)
    private readonly http: HandshakeHttpClient,
  ) {}

  async verify(
    request: ExchangeCapabilityAdapterRequest,
  ): Promise<ExchangeCapabilityAdapterResult> {
    const apiKey = request.credentials.apiKey?.trim() ?? '';
    const apiSecret = request.credentials.apiSecret?.trim() ?? '';
    if (apiKey === '' || apiSecret === '') {
      return { kind: 'failed' };
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
        const evidence = readRestrictionEvidence(response.bodyText);
        if (evidence === null) {
          return { kind: 'failed' };
        }
        return { kind: 'verified', evidence };
      }
      const failure = mapHandshakeHttpFailure(
        response.status,
        readProviderErrorCode(response.bodyText),
      );
      if (failure === 'provider_unavailable') {
        return { kind: 'provider_unavailable' };
      }
      return { kind: 'failed' };
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

function readRestrictionEvidence(bodyText: string): ExchangeCapabilityAdapterEvidence | null {
  try {
    const parsed = JSON.parse(bodyText) as Record<string, unknown>;
    if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return null;
    }
    return {
      spot: readBoolean(parsed.enableSpotAndMarginTrading),
      margin: readBoolean(parsed.enableMargin),
      futures: readBoolean(parsed.enableFutures),
      withdraw: readBoolean(parsed.enableWithdrawals),
    };
  } catch {
    return null;
  }
}

function readBoolean(value: unknown): boolean | undefined {
  return typeof value === 'boolean' ? value : undefined;
}
