import {
  BadRequestException,
  Controller,
  ForbiddenException,
  Get,
  Inject,
  Param,
  Query,
  Req,
} from '@nestjs/common';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import type { AuthUser } from '../auth/jwt.strategy';
import { PermissionClass } from '../auth/permission-catalog';
import { WorkspaceAccessService } from '../workspace/workspace-access.service';
import { SecurityAuditTimelineService } from './security-audit-timeline.service';

type TimelineQuery = Readonly<{
  cursor?: string;
  pageSize?: string;
}>;

/**
 * Transport-only timeline foundation (V3-S05-b).
 * The endpoint supports chronological navigation only; it deliberately offers
 * no search, filters, export, retention controls, or event mutation.
 */
@Controller({ path: 'security-audit/workspaces/:workspaceId/timeline', version: '1' })
@RequirePermission(PermissionClass.RoleAdmin)
export class SecurityAuditTimelineController {
  constructor(
    @Inject(SecurityAuditTimelineService)
    private readonly timeline: SecurityAuditTimelineService,
    @Inject(WorkspaceAccessService)
    private readonly workspaceAccess: WorkspaceAccessService,
  ) {}

  @Get()
  async read(
    @Req() request: { user: AuthUser },
    @Param('workspaceId') workspaceId: string,
    @Query() query: TimelineQuery,
  ) {
    if (!this.workspaceAccess.isMember(workspaceId, request.user.userId)) {
      throw new ForbiddenException('Security Audit history is unavailable for this workspace.');
    }
    try {
      return await this.timeline.readWorkspaceTimeline({
        workspaceId,
        ...(query.cursor ? { cursor: query.cursor } : {}),
        ...(query.pageSize ? { pageSize: parsePageSize(query.pageSize) } : {}),
      });
    } catch (error) {
      if (
        error instanceof Error &&
        /timeline (cursor|pageSize)|requires a workspace/.test(error.message)
      ) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }
}

function parsePageSize(value: string): number {
  if (!/^\d+$/.test(value)) {
    throw new BadRequestException('Security Audit timeline pageSize must be a positive integer.');
  }
  return Number(value);
}
