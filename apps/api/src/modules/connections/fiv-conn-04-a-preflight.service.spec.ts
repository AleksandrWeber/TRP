/**
 * FIV-CONN-04-A — Preflight service read-only / binding tests.
 */

import { describe, expect, it, vi } from 'vitest';
import { Role } from '../identity/role';
import { SecretPurpose } from '../secret-vault/secret-purpose';
import { SecretState } from '../secret-vault/secret-state';
import { FivConn04APreflightService } from './fiv-conn-04-a-preflight.service';

type ConnectionRow = {
  id: string;
  workspaceId: string;
  provider: string;
  connectionType: string;
  environment: string | null;
  vaultSecretId: string | null;
  status: string;
};

type VaultMeta = {
  id: string;
  workspaceId: string;
  purpose: string;
  state: string;
  type: string;
  operatorLabel: string;
  createdAt: string;
  updatedAt: string;
};

function memoryPrisma(seed: ConnectionRow[]) {
  const rows = [...seed];
  const update = vi.fn(async () => {
    throw new Error('FIV-CONN-04-A must not UPDATE connections');
  });
  const create = vi.fn(async () => {
    throw new Error('FIV-CONN-04-A must not CREATE connections');
  });
  const remove = vi.fn(async () => {
    throw new Error('FIV-CONN-04-A must not DELETE connections');
  });
  return {
    connectionRecord: {
      findMany: async ({
        where,
        orderBy,
      }: {
        where?: { workspaceId?: string };
        orderBy?: Array<Record<string, 'asc' | 'desc'>>;
      }) => {
        let out = [...rows];
        if (where?.workspaceId !== undefined) {
          out = out.filter((r) => r.workspaceId === where.workspaceId);
        }
        out.sort((a, b) => {
          const ws = a.workspaceId.localeCompare(b.workspaceId);
          if (ws !== 0) return ws;
          const p = a.provider.localeCompare(b.provider);
          if (p !== 0) return p;
          return a.id.localeCompare(b.id);
        });
        void orderBy;
        return out;
      },
      findFirst: async ({
        where,
      }: {
        where: {
          workspaceId: string;
          provider: string;
          environment: string;
          connectionType: string;
          vaultSecretId: { not: null };
          status: { not: string };
          id: { not: string };
        };
      }) =>
        rows.find(
          (row) =>
            row.workspaceId === where.workspaceId &&
            row.provider === where.provider &&
            row.environment === where.environment &&
            row.connectionType === where.connectionType &&
            row.vaultSecretId !== null &&
            row.status !== where.status.not &&
            row.id !== where.id.not,
        ) ?? null,
      update,
      create,
      delete: remove,
    },
    _spies: { update, create, delete: remove },
  };
}

function memoryVault(secrets: VaultMeta[]) {
  const store = vi.fn(async () => {
    throw new Error('FIV-CONN-04-A must not store Vault secrets');
  });
  const replace = vi.fn(async () => {
    throw new Error('FIV-CONN-04-A must not replace Vault secrets');
  });
  const revoke = vi.fn(async () => {
    throw new Error('FIV-CONN-04-A must not revoke Vault secrets');
  });
  const retrieve = vi.fn(async () => {
    throw new Error('FIV-CONN-04-A must not retrieve/decrypt secret payloads');
  });
  return {
    list: async (_actor: string, workspaceId: string) =>
      secrets.filter((s) => s.workspaceId === workspaceId),
    store,
    replace,
    revoke,
    retrieve,
    _spies: { store, replace, revoke, retrieve },
  };
}

