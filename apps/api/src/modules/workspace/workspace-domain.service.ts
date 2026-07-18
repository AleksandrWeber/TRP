import { Inject, Injectable, type OnModuleInit } from '@nestjs/common';
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
 * Workspace domain service (US108 / US002).
 * create / getById / findByOwner / bootstrapForOwner / rename / archive.
 * Storage is delegated to WorkspaceRepository (no owned Map).
 *
 * Independent of Campaign / Auth / REST / Pipeline / Prisma.
 */
@Injectable()
export class WorkspaceDomainService implements OnModuleInit {
  private readonly byId = new Map<string, Workspace>();
  private readonly bootstrapInFlight = new Map<string, Promise<Workspace>>();

  constructor(
    @Inject(WORKSPACE_REPOSITORY)
    private readonly repository: WorkspaceRepository,
  ) {}

  async onModuleInit(): Promise<void> {
    for (const workspace of await this.repository.findAll()) {
      this.byId.set(workspace.id, workspace);
    }
  }

  async create(input: CreateWorkspaceInput): Promise<Workspace> {
    assertNonEmpty(input.name, 'name');
    assertNonEmpty(input.ownerUserId, 'ownerUserId');

    const workspace: Workspace = {
      id: toWorkspaceId(randomUUID()),
      name: input.name.trim(),
      ownerUserId: input.ownerUserId.trim(),
      status: WorkspaceStatus.Active,
      createdAt: input.createdAt ?? new Date().toISOString(),
    };

    await this.repository.save(workspace);
    this.byId.set(workspace.id, workspace);
    return workspace;
  }

  getById(id: WorkspaceId | string): Workspace | null {
    return this.byId.get(String(id)) ?? null;
  }

  findByOwner(ownerUserId: string): Workspace[] {
    const owner = ownerUserId.trim();
    return [...this.byId.values()].filter((workspace) => workspace.ownerUserId === owner);
  }

  /**
   * Idempotent active-workspace bootstrap (US002).
   * Returns the owner's earliest active workspace, or creates a default one.
   * Concurrent calls for the same owner share one in-flight promise.
   */
  async bootstrapForOwner(ownerUserId: string): Promise<Workspace> {
    const owner = ownerUserId.trim();
    assertNonEmpty(owner, 'ownerUserId');

    const inFlight = this.bootstrapInFlight.get(owner);
    if (inFlight) return inFlight;

    const promise = this.resolveOrCreateActive(owner).finally(() => {
      this.bootstrapInFlight.delete(owner);
    });
    this.bootstrapInFlight.set(owner, promise);
    return promise;
  }

  async rename(id: WorkspaceId | string, name: string): Promise<Workspace | null> {
    const existing = this.getById(id);
    if (!existing) return null;

    assertNonEmpty(name, 'name');
    existing.name = name.trim();
    await this.repository.save(existing);
    this.byId.set(existing.id, existing);
    return existing;
  }

  async archive(id: WorkspaceId | string): Promise<Workspace | null> {
    const existing = this.getById(id);
    if (!existing) return null;

    existing.status = WorkspaceStatus.Archived;
    await this.repository.save(existing);
    this.byId.set(existing.id, existing);
    return existing;
  }

  private async resolveOrCreateActive(ownerUserId: string): Promise<Workspace> {
    const active = this.findByOwner(ownerUserId)
      .filter((workspace) => workspace.status === WorkspaceStatus.Active)
      .sort((left, right) => {
        const byCreated = left.createdAt.localeCompare(right.createdAt);
        return byCreated !== 0 ? byCreated : String(left.id).localeCompare(String(right.id));
      });

    if (active[0]) return active[0];

    return this.create({
      name: DEFAULT_WORKSPACE_NAME,
      ownerUserId,
    });
  }
}

const DEFAULT_WORKSPACE_NAME = 'Default Workspace';

function assertNonEmpty(value: string, field: string): void {
  if (value.trim() === '') {
    throw new Error(`${field} must not be empty`);
  }
}
