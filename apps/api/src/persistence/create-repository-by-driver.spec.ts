import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  getAnalyticalOwnerBootOutcome,
  resetAnalyticalOwnerBootOutcomes,
} from './analytical-owner-continuity-status';
import { createRepositoryByDriver, RepositoryHydrationError } from './create-repository-by-driver';
import { PersistenceDriverConfigurationError } from './persistence-driver';
import { HydrationPayloadError } from './hydration-payload';
import { RepositoryPrismaLifecycle } from './repository-prisma-lifecycle';

const prismaState = vi.hoisted(() => ({
  connect: vi.fn(async () => undefined),
  disconnect: vi.fn(async () => undefined),
  instances: [] as object[],
}));

vi.mock('@prisma/client', async () => ({
  PrismaClient: class PrismaClient {
    constructor() {
      prismaState.instances.push(this);
    }
    $connect() {
      return prismaState.connect();
    }
    $disconnect() {
      return prismaState.disconnect();
    }
  },
}));

const RESEARCH_REPOSITORIES = [
  'campaign',
  'knowledge',
  'insight',
  'recommendation',
  'research-report',
] as const;

class MemoryStore {
  readonly kind = 'memory';
}

class PrismaStore {
  readonly kind = 'prisma';
  constructor(readonly hydrate: () => Promise<void>) {}
}

function deferred<T = void>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

const DRIVER_ENV_KEYS = [
  'PERSISTENCE_DRIVER',
  'RESEARCH_PERSISTENCE_DRIVER',
  'W3_PERSISTENCE_DRIVER',
] as const;

type DriverEnv = Partial<Record<(typeof DRIVER_ENV_KEYS)[number], string | undefined>>;

async function withDriverEnv<T>(values: DriverEnv, run: () => Promise<T>): Promise<T> {
  const previous = Object.fromEntries(DRIVER_ENV_KEYS.map((key) => [key, process.env[key]]));
  for (const key of DRIVER_ENV_KEYS) {
    const next = values[key];
    if (next === undefined) delete process.env[key];
    else process.env[key] = next;
  }
  try {
    return await run();
  } finally {
    for (const key of DRIVER_ENV_KEYS) {
      const prior = previous[key];
      if (prior === undefined) delete process.env[key];
      else process.env[key] = prior;
    }
  }
}

async function withDriver<T>(driver: string | undefined, run: () => Promise<T>): Promise<T> {
  return withDriverEnv({ PERSISTENCE_DRIVER: driver }, run);
}

afterEach(() => {
  prismaState.connect.mockReset();
  prismaState.disconnect.mockReset();
  prismaState.connect.mockResolvedValue(undefined);
  prismaState.disconnect.mockResolvedValue(undefined);
  prismaState.instances.length = 0;
  resetAnalyticalOwnerBootOutcomes();
});

function trackedClients(): RepositoryPrismaLifecycle {
  return new RepositoryPrismaLifecycle();
}

