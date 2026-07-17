import type { WorkspaceId } from './workspace-id';
import type { WorkspaceStatus } from './workspace-status';

/**
 * Workspace aggregate (US108).
 * Top-level multi-tenant container — not linked to Campaign yet.
 */
export type Workspace = {
  id: WorkspaceId;
  name: string;
  ownerUserId: string;
  status: WorkspaceStatus;
  createdAt: string;
};
