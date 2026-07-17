import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { IdParamDto, StartWorkflowBodyDto } from '../../validation';
import { WorkflowService } from './workflow.service';

@Controller({ path: 'workflows', version: '1' })
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

  @Post()
  start(@Body() body: StartWorkflowBodyDto) {
    return this.workflowService.start(body);
  }

  @Post(':id/cancel')
  cancel(@Param() params: IdParamDto) {
    return this.workflowService.cancel(params.id);
  }
}
