import {
  BadRequestException,
  Controller,
  ForbiddenException,
  Get,
  Headers,
  Req,
} from '@nestjs/common';
import type { AuthUser } from '../auth/jwt.strategy';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { PermissionClass } from '../auth/permission-catalog';
import { WorkspaceAccessService } from '../workspace';
import { OperationalContinuityService } from './operational-continuity.service';
import type { PlatformOperationalProjection } from './operational-readiness';

type RequestWithUser = { user: AuthUser };

/**
 * W3-O01-d — Read-only Operational Continuity / platform readiness projection.
 * Not a monitoring dashboard. Not incident management. Not infrastructure health.
 */
@Controller({ path: 'operational-continuity', version: '1' })
@RequirePermission(PermissionClass.Projection)
export class OperationalContinuityController {
  constructor(
    private readonly continuity: OperationalContinuityService,
    private readonly workspaceAccess: WorkspaceAccessService,
  ) {}

  @Get('readiness')
  readiness(
    @Req() request: RequestWithUser,
    @Headers('x-workspace-id') workspaceHeader: string | undefined,
  ): PlatformOperationalProjection {
    this.requireWorkspace(request.user, workspaceHeader);
    return this.continuity.getProjection();
  }

  private requireWorkspace(user: AuthUser, workspaceHeader: string | undefined): string {
    const workspaceId = workspaceHeader?.trim();
    if (!workspaceId) {
      throw new BadRequestException('X-Workspace-Id header is required');
    }
    try {
      this.workspaceAccess.assertMember(workspaceId, user.userId);
    } catch {
      throw new ForbiddenException('workspace access denied');
    }
    return workspaceId;
  }
}
