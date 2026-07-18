import { Inject, Injectable } from '@nestjs/common';
import { WorkspaceStatus } from './workspace-status';
import { WorkspaceDomainService } from './workspace-domain.service';

/**
 * Workspace membership gate for trading commands (US158).
 * Owner is an authorized member. Cross-workspace IDs yield no access.
 */
@Injectable()
export class WorkspaceAccessService {
  constructor(
    @Inject(WorkspaceDomainService)
    private readonly workspaces: WorkspaceDomainService,
  ) {}

  /**
   * Returns true only when the workspace exists, is active, and the actor is the owner.
   * Unknown workspace IDs never mutate and never leak foreign records.
   */
  isMember(workspaceId: string, userId: string): boolean {
    const workspace = this.workspaces.getById(workspaceId);
    if (!workspace) return false;
    if (workspace.status !== WorkspaceStatus.Active) return false;
    return workspace.ownerUserId === userId;
  }

  assertMember(workspaceId: string, userId: string): void {
    if (!this.isMember(workspaceId, userId)) {
      throw new Error('workspace access denied');
    }
  }

  /**
   * Resolve a workspace for command use, or null when the actor has no access.
   * Callers treat null as not-found to avoid cross-workspace leakage.
   */
  resolveAccessibleWorkspaceId(workspaceId: string, userId: string): string | null {
    return this.isMember(workspaceId, userId) ? workspaceId : null;
  }
}
