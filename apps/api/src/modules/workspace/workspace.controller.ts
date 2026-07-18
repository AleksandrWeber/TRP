import { Controller, Post, Req } from '@nestjs/common';
import type { AuthUser } from '../auth/jwt.strategy';
import { WorkspaceDomainService } from './workspace-domain.service';

export type WorkspaceBootstrapResponse = {
  id: string;
  name: string;
  status: string;
  createdAt: string;
};

/**
 * Workspace HTTP adapter (US002).
 * POST /v1/workspaces/bootstrap — discover or create the caller's active workspace.
 */
@Controller({ path: 'workspaces', version: '1' })
export class WorkspaceController {
  constructor(private readonly workspaces: WorkspaceDomainService) {}

  @Post('bootstrap')
  async bootstrap(@Req() req: { user: AuthUser }): Promise<WorkspaceBootstrapResponse> {
    const workspace = await this.workspaces.bootstrapForOwner(req.user.userId);
    return {
      id: workspace.id,
      name: workspace.name,
      status: workspace.status,
      createdAt: workspace.createdAt,
    };
  }
}
