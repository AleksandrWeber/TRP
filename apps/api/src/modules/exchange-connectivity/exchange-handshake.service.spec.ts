import { describe, expect, it } from 'vitest';
import { Role } from '../identity/role';
import { BinanceHandshakeAdapter } from './binance-handshake.adapter';
import { ExchangeHandshakeAudit } from './exchange-handshake.audit';
import { ExchangeHandshakeService } from './exchange-handshake.service';
import type { HandshakeHttpRequest, HandshakeHttpResponse } from './exchange-handshake.http';
import { PlannedExchangeHandshakeAdapter } from './planned-handshake.adapter';

function memoryVault(options?: {
  secretId?: string;
  fields?: Record<string, string>;
  retrieve?: (query: { workspaceId: string; type: string }) => Promise<Record<string, string>>;
}) {
  const retrieveCalls: Array<{ workspaceId: string; type: string; actorUserId: string }> = [];
  return {
    retrieveCalls,
    get: async () => ({ id: options?.secretId ?? 'vault-secret-1' }),
    retrieve: async (query: { actorWorkspaceId: string; workspaceId: string; type: string }) => {
      retrieveCalls.push({
        workspaceId: query.workspaceId,
        type: query.type,
        actorUserId: query.actorWorkspaceId,
      });
      if (options?.retrieve) {
        return options.retrieve(query);
      }
      return options?.fields ?? { apiKey: 'key-one', apiSecret: 'secret-one' };
    },
  };
}

function memoryAudit() {
  const events: Array<{
    outcome: string;
    source: string;
    payload: Record<string, unknown>;
    attribution: Record<string, string>;
  }> = [];
  return {
    events,
    record: async (write: {
      outcome: string;
      source: string;
      payload: Record<string, unknown>;
      attribution: Record<string, string>;
    }) => {
      events.push(write);
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
  timeoutMs = 10_000,
) {
  const adapters = [
    new BinanceHandshakeAdapter(http),
    new PlannedExchangeHandshakeAdapter('BYBIT'),
    new PlannedExchangeHandshakeAdapter('OKX'),
  ];
  return new ExchangeHandshakeService(
    vault as never,
    new ExchangeHandshakeAudit(audit as never),
    adapters,
    timeoutMs,
    { nowMs: () => 1_710_000_000_000 },
  );
}

const request = {
  workspaceId: 'workspace-a',
  actorUserId: 'operator-a',
  actorRole: Role.Trader,
  connectionId: 'connection-a',
  provider: 'BINANCE',
  vaultSecretId: 'vault-secret-1',
} as const;

describe('ExchangeHandshakeService (W2-S02-b)', () => {
  it('retrieves Vault credentials and assigns Connected after authenticated Binance communication', async () => {
    const vault = memoryVault();
    const audit = memoryAudit();
    const http = httpMock(async () => ({ status: 200, bodyText: '{"ipRestrict":false}' }));
    const handshake = serviceFor(vault, audit, http);

    const result = await handshake.perform(request);

    expect(result).toEqual({ outcome: 'CONNECTED' });
    expect(vault.retrieveCalls).toEqual([
      { workspaceId: 'workspace-a', type: 'binance', actorUserId: 'operator-a' },
    ]);
    expect(http.requests).toHaveLength(1);
    expect(http.requests[0]?.url).toContain('/sapi/v1/account/apiRestrictions');
    expect(http.requests[0]?.url).not.toContain('/api/v3/account');
    expect(http.requests[0]?.url).not.toContain('/order');
    expect(http.requests[0]?.url).not.toContain('/ticker');
    expect(audit.events.map((event) => event.outcome)).toEqual([
      'handshake_started',
      'handshake_succeeded',
    ]);
    expect(JSON.stringify(result)).not.toMatch(/key-one|secret-one|apiKey|apiSecret/);
    expect(JSON.stringify(audit.events)).not.toMatch(/key-one|secret-one|apiKey|apiSecret/);
  });

  it('maps authentication rejection, timeout, and unavailability without becoming Connected', async () => {
    const vault = memoryVault();

    const auth = serviceFor(
      vault,
      memoryAudit(),
      httpMock(async () => ({ status: 401, bodyText: '{"code":-2015,"msg":"Invalid API-key"}' })),
    );
    await expect(auth.perform(request)).resolves.toEqual({ outcome: 'AUTHENTICATION_FAILED' });

    const unavailable = serviceFor(
      vault,
      memoryAudit(),
      httpMock(async () => {
        const error = new Error('fetch failed');
        (error as { code?: string }).code = 'ENOTFOUND';
        throw error;
      }),
    );
    await expect(unavailable.perform(request)).resolves.toEqual({
      outcome: 'PROVIDER_UNAVAILABLE',
    });

    const timeout = serviceFor(
      vault,
      memoryAudit(),
      httpMock(
        async (input) =>
          new Promise((_, reject) => {
            input.signal.addEventListener('abort', () => {
              const error = new Error('aborted');
              error.name = 'AbortError';
              reject(error);
            });
          }),
      ),
      5,
    );
    await expect(timeout.perform(request)).resolves.toEqual({ outcome: 'HANDSHAKE_TIMEOUT' });
  });

  it('returns Validation Failed for planned Bybit and OKX adapters', async () => {
    const vault = memoryVault();
    const handshake = serviceFor(
      vault,
      memoryAudit(),
      httpMock(async () => ({
        status: 200,
        bodyText: '{}',
      })),
    );

    await expect(handshake.perform({ ...request, provider: 'BYBIT' })).resolves.toEqual({
      outcome: 'VALIDATION_FAILED',
    });
    await expect(handshake.perform({ ...request, provider: 'OKX' })).resolves.toEqual({
      outcome: 'VALIDATION_FAILED',
    });
    expect(vault.retrieveCalls).toEqual([]);
  });

  it('keeps Vault retrieve inside the requested workspace', async () => {
    const vault = memoryVault();
    const handshake = serviceFor(
      vault,
      memoryAudit(),
      httpMock(async () => ({ status: 200, bodyText: '{}' })),
    );

    await handshake.perform({
      ...request,
      workspaceId: 'workspace-b',
      vaultSecretId: 'vault-secret-1',
    });

    expect(vault.retrieveCalls[0]?.workspaceId).toBe('workspace-b');
    expect(vault.retrieveCalls[0]?.workspaceId).not.toBe('workspace-a');
  });
});
