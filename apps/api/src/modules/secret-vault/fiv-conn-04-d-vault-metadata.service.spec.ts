/**
 * VMP-1 — FivConn04DVaultMetadataService / repository metadata lookup (T-VMP-01…05, 08).
 */

import { describe, expect, it, vi } from 'vitest';
import { FivConn04DVaultMetadataService } from './fiv-conn-04-d-vault-metadata.service';
import { InMemorySecretVaultRepository } from './in-memory-secret-vault.repository';
import { PrismaSecretVaultRepository } from './prisma-secret-vault.repository';
import { HoldableSecretType } from './holdable-secret-type';
import { SecretPurpose } from './secret-purpose';
import { SecretState } from './secret-state';
import type { SecretVaultRecord } from './secret-record';
import type {
  SecretVaultMetadataProjection,
  SecretVaultRepository,
} from './secret-vault.repository';

const STUB_CIPHERTEXT = Object.freeze({
  version: 1 as const,
  wrappingSalt: 'salt',
  wrappedDataKey: 'wdk',
  dataKeyNonce: 'dkn',
  dataKeyTag: 'dkt',
  payload: 'payload-cipher-only',
  payloadNonce: 'pn',
  payloadTag: 'pt',
});

function connectedRecord(overrides: Partial<SecretVaultRecord> = {}): SecretVaultRecord {
  return Object.freeze({
    id: 'vault-1',
    workspaceId: 'ws-a',
    type: HoldableSecretType.Binance,
    purpose: SecretPurpose.TradingLive,
    state: SecretState.Connected,
    revision: 1,
    ciphertext: STUB_CIPHERTEXT,
    createdAt: '2026-10-30T10:00:00.000Z',
    updatedAt: '2026-10-30T10:00:00.000Z',
    ...overrides,
  });
}