describe('FivConn04APreflightService', () => {
  it('21-24. runs read-only inventory with exact-id Vault metadata and no secret leakage', async () => {
    const prisma = memoryPrisma([
      {
        id: 'eligible',
        workspaceId: 'ws-1',
        provider: 'BYBIT',
        connectionType: 'EXCHANGE',
        environment: null,
        vaultSecretId: 'v-live',
        status: 'DISCONNECTED',
      },
      {
        id: 'ambiguous',
        workspaceId: 'ws-1',
        provider: 'OKX',
        connectionType: 'EXCHANGE',
        environment: null,
        vaultSecretId: null,
        status: 'DISCONNECTED',
      },
      {
        id: 'collision-candidate',
        workspaceId: 'ws-1',
        provider: 'BINANCE',
        connectionType: 'EXCHANGE',
        environment: null,
        vaultSecretId: 'v-live-2',
        status: 'DISCONNECTED',
      },
      {
        id: 'existing-live',
        workspaceId: 'ws-1',
        provider: 'BINANCE',
        connectionType: 'EXCHANGE',
        environment: 'live',
        vaultSecretId: 'v-existing',
        status: 'CONNECTED',
      },
      {
        id: 'notify',
        workspaceId: 'ws-1',
        provider: 'TELEGRAM',
        connectionType: 'NOTIFICATION',
        environment: null,
        vaultSecretId: null,
        status: 'DISCONNECTED',
      },
      {
        id: 'testnet-purpose',
        workspaceId: 'ws-1',
        provider: 'BINANCE',
        connectionType: 'EXCHANGE',
        environment: null,
        vaultSecretId: 'v-testnet',
        status: 'DISCONNECTED',
      },
    ]);

    const vault = memoryVault([
      {
        id: 'v-live',
        workspaceId: 'ws-1',
        purpose: SecretPurpose.Trading,
        state: SecretState.Connected,
        type: 'bybit',
        operatorLabel: 'vault_connected',
        createdAt: 't0',
        updatedAt: 't0',
      },
      {
        id: 'v-live-2',
        workspaceId: 'ws-1',
        purpose: SecretPurpose.TradingLive,
        state: SecretState.Connected,
        type: 'binance',
        operatorLabel: 'vault_connected',
        createdAt: 't0',
        updatedAt: 't0',
      },
      {
        id: 'v-existing',
        workspaceId: 'ws-1',
        purpose: SecretPurpose.TradingLive,
        state: SecretState.Connected,
        type: 'binance',
        operatorLabel: 'vault_connected',
        createdAt: 't0',
        updatedAt: 't0',
      },
      {
        id: 'v-testnet',
        workspaceId: 'ws-1',
        purpose: SecretPurpose.TradingTestnet,
        state: SecretState.Connected,
        type: 'binance',
        operatorLabel: 'vault_connected',
        createdAt: 't0',
        updatedAt: 't0',
      },
      {
        id: 'sibling-other',
        workspaceId: 'ws-1',
        purpose: SecretPurpose.Trading,
        state: SecretState.Connected,
        type: 'binance',
        operatorLabel: 'vault_connected',
        createdAt: 't0',
        updatedAt: 't0',
      },
    ]);

    const service = new FivConn04APreflightService(
      prisma as never,
      vault as never,
    );

    const report = await service.run({
      actorUserId: 'actor-1',
      actorRole: Role.Admin,
      workspaceId: 'ws-1',
    });

    const byId = Object.fromEntries(report.rows.map((r) => [r.connectionId, r]));

    expect(byId.eligible.reasonCode).toBe('ELIGIBLE_LIVE');
    expect(byId.ambiguous.reasonCode).toBe('AMBIGUOUS');
    expect(byId['collision-candidate'].reasonCode).toBe('STRATEGY_B_COLLISION');
    expect(byId['collision-candidate'].collidingConnectionId).toBe('existing-live');
    expect(byId['existing-live'].reasonCode).toBe('ALREADY_POPULATED');
    expect(byId.notify.reasonCode).toBe('NON_EXCHANGE_NULL');
    expect(byId['testnet-purpose'].reasonCode).toBe('NON_LIVE_PURPOSE');

    expect(report.counters.eligibleLive).toBe(1);
    expect(report.counters.ambiguous).toBe(1);
    expect(report.counters.strategyBCollisions).toBe(1);
    expect(report.counters.nonExchangeNull).toBe(1);
    expect(report.counters.alreadyPopulated).toBe(1);
    expect(report.counters.nonLivePurpose).toBe(1);
    expect(report.counters.exchangeCandidates).toBe(4);
    expect(report.counters.residualExchangeNull).toBe(3);
    expect(report.safety.databaseWrites).toBe(0);
    expect(report.safety.vaultMutations).toBe(0);
    expect(report.safety.liveBackfillPerformed).toBe(false);

    // 21–22. no database writes / no Vault mutation APIs
    expect(prisma._spies.update).not.toHaveBeenCalled();
    expect(prisma._spies.create).not.toHaveBeenCalled();
    expect(prisma._spies.delete).not.toHaveBeenCalled();
    expect(vault._spies.store).not.toHaveBeenCalled();
    expect(vault._spies.replace).not.toHaveBeenCalled();
    expect(vault._spies.revoke).not.toHaveBeenCalled();
    expect(vault._spies.retrieve).not.toHaveBeenCalled();

    // 24. no secret leakage in report rows
    const serialized = JSON.stringify(report);
    expect(serialized).not.toMatch(/apiKey|apiSecret|ciphertext|wrappingKey|password/i);
    for (const row of report.rows) {
      expect(row).not.toHaveProperty('fields');
      expect(row).not.toHaveProperty('material');
      expect(row).not.toHaveProperty('ciphertext');
    }
  });

  it('does not select sibling Vault credentials by provider', async () => {
    const prisma = memoryPrisma([
      {
        id: 'orphan-binding',
        workspaceId: 'ws-1',
        provider: 'BINANCE',
        connectionType: 'EXCHANGE',
        environment: null,
        vaultSecretId: 'missing-id',
        status: 'DISCONNECTED',
      },
    ]);
    const vault = memoryVault([
      {
        id: 'other-binance-live',
        workspaceId: 'ws-1',
        purpose: SecretPurpose.Trading,
        state: SecretState.Connected,
        type: 'binance',
        operatorLabel: 'vault_connected',
        createdAt: 't0',
        updatedAt: 't0',
      },
    ]);
    const service = new FivConn04APreflightService(prisma as never, vault as never);
    const report = await service.run({
      actorUserId: 'actor-1',
      actorRole: Role.Admin,
      workspaceId: 'ws-1',
    });
    expect(report.rows[0]?.reasonCode).toBe('DANGLING_VAULT_BINDING');
    expect(report.rows[0]?.reasonCode).not.toBe('ELIGIBLE_LIVE');
  });
});