describe('createRepositoryByDriver', () => {
  it('selects the in-memory repository for the memory driver without connecting', async () => {
    const createPrisma = vi.fn();
    const clients = trackedClients();
    const register = vi.spyOn(clients, 'register');
    const repo = await withDriver('memory', () =>
      createRepositoryByDriver({
        createMemory: () => new MemoryStore(),
        createPrisma,
        group: 'research',
        onHydrationFailure: 'fail',
        repositoryName: 'campaign',
        clients,
      }),
    );

    expect(repo).toBeInstanceOf(MemoryStore);
    expect(createPrisma).not.toHaveBeenCalled();
    expect(prismaState.connect).not.toHaveBeenCalled();
    expect(prismaState.instances).toHaveLength(0);
    expect(register).not.toHaveBeenCalled();
  });

  it('selects the in-memory repository when the driver is unset', async () => {
    const createPrisma = vi.fn();
    const repo = await withDriver(undefined, () =>
      createRepositoryByDriver({
        createMemory: () => new MemoryStore(),
        createPrisma,
        group: 'research',
        onHydrationFailure: 'fail',
        repositoryName: 'knowledge',
        clients: trackedClients(),
      }),
    );

    expect(repo).toBeInstanceOf(MemoryStore);
    expect(createPrisma).not.toHaveBeenCalled();
    expect(prismaState.connect).not.toHaveBeenCalled();
  });

  it('returns the Prisma repository only after hydration resolves', async () => {
    const gate = deferred();
    let exposed = false;
    const prismaRepo = new PrismaStore(() => gate.promise);
    const createMemory = vi.fn(() => new MemoryStore());
    const clients = trackedClients();
    const register = vi.spyOn(clients, 'register');
    const pending = withDriver('prisma', () =>
      createRepositoryByDriver({
        createMemory,
        createPrisma: () => prismaRepo,
        group: 'research',
        onHydrationFailure: 'fail',
        repositoryName: 'campaign',
        clients,
      }),
    ).then(async (repo) => {
      exposed = true;
      return repo;
    });

    await Promise.resolve();
    expect(exposed).toBe(false);
    expect(createMemory).not.toHaveBeenCalled();
    expect(prismaState.connect).toHaveBeenCalledTimes(1);

    gate.resolve();
    await expect(pending).resolves.toBe(prismaRepo);
    expect(createMemory).not.toHaveBeenCalled();
    expect(register).toHaveBeenCalledTimes(1);
    expect(register).toHaveBeenCalledWith(prismaState.instances[0]);
    await clients.onModuleDestroy();
    expect(prismaState.disconnect).toHaveBeenCalledTimes(1);
    await clients.onModuleDestroy();
    expect(prismaState.disconnect).toHaveBeenCalledTimes(1);
  });

  it.each(RESEARCH_REPOSITORIES)(
    'rejects %s hydration and does not return an empty memory repository',
    async (repositoryName) => {
      const failure = new Error(`relation "research_${repositoryName}" does not exist`);
      const createMemory = vi.fn(() => new MemoryStore());
      const clients = trackedClients();
      const pending = withDriver('prisma', async () =>
        createRepositoryByDriver({
          createMemory,
          createPrisma: () => new PrismaStore(() => Promise.reject(failure)),
          group: 'research',
          onHydrationFailure: 'fail',
          repositoryName,
          clients,
        }),
      );

      await expect(pending).rejects.toBeInstanceOf(RepositoryHydrationError);
      await expect(pending).rejects.toMatchObject({
        repositoryName,
        cause: failure,
      });
      await expect(pending).rejects.toThrow(
        `Research repository "${repositoryName}" failed to hydrate`,
      );
      expect(createMemory).not.toHaveBeenCalled();
      expect(prismaState.disconnect).toHaveBeenCalledTimes(1);
      await clients.onModuleDestroy();
      expect(prismaState.disconnect).toHaveBeenCalledTimes(1);
    },
  );

  it('wraps a payload validation failure, disconnects, and does not fall back to memory', async () => {
    const cause = new Error('report.verdict must be one of: PASS, NEEDS_REVIEW, FAIL');
    const failure = new HydrationPayloadError('campaign', 'session-1', cause);
    const createMemory = vi.fn(async () => new MemoryStore());
    const clients = trackedClients();

    await expect(
      withDriver('prisma', async () =>
        createRepositoryByDriver({
          createMemory,
          createPrisma: () => new PrismaStore(() => Promise.reject(failure)),
          group: 'research',
          onHydrationFailure: 'fail',
          repositoryName: 'campaign',
          clients,
        }),
      ),
    ).rejects.toMatchObject({
      name: 'RepositoryHydrationError',
      repositoryName: 'campaign',
      cause: failure,
    });

    expect(failure.cause).toBe(cause);
    expect(createMemory).not.toHaveBeenCalled();
    expect(prismaState.disconnect).toHaveBeenCalledTimes(1);
    expect(getAnalyticalOwnerBootOutcome('reporting')).toBeUndefined();
    await clients.onModuleDestroy();
    expect(prismaState.disconnect).toHaveBeenCalledTimes(1);
  });

  it('propagates a Prisma connection failure without hydrating or falling back', async () => {
    const failure = new Error('connect failed');
    const disconnectFailure = new Error('postgresql://user:secret@localhost:5432/trp');
    prismaState.connect.mockRejectedValueOnce(failure);
    prismaState.disconnect.mockRejectedValueOnce(disconnectFailure);
    const createMemory = vi.fn(async () => new MemoryStore());
    const createPrisma = vi.fn();
    const clients = trackedClients();
    const register = vi.spyOn(clients, 'register');

    await expect(
      withDriver('prisma', async () =>
        createRepositoryByDriver({
          createMemory,
          createPrisma,
          group: 'research',
          onHydrationFailure: 'fail',
          repositoryName: 'campaign',
          clients,
        }),
      ),
    ).rejects.toBe(failure);
    expect(createMemory).not.toHaveBeenCalled();
    expect(createPrisma).not.toHaveBeenCalled();
    expect(register).not.toHaveBeenCalled();
    expect(prismaState.disconnect).toHaveBeenCalledTimes(1);
    await clients.onModuleDestroy();
    expect(prismaState.disconnect).toHaveBeenCalledTimes(1);
  });

  it('keeps the W3 empty-memory fallback and unavailable boot outcome', async () => {
    const failure = new Error('corrupt snapshot');
    const memory = new MemoryStore();
    const clients = trackedClients();
    const repo = await withDriver('prisma', async () =>
      createRepositoryByDriver({
        group: 'w3',
        createMemory: () => memory,
        createPrisma: () => new PrismaStore(() => Promise.reject(failure)),
        owner: 'reporting',
        clients,
      }),
    );

    expect(repo).toBe(memory);
    expect(getAnalyticalOwnerBootOutcome('reporting')).toMatchObject({
      outcome: 'unavailable',
      reason: 'corrupt snapshot',
    });
    expect(prismaState.disconnect).toHaveBeenCalledTimes(1);
    await clients.onModuleDestroy();
    expect(prismaState.disconnect).toHaveBeenCalledTimes(1);
  });

  it('disconnects every successfully connected client on shutdown', async () => {
    const clients = trackedClients();
    const register = vi.spyOn(clients, 'register');
    const open = () =>
      withDriver('prisma', async () =>
        createRepositoryByDriver({
          createMemory: () => new MemoryStore(),
          createPrisma: () => new PrismaStore(async () => undefined),
          group: 'research',
          onHydrationFailure: 'fail',
          repositoryName: 'insight',
          clients,
        }),
      );

    await open();
    await open();

    expect(register).toHaveBeenCalledTimes(2);
    expect(prismaState.instances).toHaveLength(2);
    await clients.onModuleDestroy();
    expect(prismaState.disconnect).toHaveBeenCalledTimes(2);
    await clients.onModuleDestroy();
    expect(prismaState.disconnect).toHaveBeenCalledTimes(2);
  });

  it('selects prisma for research and memory for w3 without a second client', async () => {
    const createW3Prisma = vi.fn();
    const clients = trackedClients();
    const register = vi.spyOn(clients, 'register');

    const selected = await withDriverEnv(
      {
        PERSISTENCE_DRIVER: 'memory',
        RESEARCH_PERSISTENCE_DRIVER: 'prisma',
        W3_PERSISTENCE_DRIVER: 'memory',
      },
      async () => {
        const research = await createRepositoryByDriver({
          group: 'research',
          createMemory: () => new MemoryStore(),
          createPrisma: () => new PrismaStore(async () => undefined),
          onHydrationFailure: 'fail',
          repositoryName: 'campaign',
          clients,
        });
        const w3 = await createRepositoryByDriver({
          group: 'w3',
          createMemory: () => new MemoryStore(),
          createPrisma: createW3Prisma,
          owner: 'reporting',
          clients,
        });
        return { research, w3 };
      },
    );

    expect(selected.research).toBeInstanceOf(PrismaStore);
    expect(selected.w3).toBeInstanceOf(MemoryStore);
    expect(createW3Prisma).not.toHaveBeenCalled();
    expect(prismaState.instances).toHaveLength(1);
    expect(prismaState.connect).toHaveBeenCalledTimes(1);
    expect(register).toHaveBeenCalledTimes(1);
    expect(getAnalyticalOwnerBootOutcome('reporting')).toMatchObject({
      outcome: 'ready',
      reason: 'memory-driver',
    });
  });

  it('keeps the w3 empty-memory fallback when only the w3 driver is prisma', async () => {
    const failure = new Error('corrupt snapshot');
    const createResearchPrisma = vi.fn();
    const clients = trackedClients();
    const memory = new MemoryStore();

    const selected = await withDriverEnv(
      {
        PERSISTENCE_DRIVER: 'memory',
        RESEARCH_PERSISTENCE_DRIVER: 'memory',
        W3_PERSISTENCE_DRIVER: 'prisma',
      },
      async () => {
        const research = await createRepositoryByDriver({
          group: 'research',
          createMemory: () => new MemoryStore(),
          createPrisma: createResearchPrisma,
          onHydrationFailure: 'fail',
          repositoryName: 'insight',
          clients,
        });
        const w3 = await createRepositoryByDriver({
          group: 'w3',
          createMemory: () => memory,
          createPrisma: () => new PrismaStore(() => Promise.reject(failure)),
          owner: 'market-state',
          clients,
        });
        return { research, w3 };
      },
    );

    expect(selected.research).toBeInstanceOf(MemoryStore);
    expect(createResearchPrisma).not.toHaveBeenCalled();
    expect(selected.w3).toBe(memory);
    expect(getAnalyticalOwnerBootOutcome('market-state')).toMatchObject({
      outcome: 'unavailable',
      reason: 'corrupt snapshot',
    });
    expect(prismaState.instances).toHaveLength(1);
    expect(prismaState.disconnect).toHaveBeenCalledTimes(1);
    await clients.onModuleDestroy();
    expect(prismaState.disconnect).toHaveBeenCalledTimes(1);
  });

  it('rejects an invalid group driver before creating a Prisma client', async () => {
    const createPrisma = vi.fn();
    const clients = trackedClients();

    await expect(
      withDriverEnv({ PERSISTENCE_DRIVER: 'prisma', RESEARCH_PERSISTENCE_DRIVER: 'sqlite' }, () =>
        createRepositoryByDriver({
          group: 'research',
          createMemory: () => new MemoryStore(),
          createPrisma,
          onHydrationFailure: 'fail',
          repositoryName: 'campaign',
          clients,
        }),
      ),
    ).rejects.toBeInstanceOf(PersistenceDriverConfigurationError);

    expect(createPrisma).not.toHaveBeenCalled();
    expect(prismaState.instances).toHaveLength(0);
    expect(prismaState.connect).not.toHaveBeenCalled();
  });

  it('rejects a missing persistence group before creating a Prisma client', async () => {
    const clients = trackedClients();
    await expect(
      withDriver('prisma', () =>
        createRepositoryByDriver({
          createMemory: () => new MemoryStore(),
          createPrisma: () => new PrismaStore(async () => undefined),
          clients,
        } as never),
      ),
    ).rejects.toThrow(/explicit persistence group/);
    expect(prismaState.instances).toHaveLength(0);
    expect(prismaState.connect).not.toHaveBeenCalled();
  });
});
