import { Body, Controller, Get, Headers, Param, Post, Query } from '@nestjs/common';
import { requireWorkspaceId } from '../../common/workspace/require-workspace';
import {
  IdParamDto,
  ListHistoricalResearchResultsQueryDto,
  RunHistoricalResearchBodyDto,
} from '../../validation';
import { WorkspaceDomainService } from '../workspace';
import { HistoricalResearchService } from './historical-research.service';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { PermissionClass } from '../auth/permission-catalog';

@Controller({ path: 'historical-research', version: '1' })
@RequirePermission(PermissionClass.Projection)
export class HistoricalResearchController {
  constructor(
    private readonly research: HistoricalResearchService,
    private readonly workspaces: WorkspaceDomainService,
  ) {}

  @RequirePermission(PermissionClass.Research)
  @Post('runs')
  run(
    @Body() body: RunHistoricalResearchBodyDto,
    @Headers('x-workspace-id') workspaceIdHeader?: string,
  ) {
    const workspaceId = requireWorkspaceId(workspaceIdHeader, this.workspaces);
    return this.research.run({
      workspaceId,
      datasetIds: body.datasetIds,
      allDatasets: body.allDatasets,
      strategyIds: body.strategyIds,
    });
  }

  @Get('runs')
  listRuns(@Headers('x-workspace-id') workspaceIdHeader?: string) {
    const workspaceId = requireWorkspaceId(workspaceIdHeader, this.workspaces);
    return this.research.listRuns(workspaceId);
  }

  @Get('results')
  listResults(
    @Query() query: ListHistoricalResearchResultsQueryDto,
    @Headers('x-workspace-id') workspaceIdHeader?: string,
  ) {
    const workspaceId = requireWorkspaceId(workspaceIdHeader, this.workspaces);
    return this.research.listResults(workspaceId, query);
  }

  @Get('runs/:id/report')
  getReport(@Param() params: IdParamDto, @Headers('x-workspace-id') workspaceIdHeader?: string) {
    const workspaceId = requireWorkspaceId(workspaceIdHeader, this.workspaces);
    return this.research.getReport(workspaceId, params.id);
  }

  @Get('runs/:id')
  getRun(@Param() params: IdParamDto, @Headers('x-workspace-id') workspaceIdHeader?: string) {
    const workspaceId = requireWorkspaceId(workspaceIdHeader, this.workspaces);
    return this.research.getRun(workspaceId, params.id);
  }
}
