import {
  BadRequestException,
  Controller,
  ForbiddenException,
  Get,
  Headers,
  HttpCode,
  Post,
  Req,
} from '@nestjs/common';
import type { AuthUser } from '../auth/jwt.strategy';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { PermissionClass } from '../auth/permission-catalog';
import { WorkspaceAccessService } from '../workspace';
import { DiscordProductService } from './discord-product.service';
import type {
  DiscordConnectionProductView,
  DiscordDiagnosticsView,
  DiscordTestProductView,
} from './discord.view';

type RequestWithUser = { user: AuthUser };

/**
 * PC-07 — HTTP transport for existing Discord connection operations.
 * Webhook URL is never accepted. No trading control plane.
 */
@Controller({ path: 'discord', version: '1' })
@RequirePermission(PermissionClass.Projection)
export class DiscordController {
  constructor(
    private readonly product: DiscordProductService,
    private readonly workspaceAccess: WorkspaceAccessService,
  ) {}

  @Get('connection')
  status(
    @Req() request: RequestWithUser,
    @Headers('x-workspace-id') workspaceHeader: string | undefined,
  ): DiscordConnectionProductView {
    const workspaceId = requireWorkspace(this.workspaceAccess, request.user, workspaceHeader);
    return this.product.getConnection(workspaceId, request.user.userId);
  }

  @RequirePermission(PermissionClass.OwnWorkspace)
  @Post('bind')
  @HttpCode(200)
  async bind(
    @Req() request: RequestWithUser,
    @Headers('x-workspace-id') workspaceHeader: string | undefined,
  ): Promise<DiscordConnectionProductView> {
    const workspaceId = requireWorkspace(this.workspaceAccess, request.user, workspaceHeader);
    try {
      return await this.product.bind(workspaceId, request.user.userId, {
        userId: request.user.userId,
        role: request.user.role,
      });
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Discord webhook is not configured',
      );
    }
  }

  @RequirePermission(PermissionClass.OwnWorkspace)
  @Post('test')
  @HttpCode(200)
  async sendTest(
    @Req() request: RequestWithUser,
    @Headers('x-workspace-id') workspaceHeader: string | undefined,
  ): Promise<DiscordTestProductView> {
    const workspaceId = requireWorkspace(this.workspaceAccess, request.user, workspaceHeader);
    try {
      return await this.product.sendTest(workspaceId, request.user.userId, {
        userId: request.user.userId,
        role: request.user.role,
      });
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Discord channel is not bound',
      );
    }
  }

  @RequirePermission(PermissionClass.OwnWorkspace)
  @Post('disconnect')
  @HttpCode(200)
  disconnect(
    @Req() request: RequestWithUser,
    @Headers('x-workspace-id') workspaceHeader: string | undefined,
  ): DiscordConnectionProductView {
    const workspaceId = requireWorkspace(this.workspaceAccess, request.user, workspaceHeader);
    return this.product.disconnect(workspaceId, request.user.userId);
  }

  @Get('diagnostics')
  diagnostics(
    @Req() request: RequestWithUser,
    @Headers('x-workspace-id') workspaceHeader: string | undefined,
  ): DiscordDiagnosticsView {
    const workspaceId = requireWorkspace(this.workspaceAccess, request.user, workspaceHeader);
    return this.product.getDiagnostics(workspaceId, request.user.userId);
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
