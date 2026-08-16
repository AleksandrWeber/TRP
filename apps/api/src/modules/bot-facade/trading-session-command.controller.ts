import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  ForbiddenException,
  Headers,
  HttpException,
  HttpStatus,
  NotFoundException,
  Optional,
  Param,
  Post,
  Req,
  UnprocessableEntityException,
} from '@nestjs/common';
import { CreateTradingSessionBodyDto } from '../../validation/dto/trading-session.dto';
import { CommandAuthorizationService } from '../auth/command-authorization.service';
import { Roles } from '../auth/decorators/roles.decorator';
import type { AuthUser } from '../auth/jwt.strategy';
import { Role } from '../identity/role';
import { SessionHandoffConsumerService } from '../product-flow';
import { isDeploymentAuthorizationRefusedError } from '../trading-session/domain/deployment-authorization-refused.error';
import { BotFacadeService } from './bot-facade.service';
import { assertBotIsSessionFacade, toBotView, type BotView } from './domain/bot-view';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { PermissionClass } from '../auth/permission-catalog';

type RequestWithUser = { user: AuthUser };

type LifecycleAction = 'pause' | 'resume' | 'stop';

/**
 * RC-20 Epic 3 / PC-13 — thin command adapters for Create / Start / Pause / Resume / Stop.
 * PC-15 15-a: create may consume SessionHandoffIntent via product-flow, then delegates
 * to TradingSessionService. No business logic here. Orchestrator still does not create Sessions.
 */
@Controller({ path: 'trading-sessions', version: '1' })
@RequirePermission(PermissionClass.PaperCommand)
export class TradingSessionCommandController {
  constructor(
    private readonly bots: BotFacadeService,
    private readonly commandAuthorization: CommandAuthorizationService,
    @Optional() private readonly sessionHandoffConsumer?: SessionHandoffConsumerService,
  ) {}

  @Post()
  @Roles(Role.Trader, Role.Admin)
  async create(
    @Req() request: RequestWithUser,
    @Headers('x-workspace-id') workspaceHeader: string | undefined,
    @Headers('x-idempotency-key') idempotencyHeader: string | undefined,
    @Headers('x-correlation-id') correlationId: string | undefined,
    @Body() body: CreateTradingSessionBodyDto,
  ): Promise<BotView> {
    const workspaceId = requiredHeader(workspaceHeader, 'X-Workspace-Id');
    const context = authorizeCommand(
      this.commandAuthorization,
      request.user,
      workspaceId,
      correlationId,
    );
    const now = new Date().toISOString();
    const idempotencyKey =
      body.idempotencyKey?.trim() ||
      idempotencyHeader?.trim() ||
      `trading-session:${context.actorId}:${body.deploymentId}:${now}`;
    try {
      if (this.sessionHandoffConsumer) {
        const session = await this.sessionHandoffConsumer.consumeOrCreate({
          workspaceId: context.workspaceId,
          paperAccountId: body.paperAccountId,
          deploymentId: body.deploymentId,
          origin: 'strategy',
          idempotencyKey,
          actorId: context.actorId,
          correlationId: context.correlationId ?? undefined,
          createdAt: now,
          recordedAt: now,
          ...(body.sessionHandoffIntentId?.trim()
            ? { sessionHandoffIntentId: body.sessionHandoffIntentId.trim() }
            : {}),
        });
        const bot = toBotView(session);
        assertBotIsSessionFacade(bot);
        return bot;
      }
      return await this.bots.createBot({
        workspaceId: context.workspaceId,
        paperAccountId: body.paperAccountId,
        deploymentId: body.deploymentId,
        origin: 'strategy',
        idempotencyKey,
        actorId: context.actorId,
        correlationId: context.correlationId ?? undefined,
        createdAt: now,
        recordedAt: now,
      });
    } catch (error) {
      throw mapCreateError(error);
    }
  }

  @Post(':id/start')
  @Roles(Role.Trader, Role.Admin)
  async start(
    @Req() request: RequestWithUser,
    @Param('id') id: string,
    @Headers('x-workspace-id') workspaceHeader: string | undefined,
    @Headers('x-correlation-id') correlationId?: string,
  ): Promise<BotView> {
    const workspaceId = requiredHeader(workspaceHeader, 'X-Workspace-Id');
    const context = authorizeCommand(
      this.commandAuthorization,
      request.user,
      workspaceId,
      correlationId,
    );
    const current = await this.bots.getBot(context.workspaceId, id);
    if (!current) {
      throw new NotFoundException('Trading session not found');
    }
    const now = new Date().toISOString();
    try {
      return await this.bots.startBot({
        workspaceId: context.workspaceId,
        botId: id,
        actorId: context.actorId,
        ownerId: context.actorId,
        correlationId: context.correlationId ?? undefined,
        recordedAt: now,
        nowIso: now,
      });
    } catch (error) {
      throw mapLifecycleError(error);
    }
  }

