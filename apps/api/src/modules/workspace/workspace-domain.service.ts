import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { Workspace } from './workspace';
import { toWorkspaceId, type WorkspaceId } from './workspace-id';
import { WorkspaceStatus } from './workspace-status';
import type { WorkspaceRepository } from './repositories/workspace.repository';
import { WORKSPACE_REPOSITORY } from './repositories/workspace.repository.token';

export type CreateWorkspaceInput = {
  name: string;
  ownerUserId: string;
  createdAt?: string;
};

/**
 * Workspace domain service (US108).
 * create / getById / findByOwner / rename / archive.
 * Storage is delegated to WorkspaceRepository (no owned Map).
 *
 * Independent of Campaign / Auth / REST / Pipeline / Prisma.
 */
@Injectable()
export class WorkspaceDomainService {
  constructor(
    @Inject(WORKSPACE_REPOSITORY)
    private readonly repository: WorkspaceRepository,
  ) {}

  create(input: CreateWorkspaceInput): Workspace {
    assertNonEmpty(input.name, 'name');
    assertNonEmpty(input.ownerUserId, 'ownerUserId');

    const workspace: Workspace = {
      id: toWorkspaceId(randomUUID()),
      name: input.name.trim(),
      ownerUserId: input.ownerUserId.trim(),
      status: WorkspaceStatus.Active,
      createdAt: input.createdAt ?? new Date().toISOString(),
    };

    this.repository.save(workspace);
    return workspace;
  }

  getById(id: WorkspaceId | string): Workspace | null {
    return this.repository.findById(id);
  }

  findByOwner(ownerUserId: string): Workspace[] {
    return this.repository.findByOwnerUserId(ownerUserId.trim());
  }

  rename(id: WorkspaceId | string, name: string): Workspace | null {
    const existing = this.repository.findById(id);
    if (!existing) return null;

    assertNonEmpty(name, 'name');
    existing.name = name.trim();
    this.repository.save(existing);
    return existing;
  }

  archive(id: WorkspaceId | string): Workspace | null {
    const existing = this.repository.findById(id);
    if (!existing) return null;

    existing.status = WorkspaceStatus.Archived;
    this.repository.save(existing);
    return existing;
  }
}

function assertNonEmpty(value: string, field: string): void {
  if (value.trim() === '') {
    throw new Error(`${field} must not be empty`);
  }
}
