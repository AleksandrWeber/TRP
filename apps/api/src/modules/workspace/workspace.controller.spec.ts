import { BadRequestException, NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it } from 'vitest';
import type { AuthUser } from '../auth/jwt.strategy';
import { Role } from '../identity/role';
import { InMemoryWorkspaceRepository } from './repositories/in-memory-workspace.repository';
import { WorkspaceAccessService } from './workspace-access.service';
import { WorkspaceController } from './workspace.controller';
import { WorkspaceDomainService } from './workspace-domain.service';
import { WorkspaceStatus } from './workspace-status';

describe('WorkspaceController (US002 / PC-14)', () => {
  let controller: WorkspaceController;
  let workspaces: WorkspaceDomainService;

  const owner: AuthUser = {
    userId: 'user-1',
    email: 'user@example.com',
    displayName: 'User',
    role: Role.Researcher,
  };

  const other: AuthUser = {
    userId: 'user-2',
    email: 'other@example.com',
    displayName: 'Other',
    role: Role.Researcher,
  };

  beforeEach(() => {
    workspaces = new WorkspaceDomainService(new InMemoryWorkspaceRepository());
    controller = new WorkspaceController(workspaces, new WorkspaceAccessService(workspaces));
  });

  it('bootstrap discovers or creates the active workspace for the caller', async () => {
    const first = await controller.bootstrap({ user: owner });
    const second = await controller.bootstrap({ user: owner });

    expect(first).toEqual({
      id: expect.any(String),
      name: 'Default Workspace',
      status: WorkspaceStatus.Active,
      createdAt: expect.any(String),
    });
    expect(second.id).toBe(first.id);
    expect(second.name).toBe(first.name);
  });

  it('lists only the caller’s active workspaces', async () => {
    const mine = await controller.create({ user: owner }, { name: 'Mine' });
    await controller.create({ user: other }, { name: 'Theirs' });
    const archived = await controller.create({ user: owner }, { name: 'Old' });
    await controller.archive({ user: owner }, { id: archived.id });

    const listed = controller.list({ user: owner });

    expect(listed.map((item) => item.id)).toEqual([mine.id]);
    expect(listed[0]?.name).toBe('Mine');
  });

  it('creates a named workspace owned by the caller', async () => {
    const created = await controller.create({ user: owner }, { name: '  Research Lab  ' });

    expect(created.name).toBe('Research Lab');
    expect(created.status).toBe(WorkspaceStatus.Active);
    expect(workspaces.getById(created.id)?.ownerUserId).toBe(owner.userId);
  });

  it('get is the switch transport for an owned active workspace', async () => {
    const created = await controller.create({ user: owner }, { name: 'Lab' });

    expect(controller.get({ user: owner }, { id: created.id })).toEqual(created);
  });

  it('get / rename / archive never leak a foreign workspace', async () => {
    const foreign = await controller.create({ user: other }, { name: 'Secret' });

    expect(() => controller.get({ user: owner }, { id: foreign.id })).toThrow(NotFoundException);
    await expect(
      controller.rename({ user: owner }, { id: foreign.id }, { name: 'Stolen' }),
    ).rejects.toBeInstanceOf(NotFoundException);
    await expect(controller.archive({ user: owner }, { id: foreign.id })).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(workspaces.getById(foreign.id)?.name).toBe('Secret');
  });

  it('renames an owned active workspace', async () => {
    const created = await controller.create({ user: owner }, { name: 'Old' });

    const renamed = await controller.rename({ user: owner }, { id: created.id }, { name: ' New ' });

    expect(renamed.name).toBe('New');
    expect(controller.get({ user: owner }, { id: created.id }).name).toBe('New');
  });

  it('archives an owned active workspace and hides it from list and switch', async () => {
    const created = await controller.create({ user: owner }, { name: 'Lab' });

    const archived = await controller.archive({ user: owner }, { id: created.id });

    expect(archived.status).toBe(WorkspaceStatus.Archived);
    expect(controller.list({ user: owner })).toEqual([]);
    expect(() => controller.get({ user: owner }, { id: created.id })).toThrow(NotFoundException);
  });

  it('rejects rename of a missing workspace', async () => {
    await expect(
      controller.rename({ user: owner }, { id: 'missing' }, { name: 'X' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('maps empty domain names to BadRequestException', async () => {
    await expect(controller.create({ user: owner }, { name: '   ' })).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});
