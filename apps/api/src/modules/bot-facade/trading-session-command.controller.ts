import {
  BadRequestException,
  ConflictException,
  Controller,
  ForbiddenException,
  Headers,
  HttpException,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  Req,
} from '@nestjs/common';
import { CommandAuthorizationService } from '../auth/command-authorization.service';
import { Roles } from '../auth/decorators/roles.decorator';
import type { AuthUser } from '../auth/jwt.strategy';
import { Role } from '../identity/role';
import { BotFacadeService } from './bot-facade.service';
import type { BotView } from './domain/bot-view';

type RequestWithUser = { user: AuthUser };

type LifecycleAction = 'pause' | 'resume' | 'stop';

/**
 * RC-20 Epic 3 — thin command adapters for Pause / Resume / Stop.
 * Delegates to BotFacade → TradingSessionService. No business logic here.
 */
@Controller({ path: 'trading-sessions', version: '1' })
export class TradingSessionCommandController {
  constructor(
    private readonly bots: BotFacadeService,
    private readonly commandAuthorization: CommandAuthorizationService,
  ) {}

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

function requiredHeader(value: string | undefined, name: string): string {
  const normalized = value?.trim();
  if (!normalized) {
    throw new BadRequestException(`${name} header is required`);
  }
  return normalized;
}

function mapLifecycleError(error: unknown): HttpException {
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
