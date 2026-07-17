import type { Workspace } from '../workspace';
import type { WorkspaceId } from '../workspace-id';

/**
 * Persistence contract for Workspace aggregates (US108).
 * Storage operations only — no tenant isolation / membership logic.
 */
export interface WorkspaceRepository {
  save(workspace: Workspace): void;
  findById(id: WorkspaceId | string): Workspace | null;
  findByOwnerUserId(ownerUserId: string): Workspace[];
  findAll(): Workspace[];
}
