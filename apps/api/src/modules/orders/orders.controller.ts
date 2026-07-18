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
import { CreateOrderBodyDto } from '../../validation';
import { CommandAuthorizationService } from '../auth/command-authorization.service';
import { Roles } from '../auth/decorators/roles.decorator';
import type { AuthUser } from '../auth/jwt.strategy';
import { Role } from '../identity/role';
import { WorkspaceAccessService } from '../workspace';
import { OrderService } from './order.service';

type RequestWithUser = { user: AuthUser };

/**
 * Authorized Order command/query API (US164).
 * It exposes propose and cancel only: Risk and Execution Engine lifecycle
 * transitions remain internal and cannot be bypassed by the HTTP adapter.
 */
@Controller({ path: 'orders', version: '1' })
export class OrdersController {
  constructor(
    private readonly orders: OrderService,
    private readonly commandAuthorization: CommandAuthorizationService,
    private readonly workspaceAccess: WorkspaceAccessService,
  ) {}

  @Post()
  @Roles(Role.Trader, Role.Admin)
  async create(
    @Req() request: RequestWithUser,
    @Headers('x-workspace-id') workspaceHeader: string | undefined,
    @Headers('idempotency-key') idempotencyHeader: string | undefined,
    @Headers('x-correlation-id') correlationId: string | undefined,
    @Body() body: CreateOrderBodyDto,
  ) {
    const context = this.authorizeCommand(
      request.user,
      requiredHeader(workspaceHeader, 'X-Workspace-Id'),
      requiredHeader(idempotencyHeader, 'Idempotency-Key'),
      correlationId,
    );
    const now = new Date().toISOString();
    try {
      return await this.orders.create({
        ...body,
        limitPrice: body.limitPrice ?? null,
        workspaceId: context.workspaceId,
        idempotencyKey: context.idempotencyKey!,
        mode: 'paper',
        origin: 'manual',
        actorId: context.actorId,
        correlationId: context.correlationId ?? undefined,
        occurredAt: now,
        recordedAt: now,
        eligibilityCheckedAt: now,
      });
    } catch (error) {
      throw new BadRequestException(message(error));
    }
  }

  @Post(':orderId/cancel')
  @Roles(Role.Trader, Role.Admin)
  async cancel(
    @Req() request: RequestWithUser,
    @Param('orderId') orderId: string,
    @Headers('x-workspace-id') workspaceHeader: string | undefined,
    @Headers('idempotency-key') idempotencyHeader: string | undefined,
    @Headers('x-correlation-id') correlationId: string | undefined,
  ) {
    const context = this.authorizeCommand(
      request.user,
      requiredHeader(workspaceHeader, 'X-Workspace-Id'),
      requiredHeader(idempotencyHeader, 'Idempotency-Key'),
      correlationId,
    );
    const now = new Date().toISOString();
    try {
      return await this.orders.cancel({
        workspaceId: context.workspaceId,
        orderId,
        idempotencyKey: context.idempotencyKey!,
        actorId: context.actorId,
        correlationId: context.correlationId ?? undefined,
        occurredAt: now,
        recordedAt: now,
      });
    } catch (error) {
      if (message(error) === 'order not found in workspace') throw new NotFoundException();
      throw new ConflictException(message(error));
    }
  }

  @Get()
  async list(
    @Req() request: RequestWithUser,
    @Headers('x-workspace-id') workspaceHeader: string | undefined,
  ) {
    const workspaceId = requiredHeader(workspaceHeader, 'X-Workspace-Id');
    this.authorizeQuery(request.user, workspaceId);
    return this.orders.list(workspaceId);
  }

  @Get(':orderId')
  async get(
    @Req() request: RequestWithUser,
    @Param('orderId') orderId: string,
    @Headers('x-workspace-id') workspaceHeader: string | undefined,
  ) {
    const workspaceId = requiredHeader(workspaceHeader, 'X-Workspace-Id');
    this.authorizeQuery(request.user, workspaceId);
    const order = await this.orders.get(workspaceId, orderId);
    if (!order) throw new NotFoundException();
    return order;
  }

  private authorizeCommand(
    user: AuthUser,
    workspaceId: string,
    idempotencyKey: string,
    correlationId: string | undefined,
  ) {
    try {
      return this.commandAuthorization.authorizeTradingCommand({
        user,
        workspaceId,
        idempotencyKey,
        correlationId,
      });
    } catch {
      throw new ForbiddenException('workspace or trading role denied');
    }
  }

  private authorizeQuery(user: AuthUser, workspaceId: string): void {
    try {
      this.workspaceAccess.assertMember(workspaceId, user.userId);
    } catch {
      throw new ForbiddenException('workspace access denied');
    }
  }
}

function requiredHeader(value: string | undefined, name: string): string {
  const normalized = value?.trim();
  if (!normalized) throw new BadRequestException(`${name} header is required`);
  return normalized;
}

function message(error: unknown): string {
  return error instanceof Error ? error.message : 'order command failed';
}
