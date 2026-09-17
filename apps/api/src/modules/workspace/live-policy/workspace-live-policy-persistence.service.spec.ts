import { beforeEach, describe, expect, it, vi } from 'vitest';
import { WorkspaceLivePolicy } from './durable-workspace-live-policy-state';
import { InMemoryWorkspaceLivePolicyStateRepository } from './persistence/in-memory-workspace-live-policy-state.repository';
import { WorkspaceLivePolicyPersistenceService } from './workspace-live-policy-persistence.service';
import { PrismaWorkspaceLivePolicyStateRepository } from './persistence/prisma-workspace-live-policy-state.repository';

describe('WorkspaceLivePolicyPersistenceService (PROPOSED-V3-L01-S02)', () => {
  let repository: InMemoryWorkspaceLivePolicyStateRepository;
  let service: WorkspaceLivePolicyPersistenceService;

  beforeEach(() => {
    repository = new InMemoryWorkspaceLivePolicyStateRepository();
    service = new WorkspaceLivePolicyPersistenceService(repository);
  });

  it('T-02 ensurePaperDefault seeds Paper for a new workspace id', async () => {
    const state = await service.ensurePaperDefault('ws-new');
    expect(state.policy).toBe(WorkspaceLivePolicy.PAPER);
    expect(await service.resolveEffectivePolicy('ws-new')).toBe(WorkspaceLivePolicy.PAPER);
    expect(await service.isOptedIn('ws-new')).toBe(false);
  });

  it('T-04 missing state resolves to Paper via resolveEffectivePolicy', async () => {
    expect(await service.loadState('missing')).toBeNull();
    expect(await service.resolveEffectivePolicy('missing')).toBe(WorkspaceLivePolicy.PAPER);
    expect(await service.isOptedIn('missing')).toBe(false);
  });

  it('T-08 workspace isolation — load/save are keyed by workspaceId', async () => {
    await service.ensurePaperDefault('ws-a');
    await service.persistPolicy({
      workspaceId: 'ws-b',
      policy: WorkspaceLivePolicy.LIVE_POLICY_OPTED_IN,
    });

    expect(await service.resolveEffectivePolicy('ws-a')).toBe(WorkspaceLivePolicy.PAPER);
    expect(await service.isOptedIn('ws-a')).toBe(false);
    expect(await service.isOptedIn('ws-b')).toBe(true);
    expect((await service.loadState('ws-a'))?.workspaceId).toBe('ws-a');
    expect((await service.loadState('ws-b'))?.workspaceId).toBe('ws-b');
  });

  it('ensurePaperDefault is idempotent and does not overwrite opted-in', async () => {
    await service.persistPolicy({
      workspaceId: 'ws-1',
      policy: WorkspaceLivePolicy.LIVE_POLICY_OPTED_IN,
    });
    const again = await service.ensurePaperDefault('ws-1');
    expect(again.policy).toBe(WorkspaceLivePolicy.LIVE_POLICY_OPTED_IN);
  });
});

describe('PrismaWorkspaceLivePolicyStateRepository (PROPOSED-V3-L01-S02)', () => {
  it('round-trips Paper and rejects invalid policy on load', async () => {
    const store = new Map<string, Record<string, unknown>>();
    const prisma = {
      workspaceLivePolicyState: {
        upsert: vi.fn(
          async ({
            where,
            create,
          }: {
            where: { workspaceId: string };
            create: Record<string, unknown>;
          }) => {
            store.set(where.workspaceId, { ...create });
          },
        ),
        findUnique: vi.fn(async ({ where }: { where: { workspaceId: string } }) => {
          const row = store.get(where.workspaceId);
          if (!row) return null;
          return {
            workspaceId: row.workspaceId,
            policy: row.policy,
            schemaVersion: row.schemaVersion,
            updatedAt:
              row.updatedAt instanceof Date ? row.updatedAt : new Date(String(row.updatedAt)),
          };
        }),
        findMany: vi.fn(async () => []),
      },
    };

    const repo = new PrismaWorkspaceLivePolicyStateRepository(prisma as never);
    await repo.saveLivePolicyState({
      workspaceId: 'ws-1',
      policy: WorkspaceLivePolicy.PAPER,
      schemaVersion: 1,
      updatedAt: '2026-09-17T00:00:00.000Z',
    });

    const loaded = await repo.loadLivePolicyState('ws-1');
    expect(loaded?.policy).toBe(WorkspaceLivePolicy.PAPER);

    store.set('ws-bad', {
      workspaceId: 'ws-bad',
      policy: 'LIVE',
      schemaVersion: 1,
      updatedAt: new Date('2026-09-17T00:00:00.000Z'),
    });
    await expect(repo.loadLivePolicyState('ws-bad')).rejects.toThrow(
      /unsupported Workspace live policy/i,
    );
  });

  it('T-05 rejects unsupported schema version', async () => {
    const prisma = {
      workspaceLivePolicyState: {
        findUnique: vi.fn(async () => ({
          workspaceId: 'ws-1',
          policy: 'PAPER',
          schemaVersion: 99,
          updatedAt: new Date('2026-09-17T00:00:00.000Z'),
        })),
        upsert: vi.fn(),
        findMany: vi.fn(),
      },
    };
    const repo = new PrismaWorkspaceLivePolicyStateRepository(prisma as never);
    await expect(repo.loadLivePolicyState('ws-1')).rejects.toThrow(
      /Unsupported workspace live policy schema version/i,
    );
  });
});
