import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  ForbiddenException,
  Get,
  Headers,
  NotFoundException,
  Param,
  Patch,
  Post,
  Req,
} from '@nestjs/common';
import type { AuthUser } from '../auth/jwt.strategy';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { PermissionClass } from '../auth/permission-catalog';
import { WorkspaceAccessService } from '../workspace';
import {
  CreateWorkspaceAiSessionDto,
  RenameWorkspaceAiSessionDto,
} from './workspace-ai-session.dto';
import { WorkspaceAiSessionService } from './workspace-ai-session.service';
import type { WorkspaceAiSessionView } from './workspace-ai-session';

type RequestWithUser = { user: AuthUser };

/**
 * Workspace AI Session transport (W2-S05-c).
 *
 * Metadata lifecycle only. Does not expose conversation, chat history,
 * prompt bodies, or AI memory.
 */
@Controller({ path: 'ai-connectivity/ai-sessions', version: '1' })
@RequirePermission(PermissionClass.Projection)
export class WorkspaceAiSessionController {
  constructor(
    private readonly sessions: WorkspaceAiSessionService,
    private readonly workspaceAccess: WorkspaceAccessService,
  ) {}

  @Get()
  list(
    @Req() request: RequestWithUser,
    @Headers('x-workspace-id') workspaceHeader: string | undefined,
  ): Promise<WorkspaceAiSessionView[]> {
    return this.sessions.list(
      requireWorkspace(this.workspaceAccess, request.user, workspaceHeader),
    );
  }

  @Get(':sessionId')
  get(
    @Req() request: RequestWithUser,
    @Headers('x-workspace-id') workspaceHeader: string | undefined,
    @Param('sessionId') sessionId: string,
  ): Promise<WorkspaceAiSessionView> {
    return this.sessions.get(
      requireWorkspace(this.workspaceAccess, request.user, workspaceHeader),
      sessionId,
    );
  }

  @RequirePermission(PermissionClass.Research)
  @Post()
  create(
    @Req() request: RequestWithUser,
    @Headers('x-workspace-id') workspaceHeader: string | undefined,
    @Body() body: CreateWorkspaceAiSessionDto,
  ): Promise<WorkspaceAiSessionView> {
    return this.sessions.create({
      workspaceId: requireWorkspace(this.workspaceAccess, request.user, workspaceHeader),
      actorUserId: request.user.userId,
      displayName: body.displayName,
    });
  }

  @RequirePermission(PermissionClass.Research)
  @Patch(':sessionId')
  async rename(
    @Req() request: RequestWithUser,
    @Headers('x-workspace-id') workspaceHeader: string | undefined,
    @Param('sessionId') sessionId: string,
    @Body() body: RenameWorkspaceAiSessionDto,
  ): Promise<WorkspaceAiSessionView> {
    try {
      return await this.sessions.rename({
        workspaceId: requireWorkspace(this.workspaceAccess, request.user, workspaceHeader),
        sessionId,
        displayName: body.displayName,
      });
    } catch (error) {
      throw mapSessionError(error);
    }
  }

  @RequirePermission(PermissionClass.Research)
  @Post(':sessionId/close')
  async close(
    @Req() request: RequestWithUser,
    @Headers('x-workspace-id') workspaceHeader: string | undefined,
    @Param('sessionId') sessionId: string,
  ): Promise<WorkspaceAiSessionView> {
    try {
      return await this.sessions.close({
        workspaceId: requireWorkspace(this.workspaceAccess, request.user, workspaceHeader),
        actorUserId: request.user.userId,
        sessionId,
      });
    } catch (error) {
      throw mapSessionError(error);
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

function mapSessionError(error: unknown): Error {
  if (
    error instanceof ConflictException ||
    error instanceof NotFoundException ||
    error instanceof BadRequestException ||
    error instanceof ForbiddenException
  ) {
    return error;
  }
  return new BadRequestException('AI Session action could not be completed.');
}
