import {
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Req,
} from '@nestjs/common';
import { IdParamDto, WorkspaceNameBodyDto } from '../../validation';
import type { AuthUser } from '../auth/jwt.strategy';
import { WorkspaceAccessService } from './workspace-access.service';
import { WorkspaceDomainService } from './workspace-domain.service';
import { WorkspaceStatus } from './workspace-status';
import type { Workspace } from './workspace';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { PermissionClass } from '../auth/permission-catalog';

export type WorkspaceView = {
  id: string;
  name: string;
  status: string;
  createdAt: string;
};

export type WorkspaceBootstrapResponse = WorkspaceView;

/**
 * Workspace HTTP adapter (US002 / PC-14).
 * Transports existing WorkspaceDomainService operations. Ownership stays on Workspace.
 */
@Controller({ path: 'workspaces', version: '1' })
@RequirePermission(PermissionClass.OwnWorkspace)
export class WorkspaceController {
  constructor(
    private readonly workspaces: WorkspaceDomainService,
    private readonly access: WorkspaceAccessService,
  ) {}

  @Post('bootstrap')
  async bootstrap(@Req() req: { user: AuthUser }): Promise<WorkspaceView> {
    const workspace = await this.workspaces.bootstrapForOwner(req.user.userId);
    return toView(workspace);
  }

  @Get()
  list(@Req() req: { user: AuthUser }): WorkspaceView[] {
    return this.workspaces
      .findByOwner(req.user.userId)
      .filter((workspace) => workspace.status === WorkspaceStatus.Active)
      .sort((left, right) => {
        const byCreated = left.createdAt.localeCompare(right.createdAt);
        return byCreated !== 0 ? byCreated : String(left.id).localeCompare(String(right.id));
      })
      .map(toView);
  }

  @Post()
  async create(
    @Req() req: { user: AuthUser },
    @Body() body: WorkspaceNameBodyDto,
  ): Promise<WorkspaceView> {
    try {
      const workspace = await this.workspaces.create({
        name: body.name,
        ownerUserId: req.user.userId,
      });
      return toView(workspace);
    } catch (error) {
      throw mapWorkspaceWriteError(error);
    }
  }

  @Get(':id')
  get(@Req() req: { user: AuthUser }, @Param() params: IdParamDto): WorkspaceView {
    return toView(this.requireOwnedActive(params.id, req.user.userId));
  }

  @Patch(':id')
  async rename(
    @Req() req: { user: AuthUser },
    @Param() params: IdParamDto,
    @Body() body: WorkspaceNameBodyDto,
  ): Promise<WorkspaceView> {
    this.requireOwnedActive(params.id, req.user.userId);
    try {
      const renamed = await this.workspaces.rename(params.id, body.name);
      if (!renamed) throw new NotFoundException('Workspace not found');
      return toView(renamed);
    } catch (error) {
      throw mapWorkspaceWriteError(error);
    }
  }

  @Post(':id/archive')
  async archive(
    @Req() req: { user: AuthUser },
    @Param() params: IdParamDto,
  ): Promise<WorkspaceView> {
    this.requireOwnedActive(params.id, req.user.userId);
    const archived = await this.workspaces.archive(params.id);
    if (!archived) throw new NotFoundException('Workspace not found');
    return toView(archived);
  }

  /**
   * Switch / read transport: owned active workspace only.
   * Missing, foreign, or archived ids are 404 — never leaked.
   */
  private requireOwnedActive(id: string, userId: string): Workspace {
    if (!this.access.isMember(id, userId)) {
      throw new NotFoundException('Workspace not found');
    }
    const workspace = this.workspaces.getById(id);
    if (!workspace) throw new NotFoundException('Workspace not found');
    return workspace;
  }
}

function toView(workspace: Workspace): WorkspaceView {
  return {
    id: workspace.id,
    name: workspace.name,
    status: workspace.status,
    createdAt: workspace.createdAt,
  };
}

function mapWorkspaceWriteError(error: unknown): never {
  if (error instanceof NotFoundException || error instanceof BadRequestException) {
    throw error;
  }
  const text = error instanceof Error ? error.message : String(error);
  if (/must not be empty/i.test(text)) {
    throw new BadRequestException(text);
  }
  throw error;
}
