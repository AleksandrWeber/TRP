import {
  BadRequestException,
  Controller,
  ForbiddenException,
  Get,
  Headers,
  NotFoundException,
  Param,
  Put,
  Body,
  Query,
  Req,
} from '@nestjs/common';
import {
  DeliveryIdParamDto,
  ListNotificationDeliveriesQueryDto,
  NotificationChannelIdParamDto,
  UpsertNotificationPreferencesBodyDto,
} from '../../validation';
import type { AuthUser } from '../auth/jwt.strategy';
import { WorkspaceAccessService } from '../workspace';
import { NotificationProductService } from './notification-product.service';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { PermissionClass } from '../auth/permission-catalog';
import type {
  NotificationChannelPageView,
  NotificationDeliveryDetailView,
  NotificationDeliveryPageView,
  NotificationPreferencesView,
  NotificationRoutingView,
  NotificationSettingsView,
} from './notification.view';
import type {
  NotificationChannelDetailView,
  NotificationChannelDiagnosticsView,
  NotificationChannelsWorkspaceView,
} from './notification-channel.view';

type RequestWithUser = { user: AuthUser };

/**
 * PC-06 — HTTP transport for existing Notification queries and preference upserts.
 * Does not deliver, connect Telegram, send tests, or activate reserved channels.
 */
@Controller({ path: 'notification-settings', version: '1' })
@RequirePermission(PermissionClass.Projection)
export class NotificationSettingsController {
  constructor(
    private readonly product: NotificationProductService,
    private readonly workspaceAccess: WorkspaceAccessService,
  ) {}

  @Get()
  get(
    @Req() request: RequestWithUser,
    @Headers('x-workspace-id') workspaceHeader: string | undefined,
  ): NotificationSettingsView {
    const workspaceId = requireWorkspace(this.workspaceAccess, request.user, workspaceHeader);
    return this.product.getSettings(workspaceId, request.user.userId);
  }
}

@Controller({ path: 'notification-preferences', version: '1' })
@RequirePermission(PermissionClass.Projection)
export class NotificationPreferencesController {
  constructor(
    private readonly product: NotificationProductService,
    private readonly workspaceAccess: WorkspaceAccessService,
  ) {}

  @Get()
  get(
    @Req() request: RequestWithUser,
    @Headers('x-workspace-id') workspaceHeader: string | undefined,
  ): NotificationPreferencesView {
    const workspaceId = requireWorkspace(this.workspaceAccess, request.user, workspaceHeader);
    return this.product.getPreferences(workspaceId, request.user.userId);
  }

  @RequirePermission(PermissionClass.OwnWorkspace)
  @Put()
  upsert(
    @Req() request: RequestWithUser,
    @Headers('x-workspace-id') workspaceHeader: string | undefined,
    @Body() body: UpsertNotificationPreferencesBodyDto,
  ): NotificationPreferencesView {
    const workspaceId = requireWorkspace(this.workspaceAccess, request.user, workspaceHeader);
    try {
      return this.product.upsertPreferences({
        workspaceId,
        userId: request.user.userId,
        enabled: body.enabled,
        channels: body.channels,
        typeRouting: body.typeRouting,
        schedule: body.schedule
          ? {
              dailyDeliveryTime: body.schedule.dailyDeliveryTime,
              timezone: body.schedule.timezone,
              quietHours: body.schedule.quietHours === null ? null : body.schedule.quietHours,
              criticalBypassQuietHours: body.schedule.criticalBypassQuietHours,
            }
          : undefined,
      });
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Invalid notification preferences',
      );
    }
  }
}

@Controller({ path: 'notification-channels', version: '1' })
@RequirePermission(PermissionClass.Projection)
export class NotificationChannelsController {
  constructor(
    private readonly product: NotificationProductService,
    private readonly workspaceAccess: WorkspaceAccessService,
  ) {}

  @Get()
  list(
    @Req() request: RequestWithUser,
    @Headers('x-workspace-id') workspaceHeader: string | undefined,
  ): NotificationChannelPageView {
    requireWorkspace(this.workspaceAccess, request.user, workspaceHeader);
    return this.product.listChannels();
  }

