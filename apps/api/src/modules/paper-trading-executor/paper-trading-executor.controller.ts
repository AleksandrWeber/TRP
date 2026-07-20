import { Controller, Get, Headers, Param, Query } from '@nestjs/common';
import { requireWorkspaceId } from '../../common/workspace/require-workspace';
import { ListExecutorTradesQueryDto, StrategyIdParamDto } from '../../validation';
import { WorkspaceDomainService } from '../workspace';
import type { ExecutedTrade } from './domain/executed-trade';
import type { StrategyPortfolio } from './domain/strategy-portfolio';
import { PaperTradingExecutorService } from './paper-trading-executor.service';

/**
 * Paper Trading Executor read API (US016).
 * Execution is driven exclusively by the Evaluation Scheduler subscription —
 * no endpoint triggers a trade. Workspace-scoped via X-Workspace-Id.
 */
@Controller({ path: 'paper-executor', version: '1' })
export class PaperTradingExecutorController {
  constructor(
    private readonly executor: PaperTradingExecutorService,
    private readonly workspaces: WorkspaceDomainService,
  ) {}

  @Get('portfolios')
  portfolios(
    @Headers('x-workspace-id') workspaceIdHeader?: string,
  ): Promise<ReadonlyArray<StrategyPortfolio>> {
    const workspaceId = requireWorkspaceId(workspaceIdHeader, this.workspaces);
    return this.executor.listPortfolios(workspaceId);
  }

  @Get('portfolios/:strategyId')
  portfolio(
    @Param() params: StrategyIdParamDto,
    @Headers('x-workspace-id') workspaceIdHeader?: string,
  ): Promise<StrategyPortfolio> {
    const workspaceId = requireWorkspaceId(workspaceIdHeader, this.workspaces);
    return this.executor.getPortfolio(workspaceId, params.strategyId);
  }

  @Get('trades')
  trades(
    @Query() query: ListExecutorTradesQueryDto,
    @Headers('x-workspace-id') workspaceIdHeader?: string,
  ): ReadonlyArray<ExecutedTrade> {
    const workspaceId = requireWorkspaceId(workspaceIdHeader, this.workspaces);
    return this.executor.listTrades(workspaceId, query.strategyId);
  }
}
