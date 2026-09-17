import { ConflictException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { ExchangeSessionAudit, ExchangeSessionService } from '../exchange-connectivity';
import { Role } from '../identity/role';
import { ConnectionsService } from './connections.service';

type ConnectionRow = {
  id: string;
  workspaceId: string;
  displayName: string;
  provider: string;
  connectionType: string;
  environment: string | null;
  vaultSecretId: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
};

function memoryPrisma(seed: ConnectionRow[] = []) {
  const rows: ConnectionRow[] = [...seed];
  return {
    connectionRecord: {
      create: async ({
        data,
      }: {
        data: Omit<ConnectionRow, 'updatedAt' | 'vaultSecretId'> & { environment?: string | null };
      }) => {
        const row = {
          ...data,
          environment: data.environment ?? null,
          vaultSecretId: null,
          updatedAt: data.createdAt,
        };
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
          id?: string | { not: string };
          workspaceId: string;
          provider?: string;
          environment?: string | null;
          vaultSecretId?: { not: null };
          status?: { not: string };
          connectionType?: string;
        };
      }) => {
        const idNot = typeof where.id === 'object' && where.id !== null ? where.id.not : undefined;
        const idEq = typeof where.id === 'string' ? where.id : undefined;
        return (
          rows.find((row) => {
            if (row.workspaceId !== where.workspaceId) return false;
            if (idEq !== undefined && row.id !== idEq) return false;
            if (idNot !== undefined && row.id === idNot) return false;
            if (where.provider !== undefined && row.provider !== where.provider) return false;
            if (where.environment !== undefined && row.environment !== where.environment) {
              return false;
            }
            if (where.vaultSecretId !== undefined && row.vaultSecretId === null) return false;
            if (where.status?.not !== undefined && row.status === where.status.not) return false;
            if (where.connectionType !== undefined && row.connectionType !== where.connectionType) {
              return false;
            }
            return true;
          }) ?? null
        );
      },
      update: async ({
        where,
        data,
      }: {
        where: { id: string };
        data: Partial<
          Pick<ConnectionRow, 'displayName' | 'vaultSecretId' | 'status' | 'environment'>
        >;
      }) => {
        const row = rows.find((candidate) => candidate.id === where.id);
        if (!row) throw new Error('missing');
        if (data.vaultSecretId !== undefined && data.vaultSecretId !== null) {
          const nextStatus = data.status ?? row.status;
          const env = data.environment !== undefined ? data.environment : row.environment;
          if (row.connectionType === 'EXCHANGE' && env !== null && nextStatus !== 'REVOKED') {
            const conflict = rows.find(
              (other) =>
                other.id !== row.id &&
                other.workspaceId === row.workspaceId &&
                other.provider === row.provider &&
                other.environment === env &&
                other.connectionType === 'EXCHANGE' &&
                other.vaultSecretId !== null &&
                other.status !== 'REVOKED',
            );
            if (conflict) {
              const { Prisma } = await import('@prisma/client');
              throw new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
                code: 'P2002',
                clientVersion: 'test',
              });
            }
          }
        }
        if (data.displayName !== undefined) row.displayName = data.displayName;
        if (data.vaultSecretId !== undefined) row.vaultSecretId = data.vaultSecretId;
        if (data.status !== undefined) row.status = data.status;
        // FIV-CONN-01: normal update path must not rewrite environment; service never passes it.
        if (data.environment !== undefined) row.environment = data.environment;
        row.updatedAt = new Date('2026-08-17T16:05:00.000Z');
        return row;
      },
    },
  };
}