  @Post(':id/pause')
  @Roles(Role.Trader, Role.Admin)
  async pause(
    @Req() request: RequestWithUser,
    @Param('id') id: string,
    @Headers('x-workspace-id') workspaceHeader: string | undefined,
    @Headers('x-correlation-id') correlationId?: string,
  ): Promise<BotView> {
    return this.runLifecycle('pause', request.user, id, workspaceHeader, correlationId);
  }

  @Post(':id/resume')
  @Roles(Role.Trader, Role.Admin)
  async resume(
    @Req() request: RequestWithUser,
    @Param('id') id: string,
    @Headers('x-workspace-id') workspaceHeader: string | undefined,
    @Headers('x-correlation-id') correlationId?: string,
  ): Promise<BotView> {
    return this.runLifecycle('resume', request.user, id, workspaceHeader, correlationId);
  }

  @Post(':id/stop')
  @Roles(Role.Trader, Role.Admin)
  async stop(
    @Req() request: RequestWithUser,
    @Param('id') id: string,
    @Headers('x-workspace-id') workspaceHeader: string | undefined,
    @Headers('x-correlation-id') correlationId?: string,
  ): Promise<BotView> {
    return this.runLifecycle('stop', request.user, id, workspaceHeader, correlationId);
  }

  private async runLifecycle(
    action: LifecycleAction,
    user: AuthUser,
    botId: string,
    workspaceHeader: string | undefined,
    correlationId: string | undefined,
  ): Promise<BotView> {
    const workspaceId = requiredHeader(workspaceHeader, 'X-Workspace-Id');
    let context;
    try {
      context = this.commandAuthorization.authorizeTradingCommand({
        user,
        workspaceId,
        correlationId,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'permission denied';
      if (message.includes('Trader') || message.includes('Administrator')) {
        throw new ForbiddenException('Permission denied');
      }
      throw new ForbiddenException('workspace access denied');
    }

    const current = await this.bots.getBot(context.workspaceId, botId);
    if (!current) {
      throw new NotFoundException('Trading session not found');
    }
    if (current.leaseOwnerId === null || current.fencingToken === null) {
      throw new ConflictException('Session lease unavailable');
    }

    const now = new Date().toISOString();
    const command = {
      workspaceId: context.workspaceId,
      botId,
      actorId: context.actorId,
      ownerId: current.leaseOwnerId,
      fencingToken: current.fencingToken,
      correlationId: context.correlationId ?? undefined,
      recordedAt: now,
      nowIso: now,
    };

    try {
      if (action === 'pause') return await this.bots.pauseBot(command);
      if (action === 'resume') return await this.bots.resumeBot(command);
      return await this.bots.stopBot(command);
    } catch (error) {
      throw mapLifecycleError(error);
    }
  }
}

function authorizeCommand(
  commandAuthorization: CommandAuthorizationService,
  user: AuthUser,
  workspaceId: string,
  correlationId: string | undefined,
) {
  try {
    return commandAuthorization.authorizeTradingCommand({
      user,
      workspaceId,
      correlationId,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'permission denied';
    if (message.includes('Trader') || message.includes('Administrator')) {
      throw new ForbiddenException('Permission denied');
    }
    throw new ForbiddenException('workspace access denied');
  }
}

function requiredHeader(value: string | undefined, name: string): string {
  const normalized = value?.trim();
  if (!normalized) {
    throw new BadRequestException(`${name} header is required`);
  }
  return normalized;
}

function mapCreateError(error: unknown): HttpException {
  const text = error instanceof Error ? error.message : 'trading session create failed';
  if (text === 'paper account not found in workspace') {
    return new NotFoundException('Paper account not found');
  }
  if (text === 'strategy deployment not found in workspace') {
    return new NotFoundException('Strategy deployment not found');
  }
  if (text.includes('approved strategy deployment')) {
    return new UnprocessableEntityException(text);
  }
  if (text.includes('idempotency key reused')) {
    return new ConflictException(text);
  }
  if (text === 'session handoff intent not found in workspace') {
    return new NotFoundException('Session handoff intent not found');
  }
  if (text.includes('deployment bind does not match')) {
    return new UnprocessableEntityException(text);
  }
  if (text.includes('must not create a Session') || text.includes('not an Order or Risk')) {
    return new UnprocessableEntityException(text);
  }
  return new BadRequestException(text);
}

function mapLifecycleError(error: unknown): HttpException {
  if (isDeploymentAuthorizationRefusedError(error)) {
    return new UnprocessableEntityException({
      message: error.message,
      reasons: error.reasons,
      deploymentId: error.deploymentId,
    });
  }
  const text = error instanceof Error ? error.message : 'lifecycle command failed';
  if (text === 'trading session not found in workspace') {
    return new NotFoundException('Trading session not found');
  }
  if (
    text.startsWith('invalid trading session transition') ||
    text.includes('fencing token') ||
    text.includes('lease owner')
  ) {
    return new ConflictException(text);
  }
  return new HttpException(text, HttpStatus.BAD_REQUEST);
}
