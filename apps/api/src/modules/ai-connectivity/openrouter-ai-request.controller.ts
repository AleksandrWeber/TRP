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
  Post,
  Req,
} from '@nestjs/common';
import type { AuthUser } from '../auth/jwt.strategy';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { PermissionClass } from '../auth/permission-catalog';
import { WorkspaceAccessService } from '../workspace';
import { WorkspaceAiRequestDto } from './workspace-ai-session.dto';
import { OpenRouterAiRequestService } from './openrouter-ai-request.service';
import type { WorkspaceAiRequestView } from './openrouter-ai-request';

type RequestWithUser = { user: AuthUser };

/**
 * Workspace AI Request transport (W2-S05-b/c).
 *
 * Executes one AI request for an OpenRouter connection in the active workspace.
 * Optional sessionId groups the request identity under a Session (metadata only).
 * Does not expose conversation, chat history, or prompt history.
 */
@Controller({ path: 'ai-connectivity', version: '1' })
@RequirePermission(PermissionClass.Projection)
export class OpenRouterAiRequestController {
  constructor(
    private readonly requests: OpenRouterAiRequestService,
    private readonly workspaceAccess: WorkspaceAccessService,
  ) {}

  @Get('connections/:id/request')
  lastRequest(
    @Req() request: RequestWithUser,
    @Headers('x-workspace-id') workspaceHeader: string | undefined,
    @Param('id') id: string,
  ): WorkspaceAiRequestView | { status: 'NONE' } {
    const workspaceId = requireWorkspace(this.workspaceAccess, request.user, workspaceHeader);
    return this.requests.lastResult(workspaceId, id) ?? { status: 'NONE' };
  }

  @RequirePermission(PermissionClass.Research)
  @Post('connections/:id/request')
  async execute(
    @Req() request: RequestWithUser,
    @Headers('x-workspace-id') workspaceHeader: string | undefined,
    @Param('id') id: string,
    @Body() body: WorkspaceAiRequestDto,
  ): Promise<WorkspaceAiRequestView> {
    try {
      return await this.requests.execute({
        workspaceId: requireWorkspace(this.workspaceAccess, request.user, workspaceHeader),
        actorUserId: request.user.userId,
        actorRole: request.user.role,
        connectionId: id,
        prompt: body.prompt,
        sessionId: body.sessionId,
      });
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      throw new BadRequestException('AI request could not be completed.');
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
