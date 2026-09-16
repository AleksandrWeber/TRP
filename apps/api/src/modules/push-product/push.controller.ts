import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Headers,
  HttpCode,
  NotFoundException,
  Param,
  Post,
  Req,
} from '@nestjs/common';
import type { AuthUser } from '../auth/jwt.strategy';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { PermissionClass } from '../auth/permission-catalog';
import { WorkspaceAccessService } from '../workspace';
import { PushProductService } from './push-product.service';
import type {
  PushConnectionProductView,
  PushDiagnosticsView,
  PushSubscriptionProductView,
  PushTestProductView,
  PushVapidPublicKeyView,
} from './push.view';

type RequestWithUser = { user: AuthUser };

type RegisterSubscriptionBody = {
  endpoint?: string;
  keys?: { p256dh?: string; auth?: string };
  expirationTime?: number | null;
};

/**
 * PC-07 — HTTP transport for existing Push connection operations.
 * VAPID private key is never accepted. No trading control plane.
 */
@Controller({ path: 'push', version: '1' })
@RequirePermission(PermissionClass.Projection)
export class PushController {
  constructor(
    private readonly product: PushProductService,
    private readonly workspaceAccess: WorkspaceAccessService,
  ) {}

  @Get('connection')
  status(
    @Req() request: RequestWithUser,
    @Headers('x-workspace-id') workspaceHeader: string | undefined,
  ): PushConnectionProductView {
    const workspaceId = requireWorkspace(this.workspaceAccess, request.user, workspaceHeader);
    return this.product.getConnection(workspaceId, request.user.userId);
  }

  @RequirePermission(PermissionClass.OwnWorkspace)
  @Post('bind')
  @HttpCode(200)
  async bind(
    @Req() request: RequestWithUser,
    @Headers('x-workspace-id') workspaceHeader: string | undefined,
  ): Promise<PushConnectionProductView> {
    const workspaceId = requireWorkspace(this.workspaceAccess, request.user, workspaceHeader);
    try {
      return await this.product.bind(workspaceId, request.user.userId, {
        userId: request.user.userId,
        role: request.user.role,
      });
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Web Push VAPID is not configured',
      );
    }
  }

  @Get('vapid-public-key')
  async vapidPublicKey(
    @Req() request: RequestWithUser,
    @Headers('x-workspace-id') workspaceHeader: string | undefined,
  ): Promise<PushVapidPublicKeyView> {
    const workspaceId = requireWorkspace(this.workspaceAccess, request.user, workspaceHeader);
    try {
      return await this.product.getVapidPublicKey(workspaceId, {
        userId: request.user.userId,
        role: request.user.role,
      });
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Web Push VAPID is not configured',
      );
    }
  }

  @RequirePermission(PermissionClass.OwnWorkspace)
  @Post('subscriptions')
  @HttpCode(200)
  async registerSubscription(
    @Req() request: RequestWithUser,
    @Headers('x-workspace-id') workspaceHeader: string | undefined,
    @Headers('user-agent') userAgent: string | undefined,
    @Body() body: RegisterSubscriptionBody,
  ): Promise<PushSubscriptionProductView> {
    const workspaceId = requireWorkspace(this.workspaceAccess, request.user, workspaceHeader);
    const endpoint = body.endpoint?.trim() ?? '';
    const p256dh = body.keys?.p256dh?.trim() ?? '';
    const auth = body.keys?.auth?.trim() ?? '';
    if (!endpoint || !p256dh || !auth) {
      throw new BadRequestException('endpoint and keys.p256dh / keys.auth are required');
    }
    try {
      return await this.product.registerSubscription(
        workspaceId,
        request.user.userId,
        {
          endpoint,
          keys: { p256dh, auth },
          ...(body.expirationTime !== undefined ? { expirationTime: body.expirationTime } : {}),
        },
        userAgent,
      );
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Web Push subscription could not be stored',
      );
    }
  }

  @RequirePermission(PermissionClass.OwnWorkspace)
  @Delete('subscriptions/:id')
  @HttpCode(200)
  async revokeSubscription(
    @Req() request: RequestWithUser,
    @Headers('x-workspace-id') workspaceHeader: string | undefined,
    @Param('id') subscriptionId: string,
  ): Promise<PushSubscriptionProductView> {
    const workspaceId = requireWorkspace(this.workspaceAccess, request.user, workspaceHeader);
    const revoked = await this.product.revokeSubscription(
      workspaceId,
      request.user.userId,
      subscriptionId,
    );
    if (!revoked) {
      throw new NotFoundException('subscription not found');
    }
    return revoked;
  }

  @RequirePermission(PermissionClass.OwnWorkspace)
  @Post('test')
  @HttpCode(200)
  async sendTest(
    @Req() request: RequestWithUser,
    @Headers('x-workspace-id') workspaceHeader: string | undefined,
  ): Promise<PushTestProductView> {
    const workspaceId = requireWorkspace(this.workspaceAccess, request.user, workspaceHeader);
    try {
      return await this.product.sendTest(workspaceId, request.user.userId, {
        userId: request.user.userId,
        role: request.user.role,
      });
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Push channel is not bound',
      );
    }
  }

  @RequirePermission(PermissionClass.OwnWorkspace)
  @Post('disconnect')
  @HttpCode(200)
  async disconnect(
    @Req() request: RequestWithUser,
    @Headers('x-workspace-id') workspaceHeader: string | undefined,
  ): Promise<PushConnectionProductView> {
    const workspaceId = requireWorkspace(this.workspaceAccess, request.user, workspaceHeader);
    return this.product.disconnect(workspaceId, request.user.userId);
  }

  @Get('diagnostics')
  async diagnostics(
    @Req() request: RequestWithUser,
    @Headers('x-workspace-id') workspaceHeader: string | undefined,
  ): Promise<PushDiagnosticsView> {
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
