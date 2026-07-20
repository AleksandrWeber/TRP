import { Body, Controller, Get, Headers, Param, Patch, Post } from '@nestjs/common';
import { requireWorkspaceId } from '../../common/workspace/require-workspace';
import { IdParamDto } from '../../validation';
import {
  StartAnalyticsBodyDto,
  StartEngineeringBodyDto,
  StartOptimizationBodyDto,
  StartResearchExecutionBodyDto,
  UpdateResearchControlSettingsBodyDto,
} from '../../validation/dto/research-control-center.dto';
import { WorkspaceDomainService } from '../workspace';
import { ResearchControlCenterService } from './research-control-center.service';

@Controller({ path: 'research-control', version: '1' })
export class ResearchControlCenterController {
  constructor(
    private readonly controlCenter: ResearchControlCenterService,
    private readonly workspaces: WorkspaceDomainService,
  ) {}

  @Get('dashboard')
  dashboard(@Headers('x-workspace-id') workspaceIdHeader?: string) {
    const workspaceId = requireWorkspaceId(workspaceIdHeader, this.workspaces);
    return this.controlCenter.getDashboard(workspaceId);
  }

  @Get('executions')
  listExecutions(@Headers('x-workspace-id') workspaceIdHeader?: string) {
    const workspaceId = requireWorkspaceId(workspaceIdHeader, this.workspaces);
    return this.controlCenter.listResearch(workspaceId);
  }

  @Get('executions/active')
  listActive(@Headers('x-workspace-id') workspaceIdHeader?: string) {
    const workspaceId = requireWorkspaceId(workspaceIdHeader, this.workspaces);
    return this.controlCenter.listActive(workspaceId);
  }

  @Get('executions/:id')
  getExecution(@Param() params: IdParamDto, @Headers('x-workspace-id') workspaceIdHeader?: string) {
    const workspaceId = requireWorkspaceId(workspaceIdHeader, this.workspaces);
    return this.controlCenter.getResearch(workspaceId, params.id);
  }

  @Post('executions')
  startExecution(
    @Body() body: StartResearchExecutionBodyDto,
    @Headers('x-workspace-id') workspaceIdHeader?: string,
  ) {
    const workspaceId = requireWorkspaceId(workspaceIdHeader, this.workspaces);
    return this.controlCenter.startResearch(workspaceId, body);
  }

  @Post('executions/:id/cancel')
  cancelExecution(
    @Param() params: IdParamDto,
    @Headers('x-workspace-id') workspaceIdHeader?: string,
  ) {
    const workspaceId = requireWorkspaceId(workspaceIdHeader, this.workspaces);
    return this.controlCenter.cancelResearch(workspaceId, params.id);
  }

  @Get('optimizations')
  listOptimizations(@Headers('x-workspace-id') workspaceIdHeader?: string) {
    const workspaceId = requireWorkspaceId(workspaceIdHeader, this.workspaces);
    return this.controlCenter.listOptimizations(workspaceId);
  }

  @Get('optimizations/:id')
  getOptimization(
    @Param() params: IdParamDto,
    @Headers('x-workspace-id') workspaceIdHeader?: string,
  ) {
    const workspaceId = requireWorkspaceId(workspaceIdHeader, this.workspaces);
    return this.controlCenter.getOptimization(workspaceId, params.id);
  }

  @Post('optimizations')
  startOptimization(
    @Body() body: StartOptimizationBodyDto,
    @Headers('x-workspace-id') workspaceIdHeader?: string,
  ) {
    const workspaceId = requireWorkspaceId(workspaceIdHeader, this.workspaces);
    return this.controlCenter.startOptimization(workspaceId, body);
  }

  @Get('analytics')
  listAnalytics(@Headers('x-workspace-id') workspaceIdHeader?: string) {
    const workspaceId = requireWorkspaceId(workspaceIdHeader, this.workspaces);
    return this.controlCenter.listAnalytics(workspaceId);
  }

  @Get('analytics/:id')
  getAnalytics(@Param() params: IdParamDto, @Headers('x-workspace-id') workspaceIdHeader?: string) {
    const workspaceId = requireWorkspaceId(workspaceIdHeader, this.workspaces);
    return this.controlCenter.getAnalytics(workspaceId, params.id);
  }

  @Post('analytics')
  startAnalytics(
    @Body() body: StartAnalyticsBodyDto,
    @Headers('x-workspace-id') workspaceIdHeader?: string,
  ) {
    const workspaceId = requireWorkspaceId(workspaceIdHeader, this.workspaces);
    return this.controlCenter.startAnalytics(workspaceId, body);
  }

  @Get('engineering')
  listEngineering(@Headers('x-workspace-id') workspaceIdHeader?: string) {
    const workspaceId = requireWorkspaceId(workspaceIdHeader, this.workspaces);
    return this.controlCenter.listEngineering(workspaceId);
  }

  @Get('engineering/:id')
  getEngineering(
    @Param() params: IdParamDto,
    @Headers('x-workspace-id') workspaceIdHeader?: string,
  ) {
    const workspaceId = requireWorkspaceId(workspaceIdHeader, this.workspaces);
    return this.controlCenter.getEngineering(workspaceId, params.id);
  }

  @Post('engineering')
  startEngineering(
    @Body() body: StartEngineeringBodyDto,
    @Headers('x-workspace-id') workspaceIdHeader?: string,
  ) {
    const workspaceId = requireWorkspaceId(workspaceIdHeader, this.workspaces);
    return this.controlCenter.startEngineering(workspaceId, body);
  }

  @Get('diagnostics')
  diagnostics(@Headers('x-workspace-id') workspaceIdHeader?: string) {
    const workspaceId = requireWorkspaceId(workspaceIdHeader, this.workspaces);
    return this.controlCenter.getDiagnostics(workspaceId);
  }

  @Get('settings')
  getSettings() {
    return this.controlCenter.getSettings();
  }

  @Patch('settings')
  updateSettings(@Body() body: UpdateResearchControlSettingsBodyDto) {
    return this.controlCenter.updateSettings(body);
  }
}
