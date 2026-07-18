import { beforeEach, describe, expect, it } from 'vitest';
import type { AuthUser } from '../auth/jwt.strategy';
import { Role } from '../identity/role';
import { InMemoryWorkspaceRepository } from './repositories/in-memory-workspace.repository';
import { WorkspaceController } from './workspace.controller';
import { WorkspaceDomainService } from './workspace-domain.service';
import { WorkspaceStatus } from './workspace-status';

describe('WorkspaceController (US002)', () => {
  let controller: WorkspaceController;
  let workspaces: WorkspaceDomainService;

  beforeEach(() => {
    workspaces = new WorkspaceDomainService(new InMemoryWorkspaceRepository());
    controller = new WorkspaceController(workspaces);
  });

  it('bootstrap discovers or creates the active workspace for the caller', async () => {
    const user: AuthUser = {
      userId: 'user-1',
      email: 'user@example.com',
      displayName: 'User',
      role: Role.Researcher,
    };

    const first = await controller.bootstrap({ user });
    const second = await controller.bootstrap({ user });

    expect(first).toEqual({
      id: expect.any(String),
      name: 'Default Workspace',
      status: WorkspaceStatus.Active,
      createdAt: expect.any(String),
    });
    expect(second.id).toBe(first.id);
    expect(second.name).toBe(first.name);
  });
});
