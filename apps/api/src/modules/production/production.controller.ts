import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { DeployBodyDto, IdParamDto, ListExecutionsQueryDto } from '../../validation';
import { ProductionService } from './production.service';

@Controller({ path: 'production', version: '1' })
export class ProductionController {
  constructor(private readonly productionService: ProductionService) {}

  @Post('deployments')
  deploy(@Body() body: DeployBodyDto) {
    return this.productionService.deploy(body.experimentId, body.approve ?? false);
  }

  @Get('deployments')
  listDeployments() {
    return this.productionService.listDeployments();
  }

  @Get('deployments/:id')
  getDeployment(@Param() params: IdParamDto) {
    return this.productionService.getDeployment(params.id);
  }

  @Post('deployments/:id/tick')
  tick(@Param() params: IdParamDto) {
    return this.productionService.tick(params.id);
  }

  @Post('deployments/:id/stop')
  stop(@Param() params: IdParamDto) {
    return this.productionService.stopDeployment(params.id);
  }

  @Get('executions')
  listExecutions(@Query() query: ListExecutionsQueryDto) {
    return this.productionService.listExecutions(query.deploymentId);
  }
}
