import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  NotFoundException,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { requireWorkspaceId } from '../../common/workspace/require-workspace';
import { CreateStrategyBodyDto, IdParamDto, UpdateStrategyBodyDto } from '../../validation';
import { WorkspaceDomainService } from '../workspace';
import type {
  Strategy,
  StrategyDirection,
  StrategyParameters,
  StrategyTimeframe,
} from './strategy';
import { StrategyDomainService } from './strategy-domain.service';

export type StrategyView = {
  id: string;
  workspaceId: string;
  name: string;
  description: string;
  status: string;
  tradingPair: string;
  timeframe: StrategyTimeframe;
  direction: StrategyDirection;
  positionSize: number;
  stopLossPercent: number;
  takeProfitPercent: number;
  parameters: StrategyParameters;
  createdAt: string;
  updatedAt: string;
};

/**
 * Strategy HTTP API (US004/US005).
 * Full CRUD, always scoped by the validated `X-Workspace-Id` header.
 * A strategy owned by another workspace is a 404, never a leak.
 */
@Controller({ path: 'strategies', version: '1' })
export class StrategiesController {
  constructor(
    private readonly strategies: StrategyDomainService,
    private readonly workspaces: WorkspaceDomainService,
  ) {}

  @Get()
  async list(@Headers('x-workspace-id') workspaceIdHeader?: string): Promise<StrategyView[]> {
    const workspaceId = requireWorkspaceId(workspaceIdHeader, this.workspaces);
    const strategies = await this.strategies.listByWorkspace(workspaceId);
    return strategies.map(toView);
  }

  @Get(':id')
  async get(
    @Param() params: IdParamDto,
    @Headers('x-workspace-id') workspaceIdHeader?: string,
  ): Promise<StrategyView> {
    const workspaceId = requireWorkspaceId(workspaceIdHeader, this.workspaces);
    const strategy = await this.strategies.getById(workspaceId, params.id);
    if (!strategy) throw new NotFoundException('Strategy not found');
    return toView(strategy);
  }

  @Post()
  async create(
    @Body() body: CreateStrategyBodyDto,
    @Headers('x-workspace-id') workspaceIdHeader?: string,
  ): Promise<StrategyView> {
    const workspaceId = requireWorkspaceId(workspaceIdHeader, this.workspaces);
    const strategy = await this.strategies.create({
      workspaceId,
      name: body.name,
      tradingPair: body.tradingPair,
      timeframe: body.timeframe,
      direction: body.direction,
      description: body.description,
      status: body.status,
      positionSize: body.positionSize,
      stopLossPercent: body.stopLossPercent,
      takeProfitPercent: body.takeProfitPercent,
      parameters: body.parameters,
    });
    return toView(strategy);
  }

  @Patch(':id')
  async update(
    @Param() params: IdParamDto,
    @Body() body: UpdateStrategyBodyDto,
    @Headers('x-workspace-id') workspaceIdHeader?: string,
  ): Promise<StrategyView> {
    const workspaceId = requireWorkspaceId(workspaceIdHeader, this.workspaces);
    const strategy = await this.strategies.update(workspaceId, params.id, {
      name: body.name,
      tradingPair: body.tradingPair,
      timeframe: body.timeframe,
      direction: body.direction,
      description: body.description,
      status: body.status,
      positionSize: body.positionSize,
      stopLossPercent: body.stopLossPercent,
      takeProfitPercent: body.takeProfitPercent,
      parameters: body.parameters,
    });
    if (!strategy) throw new NotFoundException('Strategy not found');
    return toView(strategy);
  }

  @Delete(':id')
  async remove(
    @Param() params: IdParamDto,
    @Headers('x-workspace-id') workspaceIdHeader?: string,
  ): Promise<{ id: string; deleted: boolean }> {
    const workspaceId = requireWorkspaceId(workspaceIdHeader, this.workspaces);
    const deleted = await this.strategies.delete(workspaceId, params.id);
    if (!deleted) throw new NotFoundException('Strategy not found');
    return { id: params.id, deleted: true };
  }
}

function toView(strategy: Strategy): StrategyView {
  return {
    id: strategy.id,
    workspaceId: strategy.workspaceId,
    name: strategy.name,
    description: strategy.description,
    status: strategy.status,
    tradingPair: strategy.tradingPair,
    timeframe: strategy.timeframe,
    direction: strategy.direction,
    positionSize: strategy.positionSize,
    stopLossPercent: strategy.stopLossPercent,
    takeProfitPercent: strategy.takeProfitPercent,
    parameters: strategy.parameters,
    createdAt: strategy.createdAt,
    updatedAt: strategy.updatedAt,
  };
}
