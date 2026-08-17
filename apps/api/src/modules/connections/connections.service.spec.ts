import { describe, expect, it } from 'vitest';
import { Role } from '../identity/role';
import { ConnectionsService } from './connections.service';

type ConnectionRow = {
  id: string;
  workspaceId: string;
  displayName: string;
  provider: string;
  connectionType: string;
  vaultSecretId: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
};

function memoryPrisma() {
  const rows: ConnectionRow[] = [];
  return {
    connectionRecord: {
      create: async ({ data }: { data: Omit<ConnectionRow, 'updatedAt' | 'vaultSecretId'> }) => {
        const row = { ...data, vaultSecretId: null, updatedAt: data.createdAt };
        rows.push(row);
        return row;
      },
      findMany: async ({
        where,
        orderBy,
      }: {
        where: { workspaceId: string };
        orderBy: { createdAt: 'asc' };
      }) =>
        rows
          .filter((row) => row.workspaceId === where.workspaceId)
          .sort((a, b) =>
            orderBy.createdAt === 'asc'
              ? a.createdAt.getTime() - b.createdAt.getTime()
              : b.createdAt.getTime() - a.createdAt.getTime(),
          ),
      findFirst: async ({
        where,
      }: {
        where: {
          id?: string;
          workspaceId: string;
          provider?: string;
          vaultSecretId?: { not: null };
        };
      }) =>
        rows.find(
          (row) =>
            row.workspaceId === where.workspaceId &&
            (where.id === undefined || row.id === where.id) &&
            (where.provider === undefined || row.provider === where.provider) &&
            (where.vaultSecretId === undefined || row.vaultSecretId !== null),
        ) ?? null,
      update: async ({
        where,
        data,
      }: {
        where: { id: string };
        data: Partial<Pick<ConnectionRow, 'displayName' | 'vaultSecretId'>>;
      }) => {
        const row = rows.find((candidate) => candidate.id === where.id);
        if (!row) throw new Error('missing');
        if (data.displayName !== undefined) row.displayName = data.displayName;
        if (data.vaultSecretId !== undefined) row.vaultSecretId = data.vaultSecretId;
        row.updatedAt = new Date('2026-08-17T16:05:00.000Z');
        return row;
      },
    },
  };
}

function memoryVault() {
  let secret: { id: string; workspaceId: string; type: string } | null = null;
  return {
    get: async () => secret,
    store: async (input: { workspaceId: string; type: string; fields: Record<string, string> }) => {
      secret = { id: 'vault-secret-1', workspaceId: input.workspaceId, type: input.type };
      return { metadata: secret, lifecycle: [] };
    },
    replace: async (input: {
      workspaceId: string;
      type: string;
      fields: Record<string, string>;
    }) => {
      if (!secret || secret.workspaceId !== input.workspaceId || secret.type !== input.type) {
        throw new Error('missing');
      }
      return { metadata: secret, lifecycle: [] };
    },
  };
}

describe('ConnectionsService (W2-S01)', () => {
  it('creates metadata only with the provider type and disconnected default', async () => {
    const service = new ConnectionsService(memoryPrisma() as never, memoryVault() as never);
    const connection = await service.create({
      workspaceId: 'workspace-a',
      displayName: ' Primary Binance ',
      provider: 'BINANCE',
    });

    expect(connection).toMatchObject({
      workspaceId: 'workspace-a',
      displayName: 'Primary Binance',
      provider: 'BINANCE',
      connectionType: 'EXCHANGE',
      status: 'DISCONNECTED',
    });
    expect(JSON.stringify(connection)).not.toMatch(/apiKey|password|token|secret|ciphertext/i);
  });

  it('keeps CRUD metadata inside the owning workspace', async () => {
    const service = new ConnectionsService(memoryPrisma() as never, memoryVault() as never);
    const created = await service.create({
      workspaceId: 'workspace-a',
      displayName: 'Telegram alerts',
      provider: 'TELEGRAM',
    });

    await expect(service.list('workspace-b')).resolves.toEqual([]);
    await expect(service.get('workspace-b', created.id)).rejects.toThrow('Connection not found');
    await expect(service.rename('workspace-b', created.id, 'Foreign')).rejects.toThrow(
      'Connection not found',
    );

    const renamed = await service.rename('workspace-a', created.id, 'Workspace A Telegram');
    expect(renamed.displayName).toBe('Workspace A Telegram');
    expect(renamed.status).toBe('DISCONNECTED');
    expect(await service.list('workspace-a')).toHaveLength(1);
  });

  it('stores and replaces credentials in Vault without returning them or changing status', async () => {
    const vault = memoryVault();
    const service = new ConnectionsService(memoryPrisma() as never, vault as never);
    const created = await service.create({
      workspaceId: 'workspace-a',
      displayName: 'Primary Binance',
      provider: 'BINANCE',
    });

    const stored = await service.storeCredentials({
      workspaceId: 'workspace-a',
      actorUserId: 'operator-a',
      actorRole: Role.Trader,
      id: created.id,
      credentials: { apiKey: 'key-one', apiSecret: 'secret-one' },
    });
    expect(stored.credentialsStored).toBe(true);
    expect(stored.status).toBe('DISCONNECTED');
    expect(JSON.stringify(stored)).not.toContain('key-one');
    expect(JSON.stringify(stored)).not.toContain('secret-one');

    const replaced = await service.replaceCredentials({
      workspaceId: 'workspace-a',
      actorUserId: 'operator-a',
      actorRole: Role.Trader,
      id: created.id,
      credentials: { apiKey: 'key-two', apiSecret: 'secret-two' },
    });
    expect(replaced.credentialsStored).toBe(true);
    expect(replaced.status).toBe('DISCONNECTED');
    expect(JSON.stringify(replaced)).not.toContain('key-two');
    expect(JSON.stringify(replaced)).not.toContain('secret-two');
  });
});
