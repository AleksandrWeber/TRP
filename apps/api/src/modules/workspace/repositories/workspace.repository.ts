import type { Workspace } from '../workspace';
import type { WorkspaceId } from '../workspace-id';

/**
 * Persistence contract for Workspace aggregates (US108).
 * Storage operations only — no tenant isolation / membership logic.
 */
export interface WorkspaceRepository {
  save(workspace: Workspace): Promise<void>;
  findById(id: WorkspaceId | string): Promise<Workspace | null>;
  findByOwnerUserId(ownerUserId: string): Promise<Workspace[]>;
  findAll(): Promise<Workspace[]>;
}
