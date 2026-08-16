import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { IdParamDto, StartWorkflowBodyDto } from '../../validation';
import { WorkflowService } from './workflow.service';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { PermissionClass } from '../auth/permission-catalog';

@Controller({ path: 'workflows', version: '1' })
@RequirePermission(PermissionClass.Projection)
export class WorkflowController {
  constructor(private readonly workflowService: WorkflowService) {}

  @Get()
  list() {
    return this.workflowService.list();
  }

  @Get(':id')
  get(@Param() params: IdParamDto) {
    return this.workflowService.get(params.id);
  }

  @RequirePermission(PermissionClass.Research)
  @Post()
  start(@Body() body: StartWorkflowBodyDto) {
    return this.workflowService.start(body);
  }

  @RequirePermission(PermissionClass.Research)
  @Post(':id/cancel')
  cancel(@Param() params: IdParamDto) {
    return this.workflowService.cancel(params.id);
  }
}
