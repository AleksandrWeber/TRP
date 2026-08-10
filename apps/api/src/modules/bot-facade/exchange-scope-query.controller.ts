import {
  BadRequestException,
  Controller,
  ForbiddenException,
  Get,
  Headers,
  Req,
} from '@nestjs/common';
import type { AuthUser } from '../auth/jwt.strategy';
import {
  DEFAULT_BINANCE_EXCHANGE_SCOPE,
  DEFAULT_BINANCE_EXCHANGE_SCOPE_ID,
} from '../exchange-scope';
import { WorkspaceAccessService } from '../workspace';
import { BotFacadeService } from './bot-facade.service';

type RequestWithUser = { user: AuthUser };

export type ExchangeScopeOverviewView = Readonly<{
  id: string;
  exchangeCode: string;
  label: string;
  sessionCount: number;
  totalSessionCount: number;
}>;

/**
 * RC-20 Epic 2 — read-only default Exchange Scope overview.
 * Projects existing identity + Session counts. No policies or balances.
 */
@Controller({ path: 'exchange-scopes', version: '1' })
export class ExchangeScopeQueryController {
  constructor(
    private readonly bots: BotFacadeService,
    private readonly workspaceAccess: WorkspaceAccessService,
  ) {}

  @Get('default')
  async getDefault(
    @Req() request: RequestWithUser,
    @Headers('x-workspace-id') workspaceHeader: string | undefined,
  ): Promise<ExchangeScopeOverviewView> {
    const workspaceId = requiredHeader(workspaceHeader, 'X-Workspace-Id');
    this.authorizeQuery(request.user, workspaceId);
    const bots = await this.bots.listBots(workspaceId);
    const sessionCount = bots.filter(
      (bot) => bot.exchangeScopeId === DEFAULT_BINANCE_EXCHANGE_SCOPE_ID,
    ).length;

    return {
      id: DEFAULT_BINANCE_EXCHANGE_SCOPE.id,
      exchangeCode: DEFAULT_BINANCE_EXCHANGE_SCOPE.exchangeCode,
      label: DEFAULT_BINANCE_EXCHANGE_SCOPE.label,
      sessionCount,
      totalSessionCount: bots.length,
    };
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
