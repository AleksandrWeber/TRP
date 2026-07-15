import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { WorkflowService } from './workflow.service';

@Controller('workflows')
export class WorkflowController {
  constructor(private readonly workflowService: WorkflowService) {}

  @Get()
  list() {
    return this.workflowService.list();
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.workflowService.get(id);
  }

  @Post()
  start(
    @Body()
    body: {
      type: string;
      datasetId?: string;
      approveNeedsReview?: boolean;
    },
  ) {
    return this.workflowService.start(body);
  }

  @Post(':id/cancel')
  cancel(@Param('id') id: string) {
    return this.workflowService.cancel(id);
  }
}
