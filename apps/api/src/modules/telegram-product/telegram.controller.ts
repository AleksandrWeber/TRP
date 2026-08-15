import {
  BadRequestException,
  Controller,
  ForbiddenException,
  Get,
  Headers,
  HttpCode,
  NotFoundException,
  Param,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { DeliveryIdParamDto, ListNotificationDeliveriesQueryDto } from '../../validation';
import type { AuthUser } from '../auth/jwt.strategy';
import { WorkspaceAccessService } from '../workspace';
import { TelegramProductService } from './telegram-product.service';
import type {
  TelegramConnectProductView,
  TelegramConnectionProductView,
  TelegramDeliveryDetailView,
  TelegramDeliveryPageView,
  TelegramDiagnosticsView,
  TelegramTestProductView,
} from './telegram.view';

type RequestWithUser = { user: AuthUser };

/**
 * PC-07 — HTTP transport for existing Telegram connection operations.
 * Chat id is never accepted from the client. No Bot API. No duplicated domain.
 */
@Controller({ path: 'telegram', version: '1' })
export class TelegramController {
  constructor(
    private readonly product: TelegramProductService,
    private readonly workspaceAccess: WorkspaceAccessService,
  ) {}

  @Get('connection')
  status(
    @Req() request: RequestWithUser,
    @Headers('x-workspace-id') workspaceHeader: string | undefined,
  ): TelegramConnectionProductView {
    const workspaceId = requireWorkspace(this.workspaceAccess, request.user, workspaceHeader);
    return this.product.getConnection(workspaceId, request.user.userId);
  }

  @Post('connect')
  @HttpCode(200)
  connect(
    @Req() request: RequestWithUser,
    @Headers('x-workspace-id') workspaceHeader: string | undefined,
  ): TelegramConnectProductView {
    const workspaceId = requireWorkspace(this.workspaceAccess, request.user, workspaceHeader);
    return this.product.connect(workspaceId, request.user.userId);
  }

  @Post('complete')
  @HttpCode(200)
  complete(
    @Req() request: RequestWithUser,
    @Headers('x-workspace-id') workspaceHeader: string | undefined,
  ): TelegramConnectionProductView {
    const workspaceId = requireWorkspace(this.workspaceAccess, request.user, workspaceHeader);
    try {
      return this.product.complete(workspaceId, request.user.userId);
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Telegram connection is not awaiting bind',
      );
    }
  }

  @Post('verify')
  @HttpCode(200)
  verify(
    @Req() request: RequestWithUser,
    @Headers('x-workspace-id') workspaceHeader: string | undefined,
  ): TelegramConnectionProductView {
    const workspaceId = requireWorkspace(this.workspaceAccess, request.user, workspaceHeader);
    return this.product.verify(workspaceId, request.user.userId);
  }

  @Post('disconnect')
  @HttpCode(200)
  disconnect(
    @Req() request: RequestWithUser,
    @Headers('x-workspace-id') workspaceHeader: string | undefined,
  ): TelegramConnectionProductView {
    const workspaceId = requireWorkspace(this.workspaceAccess, request.user, workspaceHeader);
    return this.product.disconnect(workspaceId, request.user.userId);
  }

  @Post('test')
  @HttpCode(200)
  sendTest(
    @Req() request: RequestWithUser,
    @Headers('x-workspace-id') workspaceHeader: string | undefined,
  ): TelegramTestProductView {
    const workspaceId = requireWorkspace(this.workspaceAccess, request.user, workspaceHeader);
    return this.product.sendTest(workspaceId, request.user.userId);
  }

  @Get('diagnostics')
  diagnostics(
    @Req() request: RequestWithUser,
    @Headers('x-workspace-id') workspaceHeader: string | undefined,
  ): TelegramDiagnosticsView {
    const workspaceId = requireWorkspace(this.workspaceAccess, request.user, workspaceHeader);
    return this.product.getDiagnostics(workspaceId, request.user.userId);
  }

  @Get('deliveries')
  listDeliveries(
    @Req() request: RequestWithUser,
    @Headers('x-workspace-id') workspaceHeader: string | undefined,
    @Query() query: ListNotificationDeliveriesQueryDto,
  ): TelegramDeliveryPageView {
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

  @Get('deliveries/:deliveryId')
  getDelivery(
    @Req() request: RequestWithUser,
    @Headers('x-workspace-id') workspaceHeader: string | undefined,
    @Param() params: DeliveryIdParamDto,
  ): TelegramDeliveryDetailView {
    const workspaceId = requireWorkspace(this.workspaceAccess, request.user, workspaceHeader);
    const delivery = this.product.getDelivery(workspaceId, params.deliveryId, request.user.userId);
    if (!delivery) throw new NotFoundException('Telegram delivery not found');
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
