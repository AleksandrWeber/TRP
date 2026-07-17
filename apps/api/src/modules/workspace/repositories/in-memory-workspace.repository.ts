import type { Workspace } from '../workspace';
import type { WorkspaceId } from '../workspace-id';
import type { WorkspaceRepository } from './workspace.repository';

/**
 * In-memory WorkspaceRepository (Map-backed) (US108).
 * No filesystem, database, or serialization.
 */
export class InMemoryWorkspaceRepository implements WorkspaceRepository {
  private readonly byId = new Map<string, Workspace>();

  save(workspace: Workspace): void {
    const stored: Workspace = {
      id: workspace.id,
      name: workspace.name,
      ownerUserId: workspace.ownerUserId,
      status: workspace.status,
      createdAt: workspace.createdAt,
    };
    this.byId.set(workspace.id, stored);
  }

  findById(id: WorkspaceId | string): Workspace | null {
    return this.byId.get(id) ?? null;
  }

  findByOwnerUserId(ownerUserId: string): Workspace[] {
    return Array.from(this.byId.values()).filter((item) => item.ownerUserId === ownerUserId);
  }

  findAll(): Workspace[] {
    return Array.from(this.byId.values());
  }
}
