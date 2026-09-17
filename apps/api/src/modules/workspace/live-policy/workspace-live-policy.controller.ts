import {
  Controller,
  Inject,
  NotFoundException,
  Param,
  Post,
  Req,
  ValidationPipe,
} from '@nestjs/common';
import { IsString, MinLength } from 'class-validator';
import { VALIDATION_PIPE_OPTIONS } from '../../../validation';
import type { AuthUser } from '../../auth/jwt.strategy';
import { RequirePermission } from '../../auth/decorators/require-permission.decorator';
import { PermissionClass } from '../../auth/permission-catalog';
import { WorkspaceAccessService } from '../workspace-access.service';
import {
  WorkspaceLivePolicyAdminService,
  type WorkspaceLivePolicyAdminView,
} from './workspace-live-policy-admin.service';

export class WorkspaceLivePolicyWorkspaceIdParamDto {
  @IsString()
  @MinLength(1)
  workspaceId!: string;
}

/**
 * PROPOSED-V3-L01-S03 — Admin enable/disable HTTP adapter.
 *
 * POST /v1/workspaces/:workspaceId/live-policy/enable
 * POST /v1/workspaces/:workspaceId/live-policy/disable
 *
 * Authorization: RoleAdmin (C6) + active workspace membership.
 * CSRF: global AuthCsrfGuard for cookie-authenticated mutations.
 * LiveCommand (C7) is not used. No GET endpoint (PO-S03-02).
 */
@Controller({ path: 'workspaces/:workspaceId/live-policy', version: '1' })
@RequirePermission(PermissionClass.RoleAdmin)
export class WorkspaceLivePolicyController {
  constructor(
    @Inject(WorkspaceLivePolicyAdminService)
    private readonly admin: WorkspaceLivePolicyAdminService,
    @Inject(WorkspaceAccessService) private readonly access: WorkspaceAccessService,
  ) {}

  @Post('enable')
  async enable(
    @Req() req: { user: AuthUser; headers?: Record<string, string | string[] | undefined> },
    @Param(
      new ValidationPipe({
        ...VALIDATION_PIPE_OPTIONS,
        expectedType: WorkspaceLivePolicyWorkspaceIdParamDto,
      }),
    )
    params: WorkspaceLivePolicyWorkspaceIdParamDto,
  ): Promise<WorkspaceLivePolicyAdminView> {
    this.requireMember(params.workspaceId, req.user.userId);
    return this.admin.enable({
      workspaceId: params.workspaceId,
      actorUserId: req.user.userId,
      correlationId: correlationIdFrom(req.headers),
    });
  }

  @Post('disable')
  async disable(
    @Req() req: { user: AuthUser; headers?: Record<string, string | string[] | undefined> },
    @Param(
      new ValidationPipe({
        ...VALIDATION_PIPE_OPTIONS,
        expectedType: WorkspaceLivePolicyWorkspaceIdParamDto,
      }),
    )
    params: WorkspaceLivePolicyWorkspaceIdParamDto,
  ): Promise<WorkspaceLivePolicyAdminView> {
    this.requireMember(params.workspaceId, req.user.userId);
    return this.admin.disable({
      workspaceId: params.workspaceId,
      actorUserId: req.user.userId,
      correlationId: correlationIdFrom(req.headers),
    });
  }

  /**
   * Missing, foreign, or archived workspaces are 404 — never leaked
   * (workspace.controller requireOwnedActive precedent).
   */
  private requireMember(workspaceId: string, userId: string): void {
    if (!this.access.isMember(workspaceId, userId)) {
      throw new NotFoundException('Workspace not found');
    }
  }
}

function correlationIdFrom(
  headers: Record<string, string | string[] | undefined> | undefined,
): string | undefined {
  if (!headers) return undefined;
  const raw = headers['x-request-id'] ?? headers['x-correlation-id'];
  if (typeof raw === 'string' && raw.trim().length > 0) return raw.trim();
  if (Array.isArray(raw) && typeof raw[0] === 'string' && raw[0].trim().length > 0) {
    return raw[0].trim();
  }
  return undefined;
}
