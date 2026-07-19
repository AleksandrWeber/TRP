import { Body, Controller, Get, Headers, NotFoundException, Post } from '@nestjs/common';
import { requireWorkspaceId } from '../../common/workspace/require-workspace';
import { ExecutePaperTradeBodyDto } from '../../validation';
import { WorkspaceDomainService } from '../workspace';
import type { PaperPosition } from './domain/paper-position';
import type { TradeResult } from './domain/trade-result';
import { PaperTradingService } from './paper-trading.service';
import type { PortfolioSummary } from './pnl-calculator';

/**
 * Manual Paper Trading API (US010).
 * Every endpoint is authenticated globally and scoped by X-Workspace-Id.
 * No route schedules, polls, or automatically executes a signal.
 */
@Controller({ path: 'paper-trading', version: '1' })
export class PaperTradingController {
  constructor(
    private readonly paperTrading: PaperTradingService,
    private readonly workspaces: WorkspaceDomainService,
  ) {}

  @Post('execute')
  async execute(
    @Body() body: ExecutePaperTradeBodyDto,
    @Headers('x-workspace-id') workspaceIdHeader?: string,
  ): Promise<TradeResult> {
    const workspaceId = requireWorkspaceId(workspaceIdHeader, this.workspaces);
    const result = await this.paperTrading.execute(workspaceId, body.strategyId);
    if (!result) throw new NotFoundException('Strategy not found');
    return result;
  }

  @Get('positions')
  positions(@Headers('x-workspace-id') workspaceIdHeader?: string): ReadonlyArray<PaperPosition> {
    const workspaceId = requireWorkspaceId(workspaceIdHeader, this.workspaces);
    return this.paperTrading.listPositions(workspaceId);
  }

  @Get('history')
  history(@Headers('x-workspace-id') workspaceIdHeader?: string): ReadonlyArray<TradeResult> {
    const workspaceId = requireWorkspaceId(workspaceIdHeader, this.workspaces);
    return this.paperTrading.listHistory(workspaceId);
  }

  @Get('portfolio')
  portfolio(@Headers('x-workspace-id') workspaceIdHeader?: string): Promise<PortfolioSummary> {
    const workspaceId = requireWorkspaceId(workspaceIdHeader, this.workspaces);
    return this.paperTrading.portfolio(workspaceId);
  }
}
