/**
 * V3-L02-S-ADP1 — Venue request builders (paths + signing).
 * Hosts come only from EG1 allowlist via LiveVenueEgressHttpClient.
 * No user-controlled URLs. No deposits/withdrawals/transfers.
 */

import { createHmac, createHash } from 'node:crypto';
import type { LiveVenueId } from '../live-venue-egress/live-venue-allowlist';
import type { TradingCredentialEnvironment } from '../live-venue-egress/trading-credential-environment';
import type { SecretFieldMap } from '../../secret-vault/secret-material';

export type LiveVenueSignedRequest = Readonly<{
  method: 'GET' | 'POST' | 'DELETE';
  pathAndQuery: string;
  headers: Readonly<Record<string, string>>;
  body?: string;
}>;

export type BuildLiveOrderRequestInput = Readonly<{
  venue: LiveVenueId;
  tradingEnvironment: TradingCredentialEnvironment;
  clientOrderId: string;
  instrument: string;
  side: 'buy' | 'sell';
  type: 'market' | 'limit';
  quantity: string;
  limitPrice: string | null;
  credentials: SecretFieldMap;
  okxDemoHeaders: Readonly<Record<string, string>> | null;
  operation: 'submit' | 'cancel' | 'query';
  adapterOrderId?: string | null;
}>;

export function buildLiveVenueOrderRequest(
  input: BuildLiveOrderRequestInput,
): LiveVenueSignedRequest {
  if (input.venue === 'BINANCE') return buildBinance(input);
  if (input.venue === 'BYBIT') return buildBybit(input);
  return buildOkx(input);
}

function requireField(fields: SecretFieldMap, name: string): string {
  const value = fields[name]?.trim();
  if (!value) throw new Error(`live_credential_missing_field`);
  return value;
}

function buildBinance(input: BuildLiveOrderRequestInput): LiveVenueSignedRequest {
  const apiKey = requireField(input.credentials, 'apiKey');
  const apiSecret = requireField(input.credentials, 'apiSecret');
  const timestamp = Date.now().toString();

  if (input.operation === 'submit') {
    const params = new URLSearchParams({
      symbol: normalizeBinanceSymbol(input.instrument),
      side: input.side.toUpperCase(),
      type: input.type.toUpperCase(),
      quantity: input.quantity,
      newClientOrderId: input.clientOrderId,
      timestamp,
    });
    if (input.type === 'limit') {
      if (!input.limitPrice) throw new Error('live_limit_price_required');
      params.set('price', input.limitPrice);
      params.set('timeInForce', 'GTC');
    }
    const signature = signHmac(apiSecret, params.toString());
    params.set('signature', signature);
    return Object.freeze({
      method: 'POST',
      pathAndQuery: `/api/v3/order?${params.toString()}`,
      headers: Object.freeze({ 'X-MBX-APIKEY': apiKey }),
    });
  }

  if (input.operation === 'cancel') {
    const params = new URLSearchParams({
      symbol: normalizeBinanceSymbol(input.instrument),
      origClientOrderId: input.clientOrderId,
      timestamp,
    });
    if (input.adapterOrderId) params.set('orderId', input.adapterOrderId);
    const signature = signHmac(apiSecret, params.toString());
    params.set('signature', signature);
    return Object.freeze({
      method: 'DELETE',
      pathAndQuery: `/api/v3/order?${params.toString()}`,
      headers: Object.freeze({ 'X-MBX-APIKEY': apiKey }),
    });
  }

  const params = new URLSearchParams({
    symbol: normalizeBinanceSymbol(input.instrument),
    origClientOrderId: input.clientOrderId,
    timestamp,
  });
  if (input.adapterOrderId) params.set('orderId', input.adapterOrderId);
  const signature = signHmac(apiSecret, params.toString());
  params.set('signature', signature);
  return Object.freeze({
    method: 'GET',
    pathAndQuery: `/api/v3/order?${params.toString()}`,
    headers: Object.freeze({ 'X-MBX-APIKEY': apiKey }),
  });
}

function buildBybit(input: BuildLiveOrderRequestInput): LiveVenueSignedRequest {
  const apiKey = requireField(input.credentials, 'apiKey');
  const apiSecret = requireField(input.credentials, 'apiSecret');
  const timestamp = Date.now().toString();
  const recvWindow = '5000';

  if (input.operation === 'submit') {
    const body = JSON.stringify({
      category: 'spot',
      symbol: normalizeBybitSymbol(input.instrument),
      side: input.side === 'buy' ? 'Buy' : 'Sell',
      orderType: input.type === 'market' ? 'Market' : 'Limit',
      qty: input.quantity,
      orderLinkId: input.clientOrderId,
      ...(input.type === 'limit' ? { price: input.limitPrice } : {}),
    });
    const payload = `${timestamp}${apiKey}${recvWindow}${body}`;
    const sign = signHmac(apiSecret, payload);
    return Object.freeze({
      method: 'POST',
      pathAndQuery: '/v5/order/create',
      body,
      headers: Object.freeze({
        'Content-Type': 'application/json',
        'X-BAPI-API-KEY': apiKey,
        'X-BAPI-SIGN': sign,
        'X-BAPI-TIMESTAMP': timestamp,
        'X-BAPI-RECV-WINDOW': recvWindow,
      }),
    });
  }

  if (input.operation === 'cancel') {
    const body = JSON.stringify({
      category: 'spot',
      symbol: normalizeBybitSymbol(input.instrument),
      orderLinkId: input.clientOrderId,
      ...(input.adapterOrderId ? { orderId: input.adapterOrderId } : {}),
    });
    const payload = `${timestamp}${apiKey}${recvWindow}${body}`;
    const sign = signHmac(apiSecret, payload);
    return Object.freeze({
      method: 'POST',
      pathAndQuery: '/v5/order/cancel',
      body,
      headers: Object.freeze({
        'Content-Type': 'application/json',
        'X-BAPI-API-KEY': apiKey,
        'X-BAPI-SIGN': sign,
        'X-BAPI-TIMESTAMP': timestamp,
        'X-BAPI-RECV-WINDOW': recvWindow,
      }),
    });
  }

  const query = new URLSearchParams({
    category: 'spot',
    symbol: normalizeBybitSymbol(input.instrument),
    orderLinkId: input.clientOrderId,
  });
  if (input.adapterOrderId) query.set('orderId', input.adapterOrderId);
  const queryString = query.toString();
  const payload = `${timestamp}${apiKey}${recvWindow}${queryString}`;
  const sign = signHmac(apiSecret, payload);
  return Object.freeze({
    method: 'GET',
    pathAndQuery: `/v5/order/realtime?${queryString}`,
    headers: Object.freeze({
      'X-BAPI-API-KEY': apiKey,
      'X-BAPI-SIGN': sign,
      'X-BAPI-TIMESTAMP': timestamp,
      'X-BAPI-RECV-WINDOW': recvWindow,
    }),
  });
}

