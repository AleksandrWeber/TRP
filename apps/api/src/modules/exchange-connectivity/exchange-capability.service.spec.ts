import { describe, expect, it } from 'vitest';
import { Role } from '../identity/role';
import { BinanceCapabilityAdapter } from './binance-capability.adapter';
import { ExchangeCapabilityAudit } from './exchange-capability.audit';
import { ExchangeCapabilityCache } from './exchange-capability.cache';
import { ExchangeCapabilityService } from './exchange-capability.service';
import type { HandshakeHttpRequest, HandshakeHttpResponse } from './exchange-handshake.http';
import { PlannedExchangeCapabilityAdapter } from './planned-capability.adapter';

function memoryVault(options?: { secretId?: string }) {
  const retrieveCalls: Array<{ workspaceId: string; type: string }> = [];
  return {
    retrieveCalls,
    get: async () => ({ id: options?.secretId ?? 'vault-secret-1' }),
    retrieve: async (query: { workspaceId: string; type: string }) => {
      retrieveCalls.push({ workspaceId: query.workspaceId, type: query.type });
      return { apiKey: 'key-one', apiSecret: 'secret-one' };
    },
  };
}

function memoryAudit() {
  const events: Array<{ outcome: string; payload: Record<string, unknown> }> = [];
  return {
    events,
    record: async (write: { outcome: string; payload: Record<string, unknown> }) => {
      events.push({ outcome: write.outcome, payload: write.payload });
    },
  };
}

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

function serviceFor(
  vault: ReturnType<typeof memoryVault>,
  audit: ReturnType<typeof memoryAudit>,
  http: ReturnType<typeof httpMock>,
  cache = new ExchangeCapabilityCache(),
) {
  return new ExchangeCapabilityService(
    vault as never,
    new ExchangeCapabilityAudit(audit as never),
    cache,
    [
      new BinanceCapabilityAdapter(http),
      new PlannedExchangeCapabilityAdapter('BYBIT'),
      new PlannedExchangeCapabilityAdapter('OKX'),
    ],
    10_000,
    { nowMs: () => Date.parse('2026-08-17T19:00:00.000Z') },
  );
}

const request = {
  workspaceId: 'workspace-a',
  actorUserId: 'operator-a',
  actorRole: Role.Trader,
  connectionId: 'connection-a',
  provider: 'BINANCE',
  vaultSecretId: 'vault-secret-1',
  handshakeSucceeded: true,
} as const;

describe('ExchangeCapabilityService (W2-S02-d)', () => {
  it('does not verify before authenticated handshake succeeds', async () => {
    const vault = memoryVault();
    const audit = memoryAudit();
    const http = httpMock(async () => ({ status: 200, bodyText: '{}' }));
    const capabilities = serviceFor(vault, audit, http);

    await expect(
      capabilities.verify({ ...request, handshakeSucceeded: false }),
    ).resolves.toBeNull();
    expect(vault.retrieveCalls).toEqual([]);
    expect(http.requests).toEqual([]);
    expect(audit.events).toEqual([]);
    expect(
      capabilities.projection('workspace-a', 'connection-a', 'EXCHANGE', 'CONNECTED'),
    ).toBeNull();
  });

  it('verifies Binance restrictions after handshake and caches the session-scoped projection', async () => {
    const vault = memoryVault();
    const audit = memoryAudit();
    const http = httpMock(async () => ({
      status: 200,
      bodyText: JSON.stringify({
        enableSpotAndMarginTrading: true,
        enableMargin: false,
        enableFutures: false,
        enableWithdrawals: false,
      }),
    }));
    const capabilities = serviceFor(vault, audit, http);

    const view = await capabilities.verify(request);

    expect(view?.verificationFailed).toBe(false);
    expect(view?.verifiedAt).toBe('2026-08-17T19:00:00.000Z');
    expect(view?.capabilities).toEqual(
      expect.arrayContaining([
        { capability: 'SPOT', state: 'SUPPORTED' },
        { capability: 'MARGIN', state: 'UNAVAILABLE' },
        { capability: 'FUTURES', state: 'UNAVAILABLE' },
        { capability: 'REST', state: 'SUPPORTED' },
        { capability: 'WEBSOCKET', state: 'UNKNOWN' },
        { capability: 'TESTNET', state: 'UNKNOWN' },
        { capability: 'DEPOSIT', state: 'UNKNOWN' },
        { capability: 'WITHDRAW', state: 'UNAVAILABLE' },
      ]),
    );
    expect(http.requests[0]?.url).toContain('/sapi/v1/account/apiRestrictions');
    expect(http.requests[0]?.url).not.toContain('/api/v3/account');
    expect(http.requests[0]?.url).not.toContain('/order');
    expect(http.requests[0]?.url).not.toContain('/ticker');
    expect(audit.events.map((event) => event.outcome)).toEqual([
      'capability_verification_started',
      'capability_verification_completed',
    ]);
    expect(capabilities.projection('workspace-a', 'connection-a', 'EXCHANGE', 'CONNECTED')).toEqual(
      view,
    );
    expect(
      capabilities.projection('workspace-b', 'connection-a', 'EXCHANGE', 'CONNECTED'),
    ).toBeNull();
    expect(
      capabilities.projection('workspace-a', 'connection-a', 'EXCHANGE', 'DISCONNECTED'),
    ).toBeNull();
    expect(capabilities.capabilityUseEnabled()).toBe(false);
    expect(JSON.stringify(view)).not.toMatch(/key-one|secret-one|apiKey|apiSecret/);
  });

  it('keeps verification failure honest without inventing supported capabilities', async () => {
    const vault = memoryVault();
    const audit = memoryAudit();
    const http = httpMock(async () => ({ status: 503, bodyText: 'unavailable' }));
    const capabilities = serviceFor(vault, audit, http);

    const view = await capabilities.verify(request);

    expect(view?.verificationFailed).toBe(true);
    expect(view?.capabilities.find((item) => item.capability === 'REST')?.state).toBe('SUPPORTED');
    expect(view?.capabilities.find((item) => item.capability === 'SPOT')?.state).toBe(
      'VERIFICATION_FAILED',
    );
    expect(audit.events.map((event) => event.outcome)).toEqual([
      'capability_verification_started',
      'capability_verification_failed',
    ]);
    expect(capabilities.projection('workspace-a', 'connection-a', 'EXCHANGE', 'CONNECTED')).toEqual(
      view,
    );
  });

  it('clears the session-scoped cache and does not leak across workspaces', async () => {
    const cache = new ExchangeCapabilityCache();
    const capabilities = serviceFor(
      memoryVault(),
      memoryAudit(),
      httpMock(async () => ({
        status: 200,
        bodyText: '{"enableSpotAndMarginTrading":true}',
      })),
      cache,
    );
    await capabilities.verify(request);
    expect(cache.get('workspace-a', 'connection-a')).not.toBeNull();
    capabilities.clear('workspace-a', 'connection-a');
    expect(cache.get('workspace-a', 'connection-a')).toBeNull();
    expect(cache.get('workspace-b', 'connection-a')).toBeNull();
  });
});
