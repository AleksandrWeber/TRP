import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Headers,
  NotFoundException,
  Post,
  Req,
} from '@nestjs/common';
import { requireWorkspaceId } from '../../common/workspace/require-workspace';
import { ExecutePaperTradeBodyDto } from '../../validation';
import type { AuthUser } from '../auth/jwt.strategy';
import { WorkspaceAccessService, WorkspaceDomainService } from '../workspace';
import type { PaperPosition } from './domain/paper-position';
import type { TradeResult } from './domain/trade-result';
import { PaperTradingService } from './paper-trading.service';
import type { PortfolioSummary } from './pnl-calculator';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { PermissionClass } from '../auth/permission-catalog';

type RequestWithUser = { user: AuthUser };

/**
 * Manual Paper Trading API (US010).
 * Every endpoint is authenticated globally and scoped to the workspace owner.
 * No route schedules, polls, or automatically executes a signal.
 */
@Controller({ path: 'paper-trading', version: '1' })
@RequirePermission(PermissionClass.Projection)
export class PaperTradingController {
  constructor(
    private readonly paperTrading: PaperTradingService,
    private readonly workspaces: WorkspaceDomainService,
    private readonly workspaceAccess: WorkspaceAccessService,
  ) {}

  @RequirePermission(PermissionClass.PaperCommand)
  @Post('execute')
  async execute(
    @Req() request: RequestWithUser,
    @Body() body: ExecutePaperTradeBodyDto,
    @Headers('x-workspace-id') workspaceIdHeader?: string,
  ): Promise<TradeResult> {
    const workspaceId = this.authorize(request.user, workspaceIdHeader);
    const result = await this.paperTrading.execute(workspaceId, body.strategyId);
    if (!result) throw new NotFoundException('Strategy not found');
    return result;
  }

  @Get('positions')
  positions(
    @Req() request: RequestWithUser,
    @Headers('x-workspace-id') workspaceIdHeader?: string,
  ): ReadonlyArray<PaperPosition> {
    const workspaceId = this.authorize(request.user, workspaceIdHeader);
    return this.paperTrading.listPositions(workspaceId);
  }

  @Get('history')
  history(
    @Req() request: RequestWithUser,
    @Headers('x-workspace-id') workspaceIdHeader?: string,
  ): ReadonlyArray<TradeResult> {
    const workspaceId = this.authorize(request.user, workspaceIdHeader);
    return this.paperTrading.listHistory(workspaceId);
  }

  @Get('portfolio')
  portfolio(
    @Req() request: RequestWithUser,
    @Headers('x-workspace-id') workspaceIdHeader?: string,
  ): Promise<PortfolioSummary> {
    const workspaceId = this.authorize(request.user, workspaceIdHeader);
    return this.paperTrading.portfolio(workspaceId);
  }

  private authorize(user: AuthUser, workspaceIdHeader?: string): string {
    const workspaceId = requireWorkspaceId(workspaceIdHeader, this.workspaces);
    try {
      this.workspaceAccess.assertMember(workspaceId, user.userId);
    } catch {
      throw new ForbiddenException('workspace access denied');
    }
    return workspaceId;
  }
}
