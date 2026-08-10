import {
  BadRequestException,
  Controller,
  ForbiddenException,
  Get,
  Headers,
  NotFoundException,
  Param,
  Req,
} from '@nestjs/common';
import type { AuthUser } from '../auth/jwt.strategy';
import { WorkspaceAccessService } from '../workspace';
import { BotFacadeService } from './bot-facade.service';
import type { BotView } from './domain/bot-view';

type RequestWithUser = { user: AuthUser };

/**
 * RC-20 Epic 2 — read-only Trading Session / Bot Facade projections.
 * Canonical path `trading-sessions`. No lifecycle mutations.
 */
@Controller({ path: 'trading-sessions', version: '1' })
export class TradingSessionQueryController {
  constructor(
    private readonly bots: BotFacadeService,
    private readonly workspaceAccess: WorkspaceAccessService,
  ) {}

  @Get()
  async list(
    @Req() request: RequestWithUser,
    @Headers('x-workspace-id') workspaceHeader: string | undefined,
  ): Promise<readonly BotView[]> {
    const workspaceId = requiredHeader(workspaceHeader, 'X-Workspace-Id');
    this.authorizeQuery(request.user, workspaceId);
    return this.bots.listBots(workspaceId);
  }

  @Get(':id')
  async get(
    @Req() request: RequestWithUser,
    @Param('id') id: string,
    @Headers('x-workspace-id') workspaceHeader: string | undefined,
  ): Promise<BotView> {
    const workspaceId = requiredHeader(workspaceHeader, 'X-Workspace-Id');
    this.authorizeQuery(request.user, workspaceId);
    const bot = await this.bots.getBot(workspaceId, id);
    if (!bot) throw new NotFoundException('Trading session not found');
    return bot;
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
  if (!normalized) {
    throw new BadRequestException(`${name} header is required`);
  }
  return normalized;
}
