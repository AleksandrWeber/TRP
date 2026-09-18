import { ConflictException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { Role } from '../identity/role';
import { GATE_DENY_PUBLIC_MESSAGE } from './connection-migration-gate-enforcement';
import { ConnectionsService } from './connections.service';
import type { MigrationGateObservation } from './migration-gate';

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
    rows,
    connectionRecord: {
      create: async ({
        data,
      }: {
        data: Omit<ConnectionRow, 'updatedAt' | 'vaultSecretId'> & {
          environment?: string | null;
        };
      }) => {
        const row: ConnectionRow = {
          ...data,
          environment: data.environment ?? null,
          vaultSecretId: null,
          updatedAt: data.createdAt,
        };
        rows.push(row);
        return row;
      },
      findMany: async ({ where }: { where: { workspaceId: string } }) =>
        rows.filter((row) => row.workspaceId === where.workspaceId),
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
      update: async ({ where, data }: { where: { id: string }; data: Partial<ConnectionRow> }) => {
        const row = rows.find((r) => r.id === where.id);
        if (!row) throw new Error('missing');
        Object.assign(row, data, { updatedAt: new Date() });
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
  const slotKey = (workspaceId: string, type: string, purpose: string) =>
    `${workspaceId}::${type}::${purpose}`;
  const resolvePurpose = (purpose: string | undefined, type: string) => {
    if (purpose) return purpose;
    if (type === 'binance' || type === 'bybit' || type === 'okx') return 'trading';
    if (type === 'openrouter') return 'ai';
    return 'notification';
  };
  return {
    secrets,
    get: async (query: { workspaceId: string; type: string; purpose?: string }) => {
      const purpose = resolvePurpose(query.purpose, query.type);
      return secrets.get(slotKey(query.workspaceId, query.type, purpose)) ?? null;
    },
    retrieve: async () => ({ apiKey: 'k', apiSecret: 's' }),
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

function noopAudit() {
  return { record: async () => undefined };
}

function stubs() {
  return {
    validator: { validate: async () => ({ outcome: 'succeeded' as const }) },
    handshake: { perform: async () => ({ outcome: 'CONNECTED' as const }) },
    sessions: {},
    capabilities: {
      clear: () => undefined,
      projection: () => null,
      verify: async () => undefined,
    },
    openRouterTests: { perform: async () => ({ outcome: 'CONNECTED' as const }) },
    openRouterConnectivity: {
      clear: () => undefined,
      projection: () => null,
    },
    openRouterAudit: { created: async () => undefined, updated: async () => undefined },
    openRouterAi: {
      clear: () => undefined,
      execute: async () => undefined,
      lastResult: () => null,
    },
  };
}

function gateSequence(observations: Array<MigrationGateObservation | 'fail'>) {
  let i = 0;
  return {
    observeCalls: () => i,
    observe: async () => {
      const next = observations[Math.min(i, observations.length - 1)]!;
      i += 1;
      if (next === 'fail') {
        return {
          ok: false as const,
          reason: 'GATE_UNKNOWN' as const,
          observation: 'UNKNOWN' as const,
        };
      }
      return { ok: true as const, observation: next };
    },
  };
}

function buildService(input: {
  prisma?: ReturnType<typeof memoryPrisma>;
  vault?: ReturnType<typeof memoryVault>;
  gate: ReturnType<typeof gateSequence>;
  audit?: { record: (x: unknown) => Promise<void>; events?: unknown[] };
}) {
  const s = stubs();
  const events: unknown[] = [];
  const audit = input.audit ?? {
    events,
    record: async (x: unknown) => {
      events.push(x);
    },
  };
  const svc = new ConnectionsService(
    (input.prisma ?? memoryPrisma()) as never,
    (input.vault ?? memoryVault()) as never,
    s.validator as never,
    noopAudit() as never,
    noopAudit() as never,
    s.handshake as never,
    s.sessions as never,
    s.capabilities as never,
    s.openRouterTests as never,
    s.openRouterConnectivity as never,
    s.openRouterAudit as never,
    s.openRouterAi as never,
    input.gate as never,
    audit as never,
  );
  return { svc, audit, vault: input.vault ?? memoryVault(), prisma: input.prisma };
}

const actor = { actorUserId: 'user-a', actorRole: Role.Admin } as const;

async function createExchange(svc: ConnectionsService) {
  return svc.create({
    workspaceId: 'ws-a',
    actorUserId: actor.actorUserId,
    displayName: 'Binance',
    provider: 'BINANCE',
    environment: 'live',
  });
}

describe('ConnectionsService FIV-CONN-04-B-03 enforcement', () => {
  it('ACTIVE blocks EXCHANGE create with frozen ConflictException message', async () => {
    const { svc, audit } = buildService({ gate: gateSequence(['ACTIVE']) });
    await expect(
      svc.create({
        workspaceId: 'ws-a',
        actorUserId: actor.actorUserId,
        displayName: 'Binance',
        provider: 'BINANCE',
        environment: 'live',
      }),
    ).rejects.toMatchObject({
      message: GATE_DENY_PUBLIC_MESSAGE,
    });
    expect(audit.events?.[0]).toMatchObject({
      outcome: 'lifecycle_mutation_blocked',
      workspaceId: 'ws-a',
      payload: expect.objectContaining({ operation: 'EXCHANGE_CREATE', observation: 'ACTIVE' }),
    });
  });

  it('ACTIVE still allows NON-EXCHANGE create, rename, disable, reads, catalog', async () => {
    const prisma = memoryPrisma();
    const { svc } = buildService({ prisma, gate: gateSequence(['ACTIVE']) });
    const created = await svc.create({
      workspaceId: 'ws-a',
      actorUserId: actor.actorUserId,
      displayName: 'TG',
      provider: 'TELEGRAM',
    });
    expect(created.connectionType).toBe('NOTIFICATION');
    await expect(svc.rename('ws-a', created.id, 'Renamed')).resolves.toMatchObject({
      displayName: 'Renamed',
    });
    await expect(
      svc.disable({ workspaceId: 'ws-a', actorUserId: actor.actorUserId, id: created.id }),
    ).resolves.toMatchObject({ status: 'DISABLED' });
    await expect(svc.list('ws-a')).resolves.toHaveLength(1);
    await expect(svc.get('ws-a', created.id)).resolves.toBeTruthy();
    expect(svc.catalog()).toBeTruthy();
  });

  it('store: entry+mid-flight INACTIVE binds credentials', async () => {
    const prisma = memoryPrisma();
    const vault = memoryVault();
    const { svc } = buildService({
      prisma,
      vault,
      gate: gateSequence(['INACTIVE', 'INACTIVE', 'INACTIVE']),
    });
    const created = await createExchange(svc);
    const stored = await svc.storeCredentials({
      workspaceId: 'ws-a',
      ...actor,
      id: created.id,
      credentials: { apiKey: 'k', apiSecret: 's' },
    });
    expect(stored.credentialsStored).toBe(true);
    expect(prisma.rows[0]?.vaultSecretId).toBeTruthy();
  });

  it('store: Vault success + mid-flight ACTIVE does not bind Connection', async () => {
    const prisma = memoryPrisma();
    const vault = memoryVault();
    const storeSpy = vi.spyOn(vault, 'store');
    const { svc } = buildService({
      prisma,
      vault,
      gate: gateSequence(['INACTIVE', 'INACTIVE', 'ACTIVE']),
    });
    const created = await createExchange(svc);
    await expect(
      svc.storeCredentials({
        workspaceId: 'ws-a',
        ...actor,
        id: created.id,
        credentials: { apiKey: 'k', apiSecret: 's' },
      }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(storeSpy).toHaveBeenCalled();
    expect(prisma.rows[0]?.vaultSecretId).toBeNull();
  });

  it('replace mid-flight UNKNOWN fails closed without connection update', async () => {
    const prisma = memoryPrisma();
    const vault = memoryVault();
    const { svc } = buildService({
      prisma,
      vault,
      gate: gateSequence(['INACTIVE', 'INACTIVE', 'INACTIVE', 'INACTIVE', 'fail']),
    });
    const created = await createExchange(svc);
    await svc.storeCredentials({
      workspaceId: 'ws-a',
      ...actor,
      id: created.id,
      credentials: { apiKey: 'k', apiSecret: 's' },
    });
    const before = prisma.rows[0]?.vaultSecretId;
    await expect(
      svc.replaceCredentials({
        workspaceId: 'ws-a',
        ...actor,
        id: created.id,
        credentials: { apiKey: 'k2', apiSecret: 's2' },
      }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(prisma.rows[0]?.vaultSecretId).toBe(before);
  });

  it('revoke C-B03-01: mid-flight ACTIVE after vault.revoke does not persist REVOKED', async () => {
    const prisma = memoryPrisma();
    const vault = memoryVault();
    const { svc } = buildService({
      prisma,
      vault,
      // create, store entry, store mid, revoke entry, revoke mid
      gate: gateSequence(['INACTIVE', 'INACTIVE', 'INACTIVE', 'INACTIVE', 'ACTIVE']),
    });
    const created = await createExchange(svc);
    await svc.storeCredentials({
      workspaceId: 'ws-a',
      ...actor,
      id: created.id,
      credentials: { apiKey: 'k', apiSecret: 's' },
    });
    const revokeSpy = vi.spyOn(vault, 'revoke');
    const updateSpy = vi.spyOn(prisma.connectionRecord, 'update');
    await expect(
      svc.revoke({
        workspaceId: 'ws-a',
        ...actor,
        id: created.id,
      }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(revokeSpy).toHaveBeenCalled();
    expect(prisma.rows[0]?.status).not.toBe('REVOKED');
    // No Connection mutation between vault.revoke and second observe: status update not applied.
    const statusUpdates = updateSpy.mock.calls.filter(
      (call) => (call[0] as { data?: { status?: string } }).data?.status === 'REVOKED',
    );
    expect(statusUpdates).toHaveLength(0);
  });

  it('revoke: mid-flight INACTIVE persists REVOKED', async () => {
    const prisma = memoryPrisma();
    const vault = memoryVault();
    const { svc } = buildService({
      prisma,
      vault,
      gate: gateSequence(['INACTIVE', 'INACTIVE', 'INACTIVE', 'INACTIVE', 'INACTIVE']),
    });
    const created = await createExchange(svc);
    await svc.storeCredentials({
      workspaceId: 'ws-a',
      ...actor,
      id: created.id,
      credentials: { apiKey: 'k', apiSecret: 's' },
    });
    const revoked = await svc.revoke({
      workspaceId: 'ws-a',
      ...actor,
      id: created.id,
    });
    expect(revoked.status).toBe('REVOKED');
  });
});
