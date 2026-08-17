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
        data: Partial<Pick<ConnectionRow, 'displayName' | 'vaultSecretId' | 'status'>>;
      }) => {
        const row = rows.find((candidate) => candidate.id === where.id);
        if (!row) throw new Error('missing');
        if (data.displayName !== undefined) row.displayName = data.displayName;
        if (data.vaultSecretId !== undefined) row.vaultSecretId = data.vaultSecretId;
        if (data.status !== undefined) row.status = data.status;
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
    retrieve: async () => ({ apiKey: 'key-one', apiSecret: 'secret-one' }),
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
    revoke: async () => {
      if (!secret) throw new Error('missing');
      return secret;
    },
  };
}

function successfulValidator() {
  return { validate: async () => ({ outcome: 'succeeded' as const }) };
}

function validationAudit() {
  const events: Array<{ outcome: string; workspaceId: string; connectionId: string }> = [];
  return {
    events,
    record: async (event: { outcome: string; workspaceId: string; connectionId: string }) => {
      events.push(event);
    },
  };
}

function lifecycleAudit() {
  const events: Array<{ outcome: string; workspaceId: string; connectionId: string }> = [];
  return {
    events,
    record: async (event: { outcome: string; workspaceId: string; connectionId: string }) => {
      events.push(event);
    },
  };
}

describe('ConnectionsService (W2-S01)', () => {
  it('creates metadata only with the provider type and disconnected default', async () => {
    const service = new ConnectionsService(
      memoryPrisma() as never,
      memoryVault() as never,
      successfulValidator(),
      validationAudit() as never,
      lifecycleAudit() as never,
    );
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
    const service = new ConnectionsService(
      memoryPrisma() as never,
      memoryVault() as never,
      successfulValidator(),
      validationAudit() as never,
      lifecycleAudit() as never,
    );
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
    const audit = lifecycleAudit();
    const service = new ConnectionsService(
      memoryPrisma() as never,
      vault as never,
      successfulValidator(),
      validationAudit() as never,
      audit as never,
    );
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
    expect(audit.events.map((event) => event.outcome)).toEqual(['credentials_replaced']);
  });

  it('moves a credentialed connection to Connected only through successful validation', async () => {
    const vault = memoryVault();
    const audit = validationAudit();
    const service = new ConnectionsService(
      memoryPrisma() as never,
      vault as never,
      successfulValidator(),
      audit as never,
      lifecycleAudit() as never,
    );
    const created = await service.create({
      workspaceId: 'workspace-a',
      displayName: 'Primary Binance',
      provider: 'BINANCE',
    });
    await service.storeCredentials({
      workspaceId: 'workspace-a',
      actorUserId: 'operator-a',
      actorRole: Role.Trader,
      id: created.id,
      credentials: { apiKey: 'key-one', apiSecret: 'secret-one' },
    });

    const validated = await service.validate({
      workspaceId: 'workspace-a',
      actorUserId: 'operator-a',
      actorRole: Role.Trader,
      id: created.id,
    });

    expect(validated.status).toBe('CONNECTED');
    expect(audit.events.map((event) => event.outcome)).toEqual(['started', 'succeeded']);
    expect(JSON.stringify(validated)).not.toContain('key-one');

    const replaced = await service.replaceCredentials({
      workspaceId: 'workspace-a',
      actorUserId: 'operator-a',
      actorRole: Role.Trader,
      id: created.id,
      credentials: { apiKey: 'key-two', apiSecret: 'secret-two' },
    });
    expect(replaced.status).toBe('DISCONNECTED');
  });

  it('ends validation as Validation Failed and allows a retry', async () => {
    const prisma = memoryPrisma();
    const vault = memoryVault();
    const audit = validationAudit();
    const service = new ConnectionsService(
      prisma as never,
      vault as never,
      { validate: async () => ({ outcome: 'failed' as const }) },
      audit as never,
      lifecycleAudit() as never,
    );
    const created = await service.create({
      workspaceId: 'workspace-a',
      displayName: 'Primary Binance',
      provider: 'BINANCE',
    });
    await service.storeCredentials({
      workspaceId: 'workspace-a',
      actorUserId: 'operator-a',
      actorRole: Role.Trader,
      id: created.id,
      credentials: { apiKey: 'key-one', apiSecret: 'secret-one' },
    });

    const failed = await service.validate({
      workspaceId: 'workspace-a',
      actorUserId: 'operator-a',
      actorRole: Role.Trader,
      id: created.id,
    });
    expect(failed.status).toBe('VALIDATION_FAILED');
    expect(audit.events.map((event) => event.outcome)).toEqual(['started', 'failed']);

    await expect(
      service.validate({
        workspaceId: 'workspace-b',
        actorUserId: 'operator-b',
        actorRole: Role.Trader,
        id: created.id,
      }),
    ).rejects.toThrow('Connection not found');
  });

  it('coordinates replace, disconnect, disable, and revoke with Vault-backed lifecycle state', async () => {
    const vault = memoryVault();
    const audit = lifecycleAudit();
    const service = new ConnectionsService(
      memoryPrisma() as never,
      vault as never,
      successfulValidator(),
      validationAudit() as never,
      audit as never,
    );
    const created = await service.create({
      workspaceId: 'workspace-a',
      displayName: 'Primary Binance',
      provider: 'BINANCE',
    });
    await service.storeCredentials({
      workspaceId: 'workspace-a',
      actorUserId: 'operator-a',
      actorRole: Role.Trader,
      id: created.id,
      credentials: { apiKey: 'key-one', apiSecret: 'secret-one' },
    });
    await service.validate({
      workspaceId: 'workspace-a',
      actorUserId: 'operator-a',
      actorRole: Role.Trader,
      id: created.id,
    });

    const disconnected = await service.disconnect({
      workspaceId: 'workspace-a',
      actorUserId: 'operator-a',
      id: created.id,
    });
    expect(disconnected.status).toBe('DISCONNECTED');

    const disabled = await service.disable({
      workspaceId: 'workspace-a',
      actorUserId: 'operator-a',
      id: created.id,
    });
    expect(disabled.status).toBe('DISABLED');
    await expect(
      service.validate({
        workspaceId: 'workspace-a',
        actorUserId: 'operator-a',
        actorRole: Role.Trader,
        id: created.id,
      }),
    ).rejects.toThrow('Connection cannot be validated');

    const revoked = await service.revoke({
      workspaceId: 'workspace-a',
      actorUserId: 'operator-a',
      actorRole: Role.Trader,
      id: created.id,
    });
    expect(revoked).toMatchObject({ status: 'REVOKED', credentialsStored: false });
    expect(audit.events.map((event) => event.outcome)).toEqual([
      'disconnected',
      'disabled',
      'revoked',
    ]);

    const restored = await service.storeCredentials({
      workspaceId: 'workspace-a',
      actorUserId: 'operator-a',
      actorRole: Role.Trader,
      id: created.id,
      credentials: { apiKey: 'key-two', apiSecret: 'secret-two' },
    });
    expect(restored).toMatchObject({ status: 'DISCONNECTED', credentialsStored: true });
  });
});
