import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { IdParamDto, RunExperimentBodyDto } from '../../validation';
import { ExperimentsService } from './experiments.service';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { PermissionClass } from '../auth/permission-catalog';

@Controller({ path: 'experiments', version: '1' })
@RequirePermission(PermissionClass.Projection)
export class ExperimentsController {
  constructor(private readonly experimentsService: ExperimentsService) {}

  @Get()
  list() {
    return this.experimentsService.list();
  }

  @Get(':id')
  get(@Param() params: IdParamDto) {
    return this.experimentsService.get(params.id);
  }

  @RequirePermission(PermissionClass.Research)
  @Post()
  run(@Body() body: RunExperimentBodyDto) {
    return this.experimentsService.run(body.datasetId, body.strategyId, body.params);
  }
}