function buildOkx(input: BuildLiveOrderRequestInput): LiveVenueSignedRequest {
  const apiKey = requireField(input.credentials, 'apiKey');
  const apiSecret = requireField(input.credentials, 'apiSecret');
  const passphrase = requireField(input.credentials, 'passphrase');
  const timestamp = new Date().toISOString();
  const demoHeaders = input.okxDemoHeaders ?? {};

  if (input.operation === 'submit') {
    const body = JSON.stringify({
      instId: normalizeOkxSymbol(input.instrument),
      tdMode: 'cash',
      side: input.side,
      ordType: input.type === 'market' ? 'market' : 'limit',
      sz: input.quantity,
      clOrdId: input.clientOrderId,
      ...(input.type === 'limit' ? { px: input.limitPrice } : {}),
    });
    const path = '/api/v5/trade/order';
    const prehash = `${timestamp}POST${path}${body}`;
    const sign = signHmacBase64(apiSecret, prehash);
    return Object.freeze({
      method: 'POST',
      pathAndQuery: path,
      body,
      headers: Object.freeze({
        'Content-Type': 'application/json',
        'OK-ACCESS-KEY': apiKey,
        'OK-ACCESS-SIGN': sign,
        'OK-ACCESS-TIMESTAMP': timestamp,
        'OK-ACCESS-PASSPHRASE': passphrase,
        ...demoHeaders,
      }),
    });
  }

  if (input.operation === 'cancel') {
    const body = JSON.stringify({
      instId: normalizeOkxSymbol(input.instrument),
      clOrdId: input.clientOrderId,
      ...(input.adapterOrderId ? { ordId: input.adapterOrderId } : {}),
    });
    const path = '/api/v5/trade/cancel-order';
    const prehash = `${timestamp}POST${path}${body}`;
    const sign = signHmacBase64(apiSecret, prehash);
    return Object.freeze({
      method: 'POST',
      pathAndQuery: path,
      body,
      headers: Object.freeze({
        'Content-Type': 'application/json',
        'OK-ACCESS-KEY': apiKey,
        'OK-ACCESS-SIGN': sign,
        'OK-ACCESS-TIMESTAMP': timestamp,
        'OK-ACCESS-PASSPHRASE': passphrase,
        ...demoHeaders,
      }),
    });
  }

  const query = new URLSearchParams({
    instId: normalizeOkxSymbol(input.instrument),
    clOrdId: input.clientOrderId,
  });
  if (input.adapterOrderId) query.set('ordId', input.adapterOrderId);
  const path = `/api/v5/trade/order?${query.toString()}`;
  const prehash = `${timestamp}GET${path}`;
  const sign = signHmacBase64(apiSecret, prehash);
  return Object.freeze({
    method: 'GET',
    pathAndQuery: path,
    headers: Object.freeze({
      'OK-ACCESS-KEY': apiKey,
      'OK-ACCESS-SIGN': sign,
      'OK-ACCESS-TIMESTAMP': timestamp,
      'OK-ACCESS-PASSPHRASE': passphrase,
      ...demoHeaders,
    }),
  });
}

function signHmac(secret: string, payload: string): string {
  return createHmac('sha256', secret).update(payload).digest('hex');
}

function signHmacBase64(secret: string, payload: string): string {
  return createHmac('sha256', secret).update(payload).digest('base64');
}

function normalizeBinanceSymbol(instrument: string): string {
  return instrument.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
}

function normalizeBybitSymbol(instrument: string): string {
  return instrument.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
}

function normalizeOkxSymbol(instrument: string): string {
  const cleaned = instrument.toUpperCase().replace(/_/g, '-');
  if (cleaned.includes('-')) return cleaned;
  // BTCUSDT → BTC-USDT heuristic for tests
  if (cleaned.endsWith('USDT')) return `${cleaned.slice(0, -4)}-USDT`;
  return cleaned;
}

export function liveExecutionContextHash(parts: {
  venue: string;
  environment: string;
  clientOrderId: string;
  intentHash: string;
}): string {
  return createHash('sha256')
    .update(
      JSON.stringify({
        venue: parts.venue,
        environment: parts.environment,
        clientOrderId: parts.clientOrderId,
        intentHash: parts.intentHash,
      }),
    )
    .digest('hex');
}
