import { PrismaClient } from '@prisma/client';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { PrismaWorkspaceRepository } from '../../modules/workspace/repositories/prisma-workspace.repository';
import { WorkspaceAccessService } from '../../modules/workspace/workspace-access.service';
import { WorkspaceController } from '../../modules/workspace/workspace.controller';
import { WorkspaceDomainService } from '../../modules/workspace/workspace-domain.service';
import { WorkspaceStatus } from '../../modules/workspace/workspace-status';
import type { AuthUser } from '../../modules/auth/jwt.strategy';
import { Role } from '../../modules/identity/role';

const OWNER = 'pc14-workspace-owner';

/**
 * PC-14: existing Workspace aggregate remains durable; REST transports
 * list / create / rename / archive / get (switch) over that owner.
 */
describe('PC-14 — Workspace product persistence', () => {
  const prisma = new PrismaClient();

  beforeAll(() => prisma.$connect());
  beforeEach(cleanup);
  afterAll(async () => {
    await cleanup();
    await prisma.$disconnect();
  });

  async function cleanup() {
    await prisma.workspaceRecord.deleteMany({ where: { ownerUserId: OWNER } });
  }

  async function createStack() {
    const workspaces = new WorkspaceDomainService(new PrismaWorkspaceRepository(prisma));
    await workspaces.onModuleInit();
    const controller = new WorkspaceController(workspaces, new WorkspaceAccessService(workspaces));
    return { workspaces, controller };
  }

  const user: AuthUser = {
    userId: OWNER,
    email: 'pc14@example.com',
    displayName: 'PC-14',
    role: Role.Researcher,
  };

  it('create, rename, archive, and switch survive process hydrate', async () => {
    const original = await createStack();
    const created = await original.controller.create({ user }, { name: 'Alpha' });
    await original.controller.rename({ user }, { id: created.id }, { name: 'Alpha Lab' });
    const second = await original.controller.create({ user }, { name: 'Beta' });

    const restarted = await createStack();
    const listed = restarted.controller.list({ user });
    expect(listed.map((item) => item.name).sort()).toEqual(['Alpha Lab', 'Beta']);

    const switched = restarted.controller.get({ user }, { id: second.id });
    expect(switched).toMatchObject({ id: second.id, name: 'Beta', status: WorkspaceStatus.Active });

    await restarted.controller.archive({ user }, { id: created.id });
    const afterArchive = await createStack();
    expect(afterArchive.controller.list({ user }).map((item) => item.id)).toEqual([second.id]);
  });
});
