import { describe, expect, it } from 'vitest';
import { InMemoryUserRepository } from './repositories/in-memory-user.repository';
import { Role } from './role';
import { UserDomainService } from './user-domain.service';
import { InMemoryWorkspaceRepository } from '../workspace/repositories/in-memory-workspace.repository';
import { WorkspaceAccessService } from '../workspace/workspace-access.service';
import { WorkspaceDomainService } from '../workspace/workspace-domain.service';

describe('Role assignment membership (V3-S02-c)', () => {
  it('does not add workspace membership when a role is assigned', async () => {
    const users = new UserDomainService(new InMemoryUserRepository());
    const workspaces = new WorkspaceDomainService(new InMemoryWorkspaceRepository());
    const access = new WorkspaceAccessService(workspaces);

    const owner = await users.create({
      email: 'owner@example.com',
      displayName: 'Owner',
      role: Role.Admin,
    });
    const other = await users.create({
      email: 'other@example.com',
      displayName: 'Other',
    });
    const workspace = await workspaces.create({
      name: 'Owner space',
      ownerUserId: owner.id,
    });

    expect(access.isMember(workspace.id, owner.id)).toBe(true);
    expect(access.isMember(workspace.id, other.id)).toBe(false);

    await users.assignRole(other.id, Role.Admin);

    expect(other.role).toBe(Role.Admin);
    expect(access.isMember(workspace.id, other.id)).toBe(false);
    expect(access.isMember(workspace.id, owner.id)).toBe(true);
  });
});