  @Get('workspace')
  workspace(
    @Req() request: RequestWithUser,
    @Headers('x-workspace-id') workspaceHeader: string | undefined,
  ): NotificationChannelsWorkspaceView {
    const workspaceId = requireWorkspace(this.workspaceAccess, request.user, workspaceHeader);
    return this.product.getChannelsWorkspace(workspaceId, request.user.userId);
  }

  @Get(':channelId/deliveries')
  listDeliveries(
    @Req() request: RequestWithUser,
    @Headers('x-workspace-id') workspaceHeader: string | undefined,
    @Param() params: NotificationChannelIdParamDto,
    @Query() query: ListNotificationDeliveriesQueryDto,
  ): NotificationDeliveryPageView {
    const workspaceId = requireWorkspace(this.workspaceAccess, request.user, workspaceHeader);
    return this.product.listChannelDeliveries({
      workspaceId,
      channelId: params.channelId,
      userId: query.userId,
      reportRunId: query.reportRunId,
      type: query.type,
      outcome: query.outcome,
      q: query.q,
      limit: query.limit,
    });
  }

  @Get(':channelId/diagnostics')
  diagnostics(
    @Req() request: RequestWithUser,
    @Headers('x-workspace-id') workspaceHeader: string | undefined,
    @Param() params: NotificationChannelIdParamDto,
  ): NotificationChannelDiagnosticsView {
    const workspaceId = requireWorkspace(this.workspaceAccess, request.user, workspaceHeader);
    const diagnostics = this.product.getChannelDiagnostics(
      workspaceId,
      request.user.userId,
      params.channelId,
    );
    if (!diagnostics) throw new NotFoundException('Notification channel not found');
    return diagnostics;
  }

  @Get(':channelId')
  get(
    @Req() request: RequestWithUser,
    @Headers('x-workspace-id') workspaceHeader: string | undefined,
    @Param() params: NotificationChannelIdParamDto,
  ): NotificationChannelDetailView {
    const workspaceId = requireWorkspace(this.workspaceAccess, request.user, workspaceHeader);
    const channel = this.product.getChannel(workspaceId, request.user.userId, params.channelId);
    if (!channel) throw new NotFoundException('Notification channel not found');
    return channel;
  }
}

@Controller({ path: 'notification-routing', version: '1' })
@RequirePermission(PermissionClass.Projection)
export class NotificationRoutingController {
  constructor(
    private readonly product: NotificationProductService,
    private readonly workspaceAccess: WorkspaceAccessService,
  ) {}

  @Get()
  get(
    @Req() request: RequestWithUser,
    @Headers('x-workspace-id') workspaceHeader: string | undefined,
  ): NotificationRoutingView {
    const workspaceId = requireWorkspace(this.workspaceAccess, request.user, workspaceHeader);
    return this.product.getRouting(workspaceId, request.user.userId);
  }
}

@Controller({ path: 'notification-deliveries', version: '1' })
@RequirePermission(PermissionClass.Projection)
export class NotificationDeliveriesController {
  constructor(
    private readonly product: NotificationProductService,
    private readonly workspaceAccess: WorkspaceAccessService,
  ) {}

  @Get()
  list(
    @Req() request: RequestWithUser,
    @Headers('x-workspace-id') workspaceHeader: string | undefined,
    @Query() query: ListNotificationDeliveriesQueryDto,
  ): NotificationDeliveryPageView {
    const workspaceId = requireWorkspace(this.workspaceAccess, request.user, workspaceHeader);
    return this.product.listDeliveries({
      workspaceId,
      userId: query.userId,
      reportRunId: query.reportRunId,
      type: query.type,
      outcome: query.outcome,
      q: query.q,
      limit: query.limit,
    });
  }

  @Get(':deliveryId')
  get(
    @Req() request: RequestWithUser,
    @Headers('x-workspace-id') workspaceHeader: string | undefined,
    @Param() params: DeliveryIdParamDto,
  ): NotificationDeliveryDetailView {
    const workspaceId = requireWorkspace(this.workspaceAccess, request.user, workspaceHeader);
    const delivery = this.product.getDelivery(workspaceId, params.deliveryId, request.user.userId);
    if (!delivery) throw new NotFoundException('Notification delivery not found');
    return delivery;
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
