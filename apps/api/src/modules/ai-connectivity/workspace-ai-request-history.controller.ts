import {
  BadRequestException,
  Controller,
  ForbiddenException,
  Get,
  Headers,
  NotFoundException,
  Param,
  Query,
  Req,
} from '@nestjs/common';
import type { AuthUser } from '../auth/jwt.strategy';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { PermissionClass } from '../auth/permission-catalog';
import { WorkspaceAccessService } from '../workspace';
import { WorkspaceAiRequestHistoryService } from './workspace-ai-request-history.service';
import type { WorkspaceAiRequestHistoryView } from './workspace-ai-request-history';

type RequestWithUser = { user: AuthUser };

/**
 * Workspace AI Request History transport (W2-S05-d).
 *
 * Read-only projections. Does not expose conversation reconstruction,
 * prompt replay, AI memory, or Knowledge.
 */
@Controller({ path: 'ai-connectivity/ai-request-history', version: '1' })
@RequirePermission(PermissionClass.Projection)
export class WorkspaceAiRequestHistoryController {
  constructor(
    private readonly history: WorkspaceAiRequestHistoryService,
    private readonly workspaceAccess: WorkspaceAccessService,
  ) {}

  @Get()
  list(
    @Req() request: RequestWithUser,
    @Headers('x-workspace-id') workspaceHeader: string | undefined,
    @Query('sessionId') sessionId?: string,
    @Query('status') status?: string,
    @Query('requestId') requestId?: string,
  ): Promise<WorkspaceAiRequestHistoryView[]> {
    return this.history.list(
      requireWorkspace(this.workspaceAccess, request.user, workspaceHeader),
      request.user.userId,
      {
        sessionId: sessionId?.trim() || undefined,
        status: status?.trim() || undefined,
        requestId: requestId?.trim() || undefined,
      },
    );
  }

  @Get(':historyId')
  async get(
    @Req() request: RequestWithUser,
    @Headers('x-workspace-id') workspaceHeader: string | undefined,
    @Param('historyId') historyId: string,
  ): Promise<WorkspaceAiRequestHistoryView> {
    try {
      return await this.history.get(
        requireWorkspace(this.workspaceAccess, request.user, workspaceHeader),
        request.user.userId,
        historyId,
      );
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      throw new BadRequestException('AI Request History could not be retrieved.');
    }
  }
}

function requireWorkspace(
  access: WorkspaceAccessService,
  user: AuthUser,
  workspaceHeader: string | undefined,
): string {
  const workspaceId = workspaceHeader?.trim();
  if (!workspaceId) {
    throw new BadRequestException('X-Workspace-Id header is required');
  }
  try {
    access.assertMember(workspaceId, user.userId);
  } catch {
    throw new ForbiddenException('workspace access denied');
  }
  return workspaceId;
}