function memoryVault() {
  const secrets = new Map<
    string,
    { id: string; workspaceId: string; type: string; purpose: string }
  >();
  const retrieveCalls: Array<{ workspaceId: string; type: string; purpose?: string }> = [];
  const slotKey = (workspaceId: string, type: string, purpose: string) =>
    `${workspaceId}::${type}::${purpose}`;
  const resolvePurpose = (purpose: string | undefined, type: string) => {
    if (purpose) return purpose;
    if (type === 'binance' || type === 'bybit' || type === 'okx') return 'trading';
    if (type === 'openrouter') return 'ai';
    return 'notification';
  };
  return {
    retrieveCalls,
    get: async (query: { workspaceId: string; type: string; purpose?: string }) => {
      const purpose = resolvePurpose(query.purpose, query.type);
      return secrets.get(slotKey(query.workspaceId, query.type, purpose)) ?? null;
    },
    retrieve: async (query: { workspaceId: string; type: string; purpose?: string }) => {
      retrieveCalls.push({
        workspaceId: query.workspaceId,
        type: query.type,
        purpose: query.purpose,
      });
      return { apiKey: 'key-one', apiSecret: 'secret-one' };
    },
    store: async (input: {
      workspaceId: string;
      type: string;
      purpose?: string;
      fields: Record<string, string>;
    }) => {
      const purpose = resolvePurpose(input.purpose, input.type);
      const id = `vault-secret-${secrets.size + 1}`;
      const secret = { id, workspaceId: input.workspaceId, type: input.type, purpose };
      secrets.set(slotKey(input.workspaceId, input.type, purpose), secret);
      return { metadata: secret, lifecycle: [] };
    },
    replace: async (input: {
      workspaceId: string;
      type: string;
      purpose?: string;
      fields: Record<string, string>;
    }) => {
      const purpose = resolvePurpose(input.purpose, input.type);
      const key = slotKey(input.workspaceId, input.type, purpose);
      const secret = secrets.get(key);
      if (!secret) throw new Error('missing');
      return { metadata: secret, lifecycle: [] };
    },
    revoke: async (query: { workspaceId: string; type: string; purpose?: string }) => {
      const purpose = resolvePurpose(query.purpose, query.type);
      const key = slotKey(query.workspaceId, query.type, purpose);
      const secret = secrets.get(key);
      if (!secret) throw new Error('missing');
      secrets.delete(key);
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

function handshakeStub(
  outcome:
    | 'CONNECTED'
    | 'VALIDATION_FAILED'
    | 'HANDSHAKE_TIMEOUT'
    | 'PROVIDER_UNAVAILABLE'
    | 'AUTHENTICATION_FAILED' = 'CONNECTED',
) {
  const calls: Array<{ workspaceId: string; connectionId: string; provider: string }> = [];
  return {
    calls,
    perform: async (request: {
      workspaceId: string;
      connectionId: string;
      provider: string;
      vaultSecretId: string;
    }) => {
      calls.push({
        workspaceId: request.workspaceId,
        connectionId: request.connectionId,
        provider: request.provider,
      });
      return { outcome };
    },
  };
}

function sessionService() {
  return new ExchangeSessionService(
    new ExchangeSessionAudit({
      record: async () => undefined,
    } as never),
  );
}

function capabilityStub(
  view: {
    capabilities: Array<{ capability: string; state: string }>;
    verifiedAt: string | null;
    verificationFailed: boolean;
  } | null = {
    capabilities: [
      { capability: 'SPOT', state: 'SUPPORTED' },
      { capability: 'MARGIN', state: 'UNAVAILABLE' },
      { capability: 'FUTURES', state: 'UNKNOWN' },
      { capability: 'TESTNET', state: 'UNKNOWN' },
      { capability: 'REST', state: 'SUPPORTED' },
      { capability: 'WEBSOCKET', state: 'UNKNOWN' },
      { capability: 'WITHDRAW', state: 'UNAVAILABLE' },
      { capability: 'DEPOSIT', state: 'UNKNOWN' },
    ],
    verifiedAt: '2026-08-17T19:00:00.000Z',
    verificationFailed: false,
  },
) {
  const cache = new Map<string, NonNullable<typeof view>>();
  const verifyCalls: Array<{
    workspaceId: string;
    connectionId: string;
    handshakeSucceeded: boolean;
  }> = [];
  const cleared: Array<{ workspaceId: string; connectionId: string }> = [];
  return {
    verifyCalls,
    cleared,
    projection: (
      workspaceId: string,
      connectionId: string,
      connectionType: string,
      status: string,
    ) => {
      if (connectionType !== 'EXCHANGE' || status !== 'CONNECTED') {
        return null;
      }
      return cache.get(`${workspaceId}:${connectionId}`) ?? null;
    },
    verify: async (request: {
      workspaceId: string;
      connectionId: string;
      handshakeSucceeded: boolean;
    }) => {
      verifyCalls.push({
        workspaceId: request.workspaceId,
        connectionId: request.connectionId,
        handshakeSucceeded: request.handshakeSucceeded,
      });
      if (!request.handshakeSucceeded || view === null) {
        return null;
      }
      cache.set(`${request.workspaceId}:${request.connectionId}`, view);
      return view;
    },
    clear: (workspaceId: string, connectionId: string) => {
      cleared.push({ workspaceId, connectionId });
      cache.delete(`${workspaceId}:${connectionId}`);
    },
  };
}

function openRouterTestStub(
  outcome:
    | 'CONNECTED'
    | 'VALIDATION_FAILED'
    | 'HANDSHAKE_TIMEOUT'
    | 'PROVIDER_UNAVAILABLE'
    | 'AUTHENTICATION_FAILED' = 'CONNECTED',
) {
  const calls: Array<{ workspaceId: string; connectionId: string; vaultSecretId: string }> = [];
  return {
    calls,
    perform: async (request: {
      workspaceId: string;
      connectionId: string;
      vaultSecretId: string;
    }) => {
      calls.push({
        workspaceId: request.workspaceId,
        connectionId: request.connectionId,
        vaultSecretId: request.vaultSecretId,
      });
      return {
        outcome,
        vendorVisibleMessage:
          outcome === 'CONNECTED'
            ? 'OpenRouter accepted the workspace API key.'
            : 'OpenRouter connectivity test failed.',
      };
    },
  };
}

function openRouterConnectivityStub() {
  const cleared: Array<{ workspaceId: string; connectionId: string }> = [];
  return {
    cleared,
    projection: (
      _workspaceId: string,
      _connectionId: string,
      connectionType: string,
      provider: string,
      status: string,
      credentialsStored: boolean,
    ) => {
      if (connectionType !== 'AI' || provider !== 'OPENROUTER') return null;
      if (status === 'DISABLED') return { status: 'DISABLED', lastTestResult: null };
      if (status === 'CONNECTED') return { status: 'CONNECTED', lastTestResult: null };
      if (
        status === 'VALIDATION_FAILED' ||
        status === 'AUTHENTICATION_FAILED' ||
        status === 'HANDSHAKE_TIMEOUT' ||
        status === 'PROVIDER_UNAVAILABLE'
      ) {
        return { status: 'CONNECTION_FAILED', lastTestResult: null };
      }
      return {
        status: credentialsStored ? 'CONFIGURED' : 'NOT_CONFIGURED',
        lastTestResult: null,
      };
    },
    clear: (workspaceId: string, connectionId: string) => {
      cleared.push({ workspaceId, connectionId });
    },
  };
}

function openRouterAuditStub() {
  const events: Array<{ kind: string; workspaceId: string; connectionId: string }> = [];
  return {
    events,
    created: async (input: { workspaceId: string; connectionId: string }) => {
      events.push({
        kind: 'created',
        workspaceId: input.workspaceId,
        connectionId: input.connectionId,
      });
    },
    updated: async (input: { workspaceId: string; connectionId: string }) => {
      events.push({
        kind: 'updated',
        workspaceId: input.workspaceId,
        connectionId: input.connectionId,
      });
    },
    disabled: async (input: { workspaceId: string; connectionId: string }) => {
      events.push({
        kind: 'disabled',
        workspaceId: input.workspaceId,
        connectionId: input.connectionId,
      });
    },
    tested: async () => undefined,
  };
}

function openRouterAiRequestStub() {
  const cleared: Array<{ workspaceId: string; connectionId: string }> = [];
  return {
    cleared,
    clear: (workspaceId: string, connectionId: string) => {
      cleared.push({ workspaceId, connectionId });
    },
    execute: async () => {
      throw new Error('AI request stub should not execute in ConnectionsService tests');
    },
    lastResult: () => null,
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
      handshakeStub() as never,
      sessionService() as never,
      capabilityStub() as never,
      openRouterTestStub() as never,
      openRouterConnectivityStub() as never,
      openRouterAuditStub() as never,
      openRouterAiRequestStub() as never,
    );
    const connection = await service.create({
      workspaceId: 'workspace-a',
      actorUserId: 'user-a',
      displayName: ' Primary Binance ',
      environment: 'live',
      provider: 'BINANCE',
    });

    expect(connection).toMatchObject({
      workspaceId: 'workspace-a',
      displayName: 'Primary Binance',
      provider: 'BINANCE',
      connectionType: 'EXCHANGE',
      environment: 'live',
      status: 'DISCONNECTED',
      exchangeProvider: {
        id: 'BINANCE',
        displayName: 'Binance',
        category: 'EXCHANGE',
        availability: 'AVAILABLE',
      },
    });
    expect(connection.exchangeProvider?.capabilities).toEqual([
      'SPOT',
      'FUTURES',
      'TESTNET',
      'MARGIN',
      'WEBSOCKET',
      'REST',
    ]);
    expect(JSON.stringify(connection)).not.toMatch(/apiKey|password|token|secret|ciphertext/i);
  });

  it('keeps CRUD metadata inside the owning workspace', async () => {
    const service = new ConnectionsService(
      memoryPrisma() as never,
      memoryVault() as never,
      successfulValidator(),
      validationAudit() as never,
      lifecycleAudit() as never,
      handshakeStub() as never,
      sessionService() as never,
      capabilityStub() as never,
      openRouterTestStub() as never,
      openRouterConnectivityStub() as never,
      openRouterAuditStub() as never,
      openRouterAiRequestStub() as never,
    );
    const created = await service.create({
      workspaceId: 'workspace-a',
      actorUserId: 'user-a',
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
    expect(renamed.exchangeProvider).toBeNull();
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
      handshakeStub() as never,
      sessionService() as never,
      capabilityStub() as never,
      openRouterTestStub() as never,
      openRouterConnectivityStub() as never,
      openRouterAuditStub() as never,
      openRouterAiRequestStub() as never,
    );
    const created = await service.create({
      workspaceId: 'workspace-a',
      actorUserId: 'user-a',
      displayName: 'Primary Binance',
      environment: 'live',
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
    const handshake = handshakeStub();
    const service = new ConnectionsService(
      memoryPrisma() as never,
      vault as never,
      successfulValidator(),
      audit as never,
      lifecycleAudit() as never,
      handshake as never,
      sessionService() as never,
      capabilityStub() as never,
      openRouterTestStub() as never,
      openRouterConnectivityStub() as never,
      openRouterAuditStub() as never,
      openRouterAiRequestStub() as never,
    );
    const created = await service.create({
      workspaceId: 'workspace-a',
      actorUserId: 'user-a',
      displayName: 'Workspace Telegram',
      provider: 'TELEGRAM',
    });
    await service.storeCredentials({
      workspaceId: 'workspace-a',
      actorUserId: 'operator-a',
      actorRole: Role.Trader,
      id: created.id,
      credentials: { botToken: 'token-one' },
    });

    const validated = await service.validate({
      workspaceId: 'workspace-a',
      actorUserId: 'operator-a',
      actorRole: Role.Trader,
      id: created.id,
    });

    expect(validated.status).toBe('CONNECTED');
    expect(audit.events.map((event) => event.outcome)).toEqual(['started', 'succeeded']);
    expect(vault.retrieveCalls).toHaveLength(1);
    expect(handshake.calls).toEqual([]);
    expect(JSON.stringify(validated)).not.toContain('token-one');

    const replaced = await service.replaceCredentials({
      workspaceId: 'workspace-a',
      actorUserId: 'operator-a',
      actorRole: Role.Trader,
      id: created.id,
      credentials: { botToken: 'token-two' },
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
      handshakeStub() as never,
      sessionService() as never,
      capabilityStub() as never,
      openRouterTestStub() as never,
      openRouterConnectivityStub() as never,
      openRouterAuditStub() as never,
      openRouterAiRequestStub() as never,
    );
    const created = await service.create({
      workspaceId: 'workspace-a',
      actorUserId: 'user-a',
      displayName: 'Workspace Telegram',
      provider: 'TELEGRAM',
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
      handshakeStub() as never,
      sessionService() as never,
      capabilityStub() as never,
      openRouterTestStub() as never,
      openRouterConnectivityStub() as never,
      openRouterAuditStub() as never,
      openRouterAiRequestStub() as never,
    );
    const created = await service.create({
      workspaceId: 'workspace-a',
      actorUserId: 'user-a',
      displayName: 'Primary Binance',
      environment: 'live',
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

describe('ConnectionsService exchange provider reference (W2-S02-a)', () => {
  it('projects the exchange catalog onto Connections without changing lifecycle', async () => {
    const service = new ConnectionsService(
      memoryPrisma() as never,
      memoryVault() as never,
      successfulValidator(),
      validationAudit() as never,
      lifecycleAudit() as never,
      handshakeStub() as never,
      sessionService() as never,
      capabilityStub() as never,
      openRouterTestStub() as never,
      openRouterConnectivityStub() as never,
      openRouterAuditStub() as never,
      openRouterAiRequestStub() as never,
    );

    const catalog = service.catalog();
    expect(catalog.exchangeProviders.map((provider) => provider.id)).toEqual([
      'BINANCE',
      'BYBIT',
      'OKX',
    ]);
    expect(
      catalog.exchangeProviders.every((provider) => provider.capabilities.includes('REST')),
    ).toBe(true);
    expect(JSON.stringify(catalog)).not.toMatch(/https?:\/\//);
    expect(JSON.stringify(catalog)).not.toContain('Trading enabled');
  });

  it('keeps an Exchange connection reference inside the owning workspace', async () => {
    const service = new ConnectionsService(
      memoryPrisma() as never,
      memoryVault() as never,
      successfulValidator(),
      validationAudit() as never,
      lifecycleAudit() as never,
      handshakeStub() as never,
      sessionService() as never,
      capabilityStub() as never,
      openRouterTestStub() as never,
      openRouterConnectivityStub() as never,
      openRouterAuditStub() as never,
      openRouterAiRequestStub() as never,
    );
    const created = await service.create({
      workspaceId: 'workspace-a',
      actorUserId: 'user-a',
      displayName: 'Primary Binance',
      environment: 'live',
      provider: 'BINANCE',
    });

    expect(created.exchangeProvider?.id).toBe('BINANCE');
    await expect(service.get('workspace-b', created.id)).rejects.toThrow('Connection not found');
    await expect(service.list('workspace-b')).resolves.toEqual([]);
    expect((await service.get('workspace-a', created.id)).exchangeProvider?.displayName).toBe(
      'Binance',
    );
  });
});

describe('ConnectionsService exchange handshake (W2-S02-b)', () => {
  async function credentialedExchange(
    handshake: ReturnType<typeof handshakeStub>,
    provider: 'BINANCE' | 'BYBIT' | 'OKX' = 'BINANCE',
  ) {
    const vault = memoryVault();
    const service = new ConnectionsService(
      memoryPrisma() as never,
      vault as never,
      successfulValidator(),
      validationAudit() as never,
      lifecycleAudit() as never,
      handshake as never,
      sessionService() as never,
      capabilityStub() as never,
      openRouterTestStub() as never,
      openRouterConnectivityStub() as never,
      openRouterAuditStub() as never,
      openRouterAiRequestStub() as never,
    );
    const created = await service.create({
      workspaceId: 'workspace-a',
      actorUserId: 'user-a',
      displayName: `${provider} connection`,
      environment: 'live',
      provider,
    });
    await service.storeCredentials({
      workspaceId: 'workspace-a',
      actorUserId: 'operator-a',
      actorRole: Role.Trader,
      id: created.id,
      credentials: { apiKey: 'key-one', apiSecret: 'secret-one' },
    });
    return { service, vault, created };
  }

  it('FIV-CONN-03: EXCHANGE + NULL environment FAIL CLOSED before handshake/Vault', async () => {
    const now = new Date('2026-09-17T12:00:00.000Z');
    const handshake = handshakeStub('CONNECTED');
    const vault = memoryVault();
    const seeded = memoryPrisma([
      {
        id: 'null-env-exchange',
        workspaceId: 'workspace-a',
        displayName: 'Legacy NULL EXCHANGE',
        provider: 'BINANCE',
        connectionType: 'EXCHANGE',
        environment: null,
        vaultSecretId: 'vault-secret-legacy',
        status: 'DISCONNECTED',
        createdAt: now,
        updatedAt: now,
      },
    ]);
    const service = new ConnectionsService(
      seeded as never,
      vault as never,
      successfulValidator(),
      validationAudit() as never,
      lifecycleAudit() as never,
      handshake as never,
      sessionService() as never,
      capabilityStub() as never,
      openRouterTestStub() as never,
      openRouterConnectivityStub() as never,
      openRouterAuditStub() as never,
      openRouterAiRequestStub() as never,
    );

    const validated = await service.validate({
      workspaceId: 'workspace-a',
      actorUserId: 'operator-a',
      actorRole: Role.Trader,
      id: 'null-env-exchange',
    });

    expect(validated.status).toBe('VALIDATION_FAILED');
    expect(handshake.calls).toEqual([]);
    expect(vault.retrieveCalls).toEqual([]);
  });

  it('assigns Connected only after the handshake service reports authenticated communication', async () => {
    const handshake = handshakeStub('CONNECTED');
    const { service, vault, created } = await credentialedExchange(handshake);

    const validated = await service.validate({
      workspaceId: 'workspace-a',
      actorUserId: 'operator-a',
      actorRole: Role.Trader,
      id: created.id,
    });

    expect(validated.status).toBe('CONNECTED');
    expect(vault.retrieveCalls).toEqual([]);
    expect(handshake.calls).toEqual([
      { workspaceId: 'workspace-a', connectionId: created.id, provider: 'BINANCE' },
    ]);
    expect(JSON.stringify(validated)).not.toMatch(/apiKey|apiSecret|key-one|secret-one/i);
    expect(JSON.stringify(validated)).not.toContain('Trading enabled');
  });

  it('maps handshake failures to honest operator-safe statuses', async () => {
    const cases = [
      ['VALIDATION_FAILED', 'VALIDATION_FAILED'],
      ['HANDSHAKE_TIMEOUT', 'HANDSHAKE_TIMEOUT'],
      ['PROVIDER_UNAVAILABLE', 'PROVIDER_UNAVAILABLE'],
      ['AUTHENTICATION_FAILED', 'AUTHENTICATION_FAILED'],
    ] as const;

    for (const [outcome, status] of cases) {
      const handshake = handshakeStub(outcome);
      const { service, vault, created } = await credentialedExchange(handshake);
      const validated = await service.validate({
        workspaceId: 'workspace-a',
        actorUserId: 'operator-a',
        actorRole: Role.Trader,
        id: created.id,
      });
      expect(validated.status).toBe(status);
      expect(vault.retrieveCalls).toEqual([]);
      expect(JSON.stringify(validated)).not.toContain('secret-one');
    }
  });

  it('keeps exchange handshake inside the owning workspace', async () => {
    const handshake = handshakeStub('CONNECTED');
    const { service, created } = await credentialedExchange(handshake);

    await expect(
      service.validate({
        workspaceId: 'workspace-b',
        actorUserId: 'operator-b',
        actorRole: Role.Trader,
        id: created.id,
      }),
    ).rejects.toThrow('Connection not found');
    expect(handshake.calls).toEqual([]);
  });
});

describe('ConnectionsService exchange session health (W2-S02-c)', () => {
  function sessionWithAudit() {
    const events: Array<{ outcome: string; workspaceId: string; connectionId: string }> = [];
    const service = new ExchangeSessionService(
      new ExchangeSessionAudit({
        record: async (write: {
          outcome: string;
          attribution: { workspaceId: string; resourceId: string };
        }) => {
          events.push({
            outcome: write.outcome,
            workspaceId: write.attribution.workspaceId,
            connectionId: write.attribution.resourceId,
          });
        },
      } as never),
    );
    return { events, service };
  }

  async function credentialedWithSession(
    handshake: ReturnType<typeof handshakeStub> = handshakeStub('CONNECTED'),
    capabilities: ReturnType<typeof capabilityStub> = capabilityStub(),
  ) {
    const sessions = sessionWithAudit();
    const vault = memoryVault();
    const service = new ConnectionsService(
      memoryPrisma() as never,
      vault as never,
      successfulValidator(),
      validationAudit() as never,
      lifecycleAudit() as never,
      handshake as never,
      sessions.service,
      capabilities as never,
      openRouterTestStub() as never,
      openRouterConnectivityStub() as never,
      openRouterAuditStub() as never,
      openRouterAiRequestStub() as never,
    );
    const created = await service.create({
      workspaceId: 'workspace-a',
      actorUserId: 'user-a',
      displayName: 'Primary Binance',
      environment: 'live',
      provider: 'BINANCE',
    });
    await service.storeCredentials({
      workspaceId: 'workspace-a',
      actorUserId: 'operator-a',
      actorRole: Role.Trader,
      id: created.id,
      credentials: { apiKey: 'key-one', apiSecret: 'secret-one' },
    });
    return { service, vault, created, handshake, sessions, capabilities };
  }

  it('projects a healthy session only after authenticated handshake succeeds', async () => {
    const { service, vault, created, sessions } = await credentialedWithSession();

    const validated = await service.validate({
      workspaceId: 'workspace-a',
      actorUserId: 'operator-a',
      actorRole: Role.Trader,
      id: created.id,
    });

    expect(validated.status).toBe('CONNECTED');
    expect(validated.session).toEqual({
      state: 'CONNECTED',
      health: 'HEALTHY',
      reconnectRequired: false,
      reconnectAllowed: false,
      providerAvailability: 'AVAILABLE',
    });
    expect(sessions.events.map((event) => event.outcome)).toEqual(['session_established']);
    expect(vault.retrieveCalls).toEqual([]);
    expect(JSON.stringify(validated)).not.toMatch(/apiKey|apiSecret|key-one|secret-one/i);
    expect(JSON.stringify(validated)).not.toContain('Trading enabled');
  });

  it('observes session expiry and lost connection as reconnect-required health states', async () => {
    const expiredCase = await credentialedWithSession();
    await expiredCase.service.validate({
      workspaceId: 'workspace-a',
      actorUserId: 'operator-a',
      actorRole: Role.Trader,
      id: expiredCase.created.id,
    });
    const expired = await expiredCase.service.observeSession({
      workspaceId: 'workspace-a',
      actorUserId: 'operator-a',
      id: expiredCase.created.id,
      observation: 'SESSION_EXPIRED',
    });
    expect(expired).toMatchObject({
      status: 'SESSION_EXPIRED',
      session: {
        state: 'SESSION_EXPIRED',
        health: 'EXPIRED',
        reconnectRequired: true,
        providerAvailability: 'UNKNOWN',
      },
    });
    expect(expiredCase.sessions.events.map((event) => event.outcome)).toEqual([
      'session_established',
      'session_expired',
      'reconnect_required',
    ]);

    const lostCase = await credentialedWithSession();
    await lostCase.service.validate({
      workspaceId: 'workspace-a',
      actorUserId: 'operator-a',
      actorRole: Role.Trader,
      id: lostCase.created.id,
    });
    const lost = await lostCase.service.observeSession({
      workspaceId: 'workspace-a',
      actorUserId: 'operator-a',
      id: lostCase.created.id,
      observation: 'CONNECTION_LOST',
    });
    expect(lost.session).toMatchObject({
      state: 'CONNECTION_LOST',
      health: 'CONNECTION_LOST',
      reconnectRequired: true,
    });
    expect(lostCase.vault.retrieveCalls).toEqual([]);
  });

  it('observes provider unavailability from a connected session', async () => {
    const { service, created } = await credentialedWithSession();
    await service.validate({
      workspaceId: 'workspace-a',
      actorUserId: 'operator-a',
      actorRole: Role.Trader,
      id: created.id,
    });
    const unavailable = await service.observeSession({
      workspaceId: 'workspace-a',
      actorUserId: 'operator-a',
      id: created.id,
      observation: 'PROVIDER_UNAVAILABLE',
    });
    expect(unavailable.session).toEqual({
      state: 'PROVIDER_UNAVAILABLE',
      health: 'UNAVAILABLE',
      reconnectRequired: true,
      reconnectAllowed: true,
      providerAvailability: 'UNAVAILABLE',
    });
  });

  it('keeps session observation inside the owning workspace and rejects illegal transitions', async () => {
    const { service, created } = await credentialedWithSession();
    await service.validate({
      workspaceId: 'workspace-a',
      actorUserId: 'operator-a',
      actorRole: Role.Trader,
      id: created.id,
    });

    await expect(
      service.observeSession({
        workspaceId: 'workspace-b',
        actorUserId: 'operator-b',
        id: created.id,
        observation: 'CONNECTION_LOST',
      }),
    ).rejects.toThrow('Connection not found');

    const disconnected = await service.disconnect({
      workspaceId: 'workspace-a',
      actorUserId: 'operator-a',
      id: created.id,
    });
    expect(disconnected.session?.state).toBe('DISCONNECTED');
    expect(disconnected.session?.reconnectRequired).toBe(false);
    await expect(
      service.observeSession({
        workspaceId: 'workspace-a',
        actorUserId: 'operator-a',
        id: created.id,
        observation: 'SESSION_EXPIRED',
      }),
    ).rejects.toThrow('Exchange session cannot transition');
  });

  it('does not project or observe an exchange session for notification connections', async () => {
    const service = new ConnectionsService(
      memoryPrisma() as never,
      memoryVault() as never,
      successfulValidator(),
      validationAudit() as never,
      lifecycleAudit() as never,
      handshakeStub() as never,
      sessionService() as never,
      capabilityStub() as never,
      openRouterTestStub() as never,
      openRouterConnectivityStub() as never,
      openRouterAuditStub() as never,
      openRouterAiRequestStub() as never,
    );
    const created = await service.create({
      workspaceId: 'workspace-a',
      actorUserId: 'user-a',
      displayName: 'Telegram alerts',
      provider: 'TELEGRAM',
    });
    expect(created.session).toBeNull();
    expect(created.capabilities).toBeNull();
    await expect(
      service.observeSession({
        workspaceId: 'workspace-a',
        actorUserId: 'operator-a',
        id: created.id,
        observation: 'CONNECTION_LOST',
      }),
    ).rejects.toThrow('Session observations apply only to Exchange connections.');
  });
});

describe('ConnectionsService exchange capability verification (W2-S02-d)', () => {
  it('verifies capabilities only after authenticated handshake succeeds', async () => {
    const capabilities = capabilityStub();
    const sessions = new ExchangeSessionService(
      new ExchangeSessionAudit({ record: async () => undefined } as never),
    );
    const vault = memoryVault();
    const connected = new ConnectionsService(
      memoryPrisma() as never,
      vault as never,
      successfulValidator(),
      validationAudit() as never,
      lifecycleAudit() as never,
      handshakeStub('CONNECTED') as never,
      sessions as never,
      capabilities as never,
      openRouterTestStub() as never,
      openRouterConnectivityStub() as never,
      openRouterAuditStub() as never,
      openRouterAiRequestStub() as never,
    );
    const created = await connected.create({
      workspaceId: 'workspace-a',
      actorUserId: 'user-a',
      displayName: 'Primary Binance',
      environment: 'live',
      provider: 'BINANCE',
    });
    await connected.storeCredentials({
      workspaceId: 'workspace-a',
      actorUserId: 'operator-a',
      actorRole: Role.Trader,
      id: created.id,
      credentials: { apiKey: 'key-one', apiSecret: 'secret-one' },
    });

    const validated = await connected.validate({
      workspaceId: 'workspace-a',
      actorUserId: 'operator-a',
      actorRole: Role.Trader,
      id: created.id,
    });

    expect(validated.status).toBe('CONNECTED');
    expect(validated.session?.state).toBe('CONNECTED');
    expect(validated.capabilities).toEqual({
      capabilities: [
        { capability: 'SPOT', state: 'SUPPORTED' },
        { capability: 'MARGIN', state: 'UNAVAILABLE' },
        { capability: 'FUTURES', state: 'UNKNOWN' },
        { capability: 'TESTNET', state: 'UNKNOWN' },
        { capability: 'REST', state: 'SUPPORTED' },
        { capability: 'WEBSOCKET', state: 'UNKNOWN' },
        { capability: 'WITHDRAW', state: 'UNAVAILABLE' },
        { capability: 'DEPOSIT', state: 'UNKNOWN' },
      ],
      verifiedAt: '2026-08-17T19:00:00.000Z',
      verificationFailed: false,
    });
    expect(capabilities.verifyCalls).toEqual([
      { workspaceId: 'workspace-a', connectionId: created.id, handshakeSucceeded: true },
    ]);
    expect(JSON.stringify(validated)).not.toMatch(/apiKey|apiSecret|key-one|secret-one/i);
    expect(JSON.stringify(validated)).not.toContain('Trading enabled');
  });

  it('does not verify capabilities when handshake fails', async () => {
    const capabilities = capabilityStub();
    const service = new ConnectionsService(
      memoryPrisma() as never,
      memoryVault() as never,
      successfulValidator(),
      validationAudit() as never,
      lifecycleAudit() as never,
      handshakeStub('AUTHENTICATION_FAILED') as never,
      sessionService() as never,
      capabilities as never,
      openRouterTestStub() as never,
      openRouterConnectivityStub() as never,
      openRouterAuditStub() as never,
      openRouterAiRequestStub() as never,
    );
    const created = await service.create({
      workspaceId: 'workspace-a',
      actorUserId: 'user-a',
      displayName: 'Primary Binance',
      environment: 'live',
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
    expect(failed.status).toBe('AUTHENTICATION_FAILED');
    expect(failed.capabilities).toBeNull();
    expect(capabilities.verifyCalls).toEqual([]);
  });

  it('keeps the authenticated session when capability verification fails', async () => {
    const capabilities = capabilityStub({
      capabilities: [
        { capability: 'SPOT', state: 'VERIFICATION_FAILED' },
        { capability: 'MARGIN', state: 'VERIFICATION_FAILED' },
        { capability: 'FUTURES', state: 'VERIFICATION_FAILED' },
        { capability: 'TESTNET', state: 'VERIFICATION_FAILED' },
        { capability: 'REST', state: 'SUPPORTED' },
        { capability: 'WEBSOCKET', state: 'VERIFICATION_FAILED' },
        { capability: 'WITHDRAW', state: 'VERIFICATION_FAILED' },
        { capability: 'DEPOSIT', state: 'VERIFICATION_FAILED' },
      ],
      verifiedAt: '2026-08-17T19:00:00.000Z',
      verificationFailed: true,
    });
    const service = new ConnectionsService(
      memoryPrisma() as never,
      memoryVault() as never,
      successfulValidator(),
      validationAudit() as never,
      lifecycleAudit() as never,
      handshakeStub('CONNECTED') as never,
      sessionService() as never,
      capabilities as never,
      openRouterTestStub() as never,
      openRouterConnectivityStub() as never,
      openRouterAuditStub() as never,
      openRouterAiRequestStub() as never,
    );
    const created = await service.create({
      workspaceId: 'workspace-a',
      actorUserId: 'user-a',
      displayName: 'Primary Binance',
      environment: 'live',
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
    expect(validated.session?.state).toBe('CONNECTED');
    expect(validated.capabilities?.verificationFailed).toBe(true);
    expect(
      validated.capabilities?.capabilities.find((item) => item.capability === 'REST')?.state,
    ).toBe('SUPPORTED');
  });

  it('keeps workspace isolation and clears capabilities when the session ends', async () => {
    const capabilities = capabilityStub();
    const service = new ConnectionsService(
      memoryPrisma() as never,
      memoryVault() as never,
      successfulValidator(),
      validationAudit() as never,
      lifecycleAudit() as never,
      handshakeStub('CONNECTED') as never,
      sessionService() as never,
      capabilities as never,
      openRouterTestStub() as never,
      openRouterConnectivityStub() as never,
      openRouterAuditStub() as never,
      openRouterAiRequestStub() as never,
    );
    const created = await service.create({
      workspaceId: 'workspace-a',
      actorUserId: 'user-a',
      displayName: 'Primary Binance',
      environment: 'live',
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

    await expect(service.get('workspace-b', created.id)).rejects.toThrow('Connection not found');

    const disconnected = await service.disconnect({
      workspaceId: 'workspace-a',
      actorUserId: 'operator-a',
      id: created.id,
    });
    expect(disconnected.status).toBe('DISCONNECTED');
    expect(disconnected.capabilities).toBeNull();
    expect(capabilities.cleared).toEqual(
      expect.arrayContaining([{ workspaceId: 'workspace-a', connectionId: created.id }]),
    );
  });
});

describe('ConnectionsService OpenRouter connectivity (W2-S05-a)', () => {
  it('projects OpenRouter connectivity and runs a vendor connection test', async () => {
    const openRouterTests = openRouterTestStub('CONNECTED');
    const openRouterAudit = openRouterAuditStub();
    const vault = memoryVault();
    const service = new ConnectionsService(
      memoryPrisma() as never,
      vault as never,
      successfulValidator(),
      validationAudit() as never,
      lifecycleAudit() as never,
      handshakeStub() as never,
      sessionService() as never,
      capabilityStub() as never,
      openRouterTests as never,
      openRouterConnectivityStub() as never,
      openRouterAudit as never,
      openRouterAiRequestStub() as never,
    );

    const created = await service.create({
      workspaceId: 'workspace-a',
      actorUserId: 'user-a',
      displayName: 'Workspace OpenRouter',
      provider: 'OPENROUTER',
    });
    expect(created.openRouterConnectivity).toEqual({
      status: 'NOT_CONFIGURED',
      lastTestResult: null,
    });
    expect(openRouterAudit.events).toEqual([
      { kind: 'created', workspaceId: 'workspace-a', connectionId: created.id },
    ]);

    const stored = await service.storeCredentials({
      workspaceId: 'workspace-a',
      actorUserId: 'user-a',
      actorRole: Role.Admin,
      id: created.id,
      credentials: { apiKey: 'sk-or-workspace-a' },
    });
    expect(stored.openRouterConnectivity?.status).toBe('CONFIGURED');
    expect(openRouterAudit.events).toContainEqual({
      kind: 'updated',
      workspaceId: 'workspace-a',
      connectionId: created.id,
    });

    const validated = await service.validate({
      workspaceId: 'workspace-a',
      actorUserId: 'user-a',
      actorRole: Role.Admin,
      id: created.id,
    });
    expect(validated.status).toBe('CONNECTED');
    expect(validated.openRouterConnectivity?.status).toBe('CONNECTED');
    expect(openRouterTests.calls).toEqual([
      {
        workspaceId: 'workspace-a',
        connectionId: created.id,
        vaultSecretId: 'vault-secret-1',
      },
    ]);
    expect(vault.retrieveCalls).toEqual([]);
  });

  it('maps OpenRouter authentication failure to Connection Failed', async () => {
    const service = new ConnectionsService(
      memoryPrisma() as never,
      memoryVault() as never,
      successfulValidator(),
      validationAudit() as never,
      lifecycleAudit() as never,
      handshakeStub() as never,
      sessionService() as never,
      capabilityStub() as never,
      openRouterTestStub('AUTHENTICATION_FAILED') as never,
      openRouterConnectivityStub() as never,
      openRouterAuditStub() as never,
      openRouterAiRequestStub() as never,
    );
    const created = await service.create({
      workspaceId: 'workspace-a',
      actorUserId: 'user-a',
      displayName: 'Workspace OpenRouter',
      provider: 'OPENROUTER',
    });
    await service.storeCredentials({
      workspaceId: 'workspace-a',
      actorUserId: 'user-a',
      actorRole: Role.Admin,
      id: created.id,
      credentials: { apiKey: 'sk-or-bad' },
    });
    const failed = await service.validate({
      workspaceId: 'workspace-a',
      actorUserId: 'user-a',
      actorRole: Role.Admin,
      id: created.id,
    });
    expect(failed.status).toBe('AUTHENTICATION_FAILED');
    expect(failed.openRouterConnectivity?.status).toBe('CONNECTION_FAILED');
  });

  it('keeps OpenRouter connection test inside the owning workspace', async () => {
    const openRouterTests = openRouterTestStub('CONNECTED');
    const service = new ConnectionsService(
      memoryPrisma() as never,
      memoryVault() as never,
      successfulValidator(),
      validationAudit() as never,
      lifecycleAudit() as never,
      handshakeStub() as never,
      sessionService() as never,
      capabilityStub() as never,
      openRouterTests as never,
      openRouterConnectivityStub() as never,
      openRouterAuditStub() as never,
      openRouterAiRequestStub() as never,
    );
    const created = await service.create({
      workspaceId: 'workspace-a',
      actorUserId: 'user-a',
      displayName: 'Workspace OpenRouter',
      provider: 'OPENROUTER',
    });
    await service.storeCredentials({
      workspaceId: 'workspace-a',
      actorUserId: 'user-a',
      actorRole: Role.Admin,
      id: created.id,
      credentials: { apiKey: 'sk-or-workspace-a' },
    });

    await expect(
      service.validate({
        workspaceId: 'workspace-b',
        actorUserId: 'user-a',
        actorRole: Role.Admin,
        id: created.id,
      }),
    ).rejects.toThrow('Connection not found');
    expect(openRouterTests.calls).toEqual([]);
  });

  it('emits OpenRouter disabled audit and projects Disabled', async () => {
    const openRouterAudit = openRouterAuditStub();
    const service = new ConnectionsService(
      memoryPrisma() as never,
      memoryVault() as never,
      successfulValidator(),
      validationAudit() as never,
      lifecycleAudit() as never,
      handshakeStub() as never,
      sessionService() as never,
      capabilityStub() as never,
      openRouterTestStub() as never,
      openRouterConnectivityStub() as never,
      openRouterAudit as never,
      openRouterAiRequestStub() as never,
    );
    const created = await service.create({
      workspaceId: 'workspace-a',
      actorUserId: 'user-a',
      displayName: 'Workspace OpenRouter',
      provider: 'OPENROUTER',
    });
    const disabled = await service.disable({
      workspaceId: 'workspace-a',
      actorUserId: 'user-a',
      id: created.id,
    });
    expect(disabled.openRouterConnectivity?.status).toBe('DISABLED');
    expect(openRouterAudit.events).toContainEqual({
      kind: 'disabled',
      workspaceId: 'workspace-a',
      connectionId: created.id,
    });
  });
});

describe('ConnectionsService environment model (FIV-CONN-01)', () => {
  function service() {
    return new ConnectionsService(
      memoryPrisma() as never,
      memoryVault() as never,
      successfulValidator(),
      validationAudit() as never,
      lifecycleAudit() as never,
      handshakeStub() as never,
      sessionService() as never,
      capabilityStub() as never,
      openRouterTestStub() as never,
      openRouterConnectivityStub() as never,
      openRouterAuditStub() as never,
      openRouterAiRequestStub() as never,
    );
  }

  it('represents LIVE and TESTNET exchange environments without exposing secrets', async () => {
    const svc = service();
    const live = await svc.create({
      workspaceId: 'workspace-a',
      actorUserId: 'user-a',
      displayName: 'Live Binance',
      environment: 'live',
      provider: 'BINANCE',
    });
    const testnet = await svc.create({
      workspaceId: 'workspace-a',
      actorUserId: 'user-a',
      displayName: 'Testnet Binance',
      environment: 'testnet',
      provider: 'BINANCE',
    });

    expect(live.environment).toBe('live');
    expect(testnet.environment).toBe('testnet');
    expect(live.credentialsStored).toBe(false);
    expect(JSON.stringify(live)).not.toMatch(/apiKey|password|token|secret|ciphertext/i);
    expect(JSON.stringify(testnet)).not.toMatch(/apiKey|password|token|secret|ciphertext/i);
  });

  it('rejects omitted and demo environments for exchange creates (no implicit LIVE)', async () => {
    const svc = service();
    await expect(
      svc.create({
        workspaceId: 'workspace-a',
        actorUserId: 'user-a',
        displayName: 'Missing env',
        provider: 'BINANCE',
      }),
    ).rejects.toThrow(/Environment is required/i);
    await expect(
      svc.create({
        workspaceId: 'workspace-a',
        actorUserId: 'user-a',
        displayName: 'Demo env',
        environment: 'demo',
        provider: 'BINANCE',
      }),
    ).rejects.toThrow(/live or testnet/i);
  });

  it('preserves null environment for notification creates and seeded legacy rows', async () => {
    const telegram = await service().create({
      workspaceId: 'workspace-a',
      actorUserId: 'user-a',
      displayName: 'Telegram',
      provider: 'TELEGRAM',
    });
    expect(telegram.environment).toBeNull();

    const seeded = new ConnectionsService(
      memoryPrisma([
        {
          id: 'legacy-1',
          workspaceId: 'workspace-a',
          displayName: 'Legacy Binance',
          provider: 'BINANCE',
          connectionType: 'EXCHANGE',
          environment: null,
          vaultSecretId: null,
          status: 'DISCONNECTED',
          createdAt: new Date('2026-08-17T16:00:00.000Z'),
          updatedAt: new Date('2026-08-17T16:00:00.000Z'),
        },
      ]) as never,
      memoryVault() as never,
      successfulValidator(),
      validationAudit() as never,
      lifecycleAudit() as never,
      handshakeStub() as never,
      sessionService() as never,
      capabilityStub() as never,
      openRouterTestStub() as never,
      openRouterConnectivityStub() as never,
      openRouterAuditStub() as never,
      openRouterAiRequestStub() as never,
    );
    const legacy = await seeded.get('workspace-a', 'legacy-1');
    expect(legacy.environment).toBeNull();
  });

  it('keeps environment immutable through rename and workspace-isolated', async () => {
    const svc = service();
    const created = await svc.create({
      workspaceId: 'workspace-a',
      actorUserId: 'user-a',
      displayName: 'Primary Binance',
      environment: 'testnet',
      provider: 'BINANCE',
    });
    const renamed = await svc.rename('workspace-a', created.id, 'Renamed Binance');
    expect(renamed.environment).toBe('testnet');
    expect(renamed.displayName).toBe('Renamed Binance');
    await expect(svc.get('workspace-b', created.id)).rejects.toThrow('Connection not found');
    await expect(svc.rename('workspace-b', created.id, 'Foreign')).rejects.toThrow(
      'Connection not found',
    );
  });
});

describe('ConnectionsService provider+environment uniqueness (FIV-CONN-02)', () => {
  function service(prisma = memoryPrisma(), vault = memoryVault()) {
    return {
      svc: new ConnectionsService(
        prisma as never,
        vault as never,
        successfulValidator(),
        validationAudit() as never,
        lifecycleAudit() as never,
        handshakeStub() as never,
        sessionService() as never,
        capabilityStub() as never,
        openRouterTestStub() as never,
        openRouterConnectivityStub() as never,
        openRouterAuditStub() as never,
        openRouterAiRequestStub() as never,
      ),
      vault,
    };
  }

  const actor = {
    actorUserId: 'user-a',
    actorRole: Role.Admin,
  } as const;

  async function createExchange(
    svc: ConnectionsService,
    input: {
      workspaceId: string;
      displayName: string;
      environment: 'live' | 'testnet';
      provider?: string;
    },
  ) {
    return svc.create({
      workspaceId: input.workspaceId,
      actorUserId: actor.actorUserId,
      displayName: input.displayName,
      environment: input.environment,
      provider: input.provider ?? 'BINANCE',
    });
  }

  it('rejects a second credentialed LIVE Connection for the same workspace+provider', async () => {
    const { svc } = service();
    const first = await createExchange(svc, {
      workspaceId: 'workspace-a',
      displayName: 'Live A',
      environment: 'live',
    });
    const second = await createExchange(svc, {
      workspaceId: 'workspace-a',
      displayName: 'Live B',
      environment: 'live',
    });
    await svc.storeCredentials({
      workspaceId: 'workspace-a',
      ...actor,
      id: first.id,
      credentials: { apiKey: 'k1', apiSecret: 's1' },
    });
    await expect(
      svc.storeCredentials({
        workspaceId: 'workspace-a',
        ...actor,
        id: second.id,
        credentials: { apiKey: 'k2', apiSecret: 's2' },
      }),
    ).rejects.toThrow(/provider and environment/i);
  });

  it('rejects a second credentialed TESTNET Connection for the same workspace+provider', async () => {
    const { svc } = service();
    const first = await createExchange(svc, {
      workspaceId: 'workspace-a',
      displayName: 'Test A',
      environment: 'testnet',
    });
    const second = await createExchange(svc, {
      workspaceId: 'workspace-a',
      displayName: 'Test B',
      environment: 'testnet',
    });
    await svc.storeCredentials({
      workspaceId: 'workspace-a',
      ...actor,
      id: first.id,
      credentials: { apiKey: 'k1', apiSecret: 's1' },
    });
    await expect(
      svc.storeCredentials({
        workspaceId: 'workspace-a',
        ...actor,
        id: second.id,
        credentials: { apiKey: 'k2', apiSecret: 's2' },
      }),
    ).rejects.toThrow(/provider and environment/i);
  });

  it('allows credentialed LIVE and TESTNET to coexist for the same workspace+provider', async () => {
    const { svc } = service();
    const live = await createExchange(svc, {
      workspaceId: 'workspace-a',
      displayName: 'Live',
      environment: 'live',
    });
    const testnet = await createExchange(svc, {
      workspaceId: 'workspace-a',
      displayName: 'Testnet',
      environment: 'testnet',
    });
    const liveStored = await svc.storeCredentials({
      workspaceId: 'workspace-a',
      ...actor,
      id: live.id,
      credentials: { apiKey: 'live-k', apiSecret: 'live-s' },
    });
    const testnetStored = await svc.storeCredentials({
      workspaceId: 'workspace-a',
      ...actor,
      id: testnet.id,
      credentials: { apiKey: 'test-k', apiSecret: 'test-s' },
    });
    expect(liveStored.credentialsStored).toBe(true);
    expect(testnetStored.credentialsStored).toBe(true);
    expect(liveStored.environment).toBe('live');
    expect(testnetStored.environment).toBe('testnet');
  });

  it('allows same provider+environment across different workspaces', async () => {
    const { svc } = service();
    const a = await createExchange(svc, {
      workspaceId: 'workspace-a',
      displayName: 'A',
      environment: 'live',
    });
    const b = await createExchange(svc, {
      workspaceId: 'workspace-b',
      displayName: 'B',
      environment: 'live',
    });
    await svc.storeCredentials({
      workspaceId: 'workspace-a',
      ...actor,
      id: a.id,
      credentials: { apiKey: 'a', apiSecret: 'a' },
    });
    const storedB = await svc.storeCredentials({
      workspaceId: 'workspace-b',
      ...actor,
      id: b.id,
      credentials: { apiKey: 'b', apiSecret: 'b' },
    });
    expect(storedB.credentialsStored).toBe(true);
  });

  it('allows different providers with the same environment in one workspace', async () => {
    const { svc } = service();
    const binance = await createExchange(svc, {
      workspaceId: 'workspace-a',
      displayName: 'Binance',
      environment: 'live',
      provider: 'BINANCE',
    });
    const bybit = await createExchange(svc, {
      workspaceId: 'workspace-a',
      displayName: 'Bybit',
      environment: 'live',
      provider: 'BYBIT',
    });
    await svc.storeCredentials({
      workspaceId: 'workspace-a',
      ...actor,
      id: binance.id,
      credentials: { apiKey: 'b', apiSecret: 'b' },
    });
    const stored = await svc.storeCredentials({
      workspaceId: 'workspace-a',
      ...actor,
      id: bybit.id,
      credentials: { apiKey: 'y', apiSecret: 'y' },
    });
    expect(stored.credentialsStored).toBe(true);
  });

  it('allows multiple NULL-environment metadata-only rows and does not treat NULL as LIVE', async () => {
    const prisma = memoryPrisma([
      {
        id: 'null-1',
        workspaceId: 'workspace-a',
        displayName: 'Legacy 1',
        provider: 'BINANCE',
        connectionType: 'EXCHANGE',
        environment: null,
        vaultSecretId: null,
        status: 'DISCONNECTED',
        createdAt: new Date('2026-08-17T16:00:00.000Z'),
        updatedAt: new Date('2026-08-17T16:00:00.000Z'),
      },
      {
        id: 'null-2',
        workspaceId: 'workspace-a',
        displayName: 'Legacy 2',
        provider: 'BINANCE',
        connectionType: 'EXCHANGE',
        environment: null,
        vaultSecretId: null,
        status: 'DISCONNECTED',
        createdAt: new Date('2026-08-17T16:01:00.000Z'),
        updatedAt: new Date('2026-08-17T16:01:00.000Z'),
      },
    ]);
    const { svc } = service(prisma);
    const one = await svc.get('workspace-a', 'null-1');
    const two = await svc.get('workspace-a', 'null-2');
    expect(one.environment).toBeNull();
    expect(two.environment).toBeNull();
    expect(one.environment).not.toBe('live');
  });

  it('does not apply Strategy B uniqueness to non-EXCHANGE credentialed rows', async () => {
    const { svc } = service();
    const first = await svc.create({
      workspaceId: 'workspace-a',
      actorUserId: actor.actorUserId,
      displayName: 'TG1',
      provider: 'TELEGRAM',
    });
    const second = await svc.create({
      workspaceId: 'workspace-a',
      actorUserId: actor.actorUserId,
      displayName: 'TG2',
      provider: 'TELEGRAM',
    });
    // Notification vault slots remain provider/type scoped (omit purpose → notification).
    // First store occupies the notification slot; second conflicts at Vault — not Strategy B env uniqueness.
    await svc.storeCredentials({
      workspaceId: 'workspace-a',
      ...actor,
      id: first.id,
      credentials: { botToken: 'token-1' },
    });
    await expect(
      svc.storeCredentials({
        workspaceId: 'workspace-a',
        ...actor,
        id: second.id,
        credentials: { botToken: 'token-2' },
      }),
    ).rejects.toThrow(/provider and environment/i);
  });

  it('allows a new credentialed Connection after the prior same-env Connection is REVOKED', async () => {
    const { svc } = service();
    const first = await createExchange(svc, {
      workspaceId: 'workspace-a',
      displayName: 'First',
      environment: 'live',
    });
    await svc.storeCredentials({
      workspaceId: 'workspace-a',
      ...actor,
      id: first.id,
      credentials: { apiKey: 'k1', apiSecret: 's1' },
    });
    await svc.revoke({
      workspaceId: 'workspace-a',
      ...actor,
      id: first.id,
    });
    const second = await createExchange(svc, {
      workspaceId: 'workspace-a',
      displayName: 'Second',
      environment: 'live',
    });
    const stored = await svc.storeCredentials({
      workspaceId: 'workspace-a',
      ...actor,
      id: second.id,
      credentials: { apiKey: 'k2', apiSecret: 's2' },
    });
    expect(stored.credentialsStored).toBe(true);
  });

  it('allows multiple metadata-only Connections with the same populated environment', async () => {
    const { svc } = service();
    const a = await createExchange(svc, {
      workspaceId: 'workspace-a',
      displayName: 'Meta A',
      environment: 'live',
    });
    const b = await createExchange(svc, {
      workspaceId: 'workspace-a',
      displayName: 'Meta B',
      environment: 'live',
    });
    expect(a.credentialsStored).toBe(false);
    expect(b.credentialsStored).toBe(false);
  });

  it('maps concurrent credential-bind uniqueness races to ConflictException', async () => {
    const { svc } = service();
    const first = await createExchange(svc, {
      workspaceId: 'workspace-a',
      displayName: 'Race A',
      environment: 'live',
    });
    const second = await createExchange(svc, {
      workspaceId: 'workspace-a',
      displayName: 'Race B',
      environment: 'live',
    });
    // Pre-bind first row as credentialed so second update hits Strategy B / P2002 path.
    await svc.storeCredentials({
      workspaceId: 'workspace-a',
      ...actor,
      id: first.id,
      credentials: { apiKey: 'k1', apiSecret: 's1' },
    });
    await expect(
      svc.storeCredentials({
        workspaceId: 'workspace-a',
        ...actor,
        id: second.id,
        credentials: { apiKey: 'k2', apiSecret: 's2' },
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('does not create a second logical slot when replacing vaultSecretId on the same Connection', async () => {
    const { svc } = service();
    const created = await createExchange(svc, {
      workspaceId: 'workspace-a',
      displayName: 'Primary',
      environment: 'live',
    });
    await svc.storeCredentials({
      workspaceId: 'workspace-a',
      ...actor,
      id: created.id,
      credentials: { apiKey: 'k1', apiSecret: 's1' },
    });
    const replaced = await svc.replaceCredentials({
      workspaceId: 'workspace-a',
      ...actor,
      id: created.id,
      credentials: { apiKey: 'k2', apiSecret: 's2' },
    });
    expect(replaced.id).toBe(created.id);
    expect(replaced.environment).toBe('live');
    expect(replaced.credentialsStored).toBe(true);
    const sibling = await createExchange(svc, {
      workspaceId: 'workspace-a',
      displayName: 'Sibling',
      environment: 'live',
    });
    await expect(
      svc.storeCredentials({
        workspaceId: 'workspace-a',
        ...actor,
        id: sibling.id,
        credentials: { apiKey: 'k3', apiSecret: 's3' },
      }),
    ).rejects.toThrow(/provider and environment/i);
  });

  it('keeps workspace isolation for uniqueness conflicts', async () => {
    const { svc } = service();
    const foreign = await createExchange(svc, {
      workspaceId: 'workspace-b',
      displayName: 'Foreign',
      environment: 'live',
    });
    await expect(
      svc.storeCredentials({
        workspaceId: 'workspace-a',
        ...actor,
        id: foreign.id,
        credentials: { apiKey: 'x', apiSecret: 'y' },
      }),
    ).rejects.toThrow('Connection not found');
  });

  it('stores LIVE and TESTNET credentials under distinct Vault purposes (no cross-env fallback)', async () => {
    const vault = memoryVault();
    const { svc } = service(memoryPrisma(), vault);
    const live = await createExchange(svc, {
      workspaceId: 'workspace-a',
      displayName: 'Live',
      environment: 'live',
    });
    const testnet = await createExchange(svc, {
      workspaceId: 'workspace-a',
      displayName: 'Testnet',
      environment: 'testnet',
    });
    await svc.storeCredentials({
      workspaceId: 'workspace-a',
      ...actor,
      id: live.id,
      credentials: { apiKey: 'lk', apiSecret: 'ls' },
    });
    await svc.storeCredentials({
      workspaceId: 'workspace-a',
      ...actor,
      id: testnet.id,
      credentials: { apiKey: 'tk', apiSecret: 'ts' },
    });
    const liveSlot = await vault.get({
      workspaceId: 'workspace-a',
      type: 'binance',
      purpose: 'trading_live',
    });
    const testnetSlot = await vault.get({
      workspaceId: 'workspace-a',
      type: 'binance',
      purpose: 'trading_testnet',
    });
    const legacyTrading = await vault.get({
      workspaceId: 'workspace-a',
      type: 'binance',
      purpose: 'trading',
    });
    expect(liveSlot).not.toBeNull();
    expect(testnetSlot).not.toBeNull();
    expect(legacyTrading).toBeNull();
    expect(liveSlot?.id).not.toBe(testnetSlot?.id);
  });

  it('rejects DEMO and performs no LIVE backfill of NULL environments', async () => {
    const { svc } = service();
    await expect(
      svc.create({
        workspaceId: 'workspace-a',
        actorUserId: actor.actorUserId,
        displayName: 'Demo',
        environment: 'demo',
        provider: 'BINANCE',
      }),
    ).rejects.toThrow(/live or testnet/i);
    const telegram = await svc.create({
      workspaceId: 'workspace-a',
      actorUserId: actor.actorUserId,
      displayName: 'TG',
      provider: 'TELEGRAM',
    });
    expect(telegram.environment).toBeNull();
  });
});
