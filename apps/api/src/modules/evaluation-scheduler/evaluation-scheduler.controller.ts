import { Body, Controller, Delete, Get, Headers, HttpCode, Param, Post } from '@nestjs/common';
import { requireWorkspaceId } from '../../common/workspace/require-workspace';
import { CreateEvaluationScheduleBodyDto, StrategyIdParamDto } from '../../validation';
import { WorkspaceDomainService } from '../workspace';
import type { EvaluationSchedule } from './domain/evaluation-schedule';
import { ScheduleNotFoundError } from './domain/evaluation-scheduler.error';
import { EvaluationSchedulerService } from './evaluation-scheduler.service';

/**
 * Evaluation Scheduler HTTP API (US015).
 * Registers / lists / removes periodic Signal Engine evaluations.
 * Workspace-scoped via X-Workspace-Id. Does not execute trades.
 */
@Controller({ path: 'evaluation-schedules', version: '1' })
export class EvaluationSchedulerController {
  constructor(
    private readonly scheduler: EvaluationSchedulerService,
    private readonly workspaces: WorkspaceDomainService,
  ) {}

  @Post()
  async create(
    @Body() body: CreateEvaluationScheduleBodyDto,
    @Headers('x-workspace-id') workspaceIdHeader?: string,
  ): Promise<EvaluationSchedule> {
    const workspaceId = requireWorkspaceId(workspaceIdHeader, this.workspaces);
    return this.scheduler.schedule(workspaceId, body.strategyId, body.intervalMs);
  }

  @Get()
  list(@Headers('x-workspace-id') workspaceIdHeader?: string): ReadonlyArray<EvaluationSchedule> {
    const workspaceId = requireWorkspaceId(workspaceIdHeader, this.workspaces);
    return this.scheduler.list(workspaceId);
  }

  @Get(':strategyId')
  get(
    @Param() params: StrategyIdParamDto,
    @Headers('x-workspace-id') workspaceIdHeader?: string,
  ): EvaluationSchedule {
    const workspaceId = requireWorkspaceId(workspaceIdHeader, this.workspaces);
    const schedule = this.scheduler.get(workspaceId, params.strategyId);
    if (!schedule) {
      throw new ScheduleNotFoundError(workspaceId, params.strategyId);
    }
    return schedule;
  }

  @Delete(':strategyId')
  @HttpCode(204)
  remove(
    @Param() params: StrategyIdParamDto,
    @Headers('x-workspace-id') workspaceIdHeader?: string,
  ): void {
    const workspaceId = requireWorkspaceId(workspaceIdHeader, this.workspaces);
    this.scheduler.unschedule(workspaceId, params.strategyId);
  }
}