describe('FivConn04DVaultMetadataService (VMP-1)', () => {
  it('T-VMP-01: success returns only { id, workspaceId, purpose, state }', async () => {
    const repo = new InMemorySecretVaultRepository();
    await repo.compareAndSet(connectedRecord(), null);
    const service = new FivConn04DVaultMetadataService(repo);

    const result = await service.lookupExact({
      workspaceId: 'ws-a',
      vaultSecretId: 'vault-1',
    });

    expect(result).toEqual({
      ok: true,
      metadata: {
        id: 'vault-1',
        workspaceId: 'ws-a',
        purpose: SecretPurpose.TradingLive,
        state: SecretState.Connected,
      },
    });
    if (result.ok) {
      expect(Object.keys(result.metadata).sort()).toEqual([
        'id',
        'purpose',
        'state',
        'workspaceId',
      ]);
      expect(result.metadata).not.toHaveProperty('ciphertext');
      expect(result.metadata).not.toHaveProperty('type');
      expect(result.metadata).not.toHaveProperty('operatorLabel');
      expect(result.metadata).not.toHaveProperty('revision');
      expect(JSON.stringify(result.metadata)).not.toMatch(
        /ciphertext|payload|wrapping|apiKey|apiSecret/i,
      );
    }
  });

  it('T-VMP-02: Prisma path uses narrow select (no cipher columns)', async () => {
    type FindFirstArg = {
      where: { id: string; workspaceId: string };
      select: Record<string, boolean>;
    };
    const findFirst = vi.fn(async (_args: FindFirstArg) => ({
      id: 'vault-1',
      workspaceId: 'ws-a',
      purpose: SecretPurpose.TradingLive,
      state: SecretState.Connected,
    }));
    const prisma = { vaultSecret: { findFirst } } as never;
    const repo = new PrismaSecretVaultRepository(prisma);
    await repo.findMetadataByIdAndWorkspaceId('vault-1', 'ws-a');

    expect(findFirst).toHaveBeenCalledTimes(1);
    expect(findFirst).toHaveBeenCalledWith({
      where: { id: 'vault-1', workspaceId: 'ws-a' },
      select: { id: true, workspaceId: true, purpose: true, state: true },
    });
    const select = findFirst.mock.calls[0]?.[0].select ?? {};
    expect(select).toEqual({ id: true, workspaceId: true, purpose: true, state: true });
    expect(select).not.toHaveProperty('payload');
    expect(select).not.toHaveProperty('wrappedDataKey');
    expect(select).not.toHaveProperty('wrappingSalt');
    expect(select).not.toHaveProperty('ciphertext');
  });

  it('T-VMP-03: compound exact lookup succeeds for matching (id, workspaceId)', async () => {
    const repo = new InMemorySecretVaultRepository();
    await repo.compareAndSet(connectedRecord(), null);
    await repo.compareAndSet(
      connectedRecord({
        id: 'vault-2',
        workspaceId: 'ws-a',
        type: HoldableSecretType.Bybit,
        purpose: SecretPurpose.TradingTestnet,
      }),
      null,
    );
    const service = new FivConn04DVaultMetadataService(repo);
    const result = await service.lookupExact({
      workspaceId: 'ws-a',
      vaultSecretId: 'vault-2',
    });
    expect(result).toEqual({
      ok: true,
      metadata: {
        id: 'vault-2',
        workspaceId: 'ws-a',
        purpose: SecretPurpose.TradingTestnet,
        state: SecretState.Connected,
      },
    });
  });

  it('T-VMP-04: wrong workspace / wrong id / unknown → NOT_FOUND', async () => {
    const repo = new InMemorySecretVaultRepository();
    await repo.compareAndSet(connectedRecord(), null);
    const service = new FivConn04DVaultMetadataService(repo);

    expect(
      await service.lookupExact({ workspaceId: 'ws-other', vaultSecretId: 'vault-1' }),
    ).toEqual({ ok: false, reason: 'NOT_FOUND' });
    expect(
      await service.lookupExact({ workspaceId: 'ws-a', vaultSecretId: 'vault-missing' }),
    ).toEqual({ ok: false, reason: 'NOT_FOUND' });
    expect(
      await service.lookupExact({ workspaceId: 'ws-other', vaultSecretId: 'vault-missing' }),
    ).toEqual({ ok: false, reason: 'NOT_FOUND' });
  });

  it('T-VMP-05: in-memory parity with Prisma semantics for hit / miss / foreign workspace', async () => {
    const memory = new InMemorySecretVaultRepository();
    await memory.compareAndSet(connectedRecord(), null);

    const findFirst = vi.fn(
      async ({
        where,
      }: {
        where: { id: string; workspaceId: string };
      }): Promise<SecretVaultMetadataProjection | null> => {
        if (where.id === 'vault-1' && where.workspaceId === 'ws-a') {
          return {
            id: 'vault-1',
            workspaceId: 'ws-a',
            purpose: SecretPurpose.TradingLive,
            state: SecretState.Connected,
          };
        }
        return null;
      },
    );
    const prismaRepo = new PrismaSecretVaultRepository({
      vaultSecret: { findFirst },
    } as never);

    const memoryService = new FivConn04DVaultMetadataService(memory);
    const prismaService = new FivConn04DVaultMetadataService(prismaRepo);

    const hit = { workspaceId: 'ws-a', vaultSecretId: 'vault-1' };
    const foreign = { workspaceId: 'ws-b', vaultSecretId: 'vault-1' };
    const unknown = { workspaceId: 'ws-a', vaultSecretId: 'nope' };

    expect(await memoryService.lookupExact(hit)).toEqual(await prismaService.lookupExact(hit));
    expect(await memoryService.lookupExact(foreign)).toEqual(
      await prismaService.lookupExact(foreign),
    );
    expect(await memoryService.lookupExact(unknown)).toEqual(
      await prismaService.lookupExact(unknown),
    );
  });

  it('T-VMP-08: UNAVAILABLE on repository throw; INVALID on blank input / bad projection', async () => {
    const throwing: SecretVaultRepository = {
      compareAndSet: async () => false,
      findBySlot: async () => null,
      listByWorkspaceId: async () => [],
      findMetadataByIdAndWorkspaceId: async () => {
        throw new Error('db down');
      },
      deleteIfRevision: async () => false,
    };
    const unavailable = await new FivConn04DVaultMetadataService(throwing).lookupExact({
      workspaceId: 'ws-a',
      vaultSecretId: 'vault-1',
    });
    expect(unavailable).toEqual({ ok: false, reason: 'UNAVAILABLE' });

    const blankRepo = {
      findMetadataByIdAndWorkspaceId: vi.fn(),
    };
    const blankService = new FivConn04DVaultMetadataService(blankRepo as never);
    expect(await blankService.lookupExact({ workspaceId: '  ', vaultSecretId: 'vault-1' })).toEqual(
      { ok: false, reason: 'INVALID' },
    );
    expect(await blankService.lookupExact({ workspaceId: 'ws-a', vaultSecretId: '' })).toEqual({
      ok: false,
      reason: 'INVALID',
    });
    expect(blankRepo.findMetadataByIdAndWorkspaceId).not.toHaveBeenCalled();

    const badProjection: SecretVaultRepository = {
      compareAndSet: async () => false,
      findBySlot: async () => null,
      listByWorkspaceId: async () => [],
      findMetadataByIdAndWorkspaceId: async () =>
        Object.freeze({
          id: 'vault-1',
          workspaceId: 'ws-a',
          purpose: 'not-a-purpose',
          state: SecretState.Connected,
        }),
      deleteIfRevision: async () => false,
    };
    expect(
      await new FivConn04DVaultMetadataService(badProjection).lookupExact({
        workspaceId: 'ws-a',
        vaultSecretId: 'vault-1',
      }),
    ).toEqual({ ok: false, reason: 'INVALID' });
  });
});
