/**
 * FIV-CONN-03 — Security regression for governed EXCHANGE credential resolution.
 * Cases 01–18 + additional id-anchoring / revoke / shared-contract proofs.
 * No external venue I/O.
 */

import { describe, expect, it } from 'vitest';
import { Role } from '../identity/role';
import { SecretPurpose } from '../secret-vault/secret-purpose';
import { SecretState } from '../secret-vault/secret-state';
import {
  acceptancePurposesForConnectionEnvironment,
  assertConnectionPurposeModelC,
  resolveGovernedExchangeCredentials,
  type GovernedExchangeCredentialRequest,
} from './exchange-connection-credential';
import { ExchangeHandshakeService } from './exchange-handshake.service';
import { ExchangeCapabilityService } from './exchange-capability.service';
import { ExchangeHandshakeAudit } from './exchange-handshake.audit';
import { ExchangeCapabilityAudit } from './exchange-capability.audit';
import { ExchangeCapabilityCache } from './exchange-capability.cache';
import { BinanceHandshakeAdapter } from './binance-handshake.adapter';
import { BinanceCapabilityAdapter } from './binance-capability.adapter';
import { PlannedExchangeHandshakeAdapter } from './planned-handshake.adapter';
import { PlannedExchangeCapabilityAdapter } from './planned-capability.adapter';
import type { HandshakeHttpRequest, HandshakeHttpResponse } from './exchange-handshake.http';

type SlotSecret = {
  id: string;
  workspaceId: string;
  type: string;
  purpose: string;
  state: string;
  fields: Record<string, string>;
};

function slotKey(workspaceId: string, type: string, purpose: string) {
  return `${workspaceId}::${type}::${purpose}`;
}

function governedVault(seed: SlotSecret[] = []) {
  const secrets = new Map<string, SlotSecret>();
  for (const secret of seed) {
    secrets.set(slotKey(secret.workspaceId, secret.type, secret.purpose), secret);
  }
  const getCalls: Array<{ workspaceId: string; type: string; purpose?: string }> = [];
  const retrieveCalls: Array<{ workspaceId: string; type: string; purpose?: string }> = [];

  return {
    getCalls,
    retrieveCalls,
    secrets,
    get: async (query: {
      workspaceId: string;
      type: string;
      purpose?: string;
      actorWorkspaceId: string;
      actorRole?: Role;
    }) => {
      getCalls.push({
        workspaceId: query.workspaceId,
        type: query.type,
        purpose: query.purpose,
      });
      if (query.purpose === undefined) {
        throw new Error('omit-purpose Vault get is forbidden on governed path');
      }
      const secret = secrets.get(slotKey(query.workspaceId, query.type, query.purpose));
      if (!secret) return null;
      return {
        id: secret.id,
        workspaceId: secret.workspaceId,
        type: secret.type,
        purpose: secret.purpose,
        state: secret.state,
        operatorLabel: 'Connected',
        createdAt: '2026-09-17T00:00:00.000Z',
        updatedAt: '2026-09-17T00:00:00.000Z',
      };
    },
    retrieve: async (query: {
      workspaceId: string;
      type: string;
      purpose?: string;
      actorWorkspaceId: string;
      actorRole?: Role;
    }) => {
      retrieveCalls.push({
        workspaceId: query.workspaceId,
        type: query.type,
        purpose: query.purpose,
      });
      if (query.purpose === undefined) {
        throw new Error('omit-purpose Vault retrieve is forbidden on governed path');
      }
      const secret = secrets.get(slotKey(query.workspaceId, query.type, query.purpose));
      if (!secret) {
        throw new Error('vault_not_stored');
      }
      if (secret.state === SecretState.Revoked) {
        throw new Error('vault_revoked');
      }
      return { ...secret.fields };
    },
  };
}

function baseRequest(
  overrides: Partial<GovernedExchangeCredentialRequest> = {},
): GovernedExchangeCredentialRequest {
  return {
    workspaceId: 'workspace-a',
    actorUserId: 'operator-a',
    actorRole: Role.Trader,
    provider: 'BINANCE',
    environment: 'live',
    vaultSecretId: 'secret-a',
    ...overrides,
  };
}

function tradingSecret(
  overrides: Partial<SlotSecret> & Pick<SlotSecret, 'id' | 'purpose'>,
): SlotSecret {
  return {
    workspaceId: 'workspace-a',
    type: 'binance',
    state: SecretState.Connected,
    fields: { apiKey: 'key-bound', apiSecret: 'secret-bound' },
    ...overrides,
  };
}

describe('FIV-CONN-03 governed exchange credential resolution', () => {
  it('acceptance classes match frozen LIVE / TESTNET policy', () => {
    expect(acceptancePurposesForConnectionEnvironment('live')).toEqual([
      SecretPurpose.TradingLive,
      SecretPurpose.Trading,
    ]);
    expect(acceptancePurposesForConnectionEnvironment('testnet')).toEqual([
      SecretPurpose.TradingTestnet,
    ]);
    expect(assertConnectionPurposeModelC('live', SecretPurpose.Trading)).toBe(true);
    expect(assertConnectionPurposeModelC('live', SecretPurpose.TradingLive)).toBe(true);
    expect(assertConnectionPurposeModelC('live', SecretPurpose.TradingTestnet)).toBe(false);
    expect(assertConnectionPurposeModelC('testnet', SecretPurpose.TradingTestnet)).toBe(true);
    expect(assertConnectionPurposeModelC('testnet', SecretPurpose.Trading)).toBe(false);
  });

  it('CASE 01: LIVE + Trading → ALLOW', async () => {
    const vault = governedVault([
      tradingSecret({ id: 'secret-a', purpose: SecretPurpose.Trading }),
    ]);
    const result = await resolveGovernedExchangeCredentials(vault as never, baseRequest());
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.purpose).toBe(SecretPurpose.Trading);
      expect(result.credentials.apiKey).toBe('key-bound');
    }
    expect(vault.retrieveCalls.every((call) => call.purpose !== undefined)).toBe(true);
  });

  it('CASE 02: LIVE + TradingLive → ALLOW', async () => {
    const vault = governedVault([
      tradingSecret({ id: 'secret-a', purpose: SecretPurpose.TradingLive }),
    ]);
    const result = await resolveGovernedExchangeCredentials(vault as never, baseRequest());
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.purpose).toBe(SecretPurpose.TradingLive);
    }
  });

  it('CASE 03: LIVE + TradingTestnet → DENY', async () => {
    const vault = governedVault([
      tradingSecret({ id: 'secret-a', purpose: SecretPurpose.TradingTestnet }),
    ]);
    const result = await resolveGovernedExchangeCredentials(vault as never, baseRequest());
    expect(result).toMatchObject({ ok: false, reason: 'vault_secret_id_mismatch' });
    expect(vault.retrieveCalls).toEqual([]);
  });

  it('CASE 04: TESTNET + Trading → DENY', async () => {
    const vault = governedVault([
      tradingSecret({ id: 'secret-a', purpose: SecretPurpose.Trading }),
    ]);
    const result = await resolveGovernedExchangeCredentials(
      vault as never,
      baseRequest({ environment: 'testnet' }),
    );
    expect(result.ok).toBe(false);
    expect(vault.retrieveCalls).toEqual([]);
  });

  it('CASE 05: TESTNET + TradingLive → DENY', async () => {
    const vault = governedVault([
      tradingSecret({ id: 'secret-a', purpose: SecretPurpose.TradingLive }),
    ]);
    const result = await resolveGovernedExchangeCredentials(
      vault as never,
      baseRequest({ environment: 'testnet' }),
    );
    expect(result.ok).toBe(false);
    expect(vault.retrieveCalls).toEqual([]);
  });

  it('CASE 06: TESTNET + TradingTestnet → ALLOW', async () => {
    const vault = governedVault([
      tradingSecret({ id: 'secret-a', purpose: SecretPurpose.TradingTestnet }),
    ]);
    const result = await resolveGovernedExchangeCredentials(
      vault as never,
      baseRequest({ environment: 'testnet' }),
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.purpose).toBe(SecretPurpose.TradingTestnet);
    }
  });

  it('CASE 07: EXCHANGE + NULL → DENY before Vault use', async () => {
    const vault = governedVault([
      tradingSecret({ id: 'secret-a', purpose: SecretPurpose.TradingLive }),
    ]);
    const result = await resolveGovernedExchangeCredentials(
      vault as never,
      baseRequest({ environment: null }),
    );
    expect(result).toEqual({
      ok: false,
      reason: 'environment_required',
      vaultGetCalls: 0,
      vaultRetrieveCalls: 0,
    });
    expect(vault.getCalls).toEqual([]);
    expect(vault.retrieveCalls).toEqual([]);
  });

  it('CASE 08: wrong workspace → DENY', async () => {
    const vault = governedVault([
      tradingSecret({
        id: 'secret-a',
        purpose: SecretPurpose.TradingLive,
        workspaceId: 'workspace-b',
      }),
    ]);
    const result = await resolveGovernedExchangeCredentials(vault as never, baseRequest());
    expect(result.ok).toBe(false);
    expect(vault.retrieveCalls).toEqual([]);
  });

  it('CASE 09: wrong provider → DENY', async () => {
    const vault = governedVault([
      tradingSecret({
        id: 'secret-a',
        purpose: SecretPurpose.TradingLive,
        type: 'bybit',
      }),
    ]);
    const result = await resolveGovernedExchangeCredentials(vault as never, baseRequest());
    expect(result.ok).toBe(false);
    expect(vault.retrieveCalls).toEqual([]);
  });

  it('CASE 10: wrong vaultSecretId → DENY', async () => {
    const vault = governedVault([
      tradingSecret({ id: 'secret-other', purpose: SecretPurpose.TradingLive }),
    ]);
    const result = await resolveGovernedExchangeCredentials(vault as never, baseRequest());
    expect(result).toMatchObject({ ok: false, reason: 'vault_secret_id_mismatch' });
    expect(vault.retrieveCalls).toEqual([]);
  });

  it('CASE 11: provider-only / omit-purpose lookup is impossible on governed path', async () => {
    const vault = governedVault([
      tradingSecret({ id: 'secret-a', purpose: SecretPurpose.TradingLive }),
    ]);
    await resolveGovernedExchangeCredentials(vault as never, baseRequest());
    expect(vault.getCalls.length).toBeGreaterThan(0);
    expect(vault.getCalls.every((call) => typeof call.purpose === 'string')).toBe(true);
    expect(vault.retrieveCalls.every((call) => typeof call.purpose === 'string')).toBe(true);
  });

  it('CASE 12: sibling-secret substitution DENY — A mismatches, B would work', async () => {
    // Connection points at A (TradingTestnet) while environment is LIVE.
    // Sibling B is TradingLive and would work for LIVE — must not be selected.
    const denyVault = governedVault([
      tradingSecret({ id: 'secret-a', purpose: SecretPurpose.TradingTestnet }),
      tradingSecret({
        id: 'secret-b',
        purpose: SecretPurpose.TradingLive,
        fields: { apiKey: 'good-key', apiSecret: 'good-secret' },
      }),
    ]);
    const result = await resolveGovernedExchangeCredentials(
      denyVault as never,
      baseRequest({ vaultSecretId: 'secret-a' }),
    );
    expect(result.ok).toBe(false);
    expect(denyVault.retrieveCalls).toEqual([]);
  });

  it('CASE 13: client purpose injection is NOT authoritative', async () => {
    const vault = governedVault([
      tradingSecret({ id: 'secret-a', purpose: SecretPurpose.TradingLive }),
      tradingSecret({
        id: 'secret-testnet',
        purpose: SecretPurpose.TradingTestnet,
        fields: { apiKey: 'tn-key', apiSecret: 'tn-secret' },
      }),
    ]);
    const result = await resolveGovernedExchangeCredentials(
      vault as never,
      baseRequest({ clientPurpose: SecretPurpose.TradingTestnet }),
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.purpose).toBe(SecretPurpose.TradingLive);
      expect(result.credentials.apiKey).toBe('key-bound');
    }
    expect(vault.retrieveCalls).toEqual([
      { workspaceId: 'workspace-a', type: 'binance', purpose: SecretPurpose.TradingLive },
    ]);
  });

  it('CASE 14/15/16: purpose mismatch → DENY (handshake/capability share helper)', async () => {
    const vault = governedVault([
      tradingSecret({ id: 'secret-a', purpose: SecretPurpose.TradingTestnet }),
    ]);
    const result = await resolveGovernedExchangeCredentials(vault as never, baseRequest());
    expect(result.ok).toBe(false);
    expect(vault.retrieveCalls).toEqual([]);
  });

  it('CASE 17: cross-environment fallback DENY', async () => {
    const vault = governedVault([
      tradingSecret({ id: 'secret-a', purpose: SecretPurpose.TradingTestnet }),
      tradingSecret({
        id: 'secret-live',
        purpose: SecretPurpose.TradingLive,
        fields: { apiKey: 'live-key', apiSecret: 'live-secret' },
      }),
    ]);
    const result = await resolveGovernedExchangeCredentials(
      vault as never,
      baseRequest({ vaultSecretId: 'secret-a', environment: 'live' }),
    );
    expect(result.ok).toBe(false);
    expect(vault.retrieveCalls).toEqual([]);
  });

  it('CASE 18: credential leakage — result/errors omit secret material beyond credentials object', async () => {
    const vault = governedVault([
      tradingSecret({ id: 'secret-a', purpose: SecretPurpose.TradingLive }),
    ]);
    const result = await resolveGovernedExchangeCredentials(vault as never, baseRequest());
    const denied = await resolveGovernedExchangeCredentials(
      vault as never,
      baseRequest({ vaultSecretId: 'missing' }),
    );
    expect(JSON.stringify(denied)).not.toMatch(/key-bound|secret-bound|apiSecret/);
    expect(denied).toMatchObject({ ok: false });
    // Success carries credentials for adapter use only — metadata/purpose must not echo fields.
    if (result.ok) {
      expect(JSON.stringify(result.metadata)).not.toMatch(/key-bound|secret-bound/);
      expect(result.metadata).not.toHaveProperty('apiKey');
    }
  });

  it('A: LIVE + Trading with sibling TradingLive present uses exact vaultSecretId only', async () => {
    const vault = governedVault([
      tradingSecret({
        id: 'secret-a',
        purpose: SecretPurpose.Trading,
        fields: { apiKey: 'a-key', apiSecret: 'a-secret' },
      }),
      tradingSecret({
        id: 'secret-b',
        purpose: SecretPurpose.TradingLive,
        fields: { apiKey: 'b-key', apiSecret: 'b-secret' },
      }),
    ]);
    const result = await resolveGovernedExchangeCredentials(
      vault as never,
      baseRequest({ vaultSecretId: 'secret-a' }),
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.credentials.apiKey).toBe('a-key');
      expect(result.purpose).toBe(SecretPurpose.Trading);
    }
  });

  it('B: LIVE + TradingLive with sibling Trading present uses exact vaultSecretId only', async () => {
    const vault = governedVault([
      tradingSecret({
        id: 'secret-a',
        purpose: SecretPurpose.TradingLive,
        fields: { apiKey: 'live-key', apiSecret: 'live-secret' },
      }),
      tradingSecret({
        id: 'secret-b',
        purpose: SecretPurpose.Trading,
        fields: { apiKey: 'legacy-key', apiSecret: 'legacy-secret' },
      }),
    ]);
    const result = await resolveGovernedExchangeCredentials(
      vault as never,
      baseRequest({ vaultSecretId: 'secret-a' }),
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.credentials.apiKey).toBe('live-key');
      expect(result.purpose).toBe(SecretPurpose.TradingLive);
    }
  });

  it('C: TESTNET + TradingTestnet ignores LIVE siblings', async () => {
    const vault = governedVault([
      tradingSecret({
        id: 'secret-a',
        purpose: SecretPurpose.TradingTestnet,
        fields: { apiKey: 'tn-key', apiSecret: 'tn-secret' },
      }),
      tradingSecret({
        id: 'secret-live',
        purpose: SecretPurpose.TradingLive,
        fields: { apiKey: 'live-key', apiSecret: 'live-secret' },
      }),
    ]);
    const result = await resolveGovernedExchangeCredentials(
      vault as never,
      baseRequest({ environment: 'testnet', vaultSecretId: 'secret-a' }),
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.credentials.apiKey).toBe('tn-key');
    }
  });

  it('D: vault metadata ID mismatch → DENY', async () => {
    const vault = governedVault([
      tradingSecret({ id: 'other-id', purpose: SecretPurpose.TradingLive }),
    ]);
    const result = await resolveGovernedExchangeCredentials(vault as never, baseRequest());
    expect(result.ok).toBe(false);
  });

  it('E: revoked exact credential → DENY', async () => {
    const vault = governedVault([
      tradingSecret({
        id: 'secret-a',
        purpose: SecretPurpose.TradingLive,
        state: SecretState.Revoked,
      }),
    ]);
    const result = await resolveGovernedExchangeCredentials(vault as never, baseRequest());
    expect(result).toMatchObject({ ok: false, reason: 'vault_unavailable' });
  });

  it('F: deleted/missing exact credential → DENY', async () => {
    const vault = governedVault([]);
    const result = await resolveGovernedExchangeCredentials(vault as never, baseRequest());
    expect(result.ok).toBe(false);
    expect(vault.retrieveCalls).toEqual([]);
  });

  it('G/H/I: handshake and capability use the same governed validation contract', async () => {
    const vault = governedVault([
      tradingSecret({ id: 'secret-a', purpose: SecretPurpose.TradingLive }),
    ]);
    const http = {
      request: async (_input: HandshakeHttpRequest): Promise<HandshakeHttpResponse> => ({
        status: 200,
        bodyText: '{"ipRestrict":false}',
      }),
    };
    const handshake = new ExchangeHandshakeService(
      vault as never,
      new ExchangeHandshakeAudit({ record: async () => undefined } as never),
      [
        new BinanceHandshakeAdapter(http),
        new PlannedExchangeHandshakeAdapter('BYBIT'),
        new PlannedExchangeHandshakeAdapter('OKX'),
      ],
      10_000,
      { nowMs: () => 1_710_000_000_000 },
    );
    const capabilities = new ExchangeCapabilityService(
      vault as never,
      new ExchangeCapabilityAudit({ record: async () => undefined } as never),
      new ExchangeCapabilityCache(),
      [
        new BinanceCapabilityAdapter(http),
        new PlannedExchangeCapabilityAdapter('BYBIT'),
        new PlannedExchangeCapabilityAdapter('OKX'),
      ],
      10_000,
      { nowMs: () => 1_710_000_000_000 },
    );

    const request = {
      workspaceId: 'workspace-a',
      actorUserId: 'operator-a',
      actorRole: Role.Trader,
      connectionId: 'connection-a',
      provider: 'BINANCE',
      vaultSecretId: 'secret-a',
      environment: 'live' as const,
    };

    const first = await handshake.perform(request);
    const second = await handshake.perform(request);
    expect(first).toEqual({ outcome: 'CONNECTED' });
    expect(second).toEqual({ outcome: 'CONNECTED' });

    const cap1 = await capabilities.verify({ ...request, handshakeSucceeded: true });
    const cap2 = await capabilities.verify({ ...request, handshakeSucceeded: true });
    expect(cap1?.verificationFailed).toBe(false);
    expect(cap2?.verificationFailed).toBe(false);

    expect(vault.getCalls.every((call) => call.purpose !== undefined)).toBe(true);
    expect(vault.retrieveCalls.every((call) => call.purpose !== undefined)).toBe(true);

    const mismatchVault = governedVault([
      tradingSecret({ id: 'secret-a', purpose: SecretPurpose.TradingTestnet }),
    ]);
    const mismatchHandshake = new ExchangeHandshakeService(
      mismatchVault as never,
      new ExchangeHandshakeAudit({ record: async () => undefined } as never),
      [
        new BinanceHandshakeAdapter(http),
        new PlannedExchangeHandshakeAdapter('BYBIT'),
        new PlannedExchangeHandshakeAdapter('OKX'),
      ],
    );
    await expect(
      mismatchHandshake.perform({
        ...request,
        environment: 'live',
      }),
    ).resolves.toEqual({ outcome: 'VALIDATION_FAILED' });
    expect(mismatchVault.retrieveCalls).toEqual([]);

    const mismatchCapability = new ExchangeCapabilityService(
      mismatchVault as never,
      new ExchangeCapabilityAudit({ record: async () => undefined } as never),
      new ExchangeCapabilityCache(),
      [
        new BinanceCapabilityAdapter(http),
        new PlannedExchangeCapabilityAdapter('BYBIT'),
        new PlannedExchangeCapabilityAdapter('OKX'),
      ],
    );
    const failedCap = await mismatchCapability.verify({
      ...request,
      environment: 'live',
      handshakeSucceeded: true,
    });
    expect(failedCap?.verificationFailed).toBe(true);
  });
});
