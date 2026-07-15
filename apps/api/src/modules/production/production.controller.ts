import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ProductionService } from './production.service';

@Controller('production')
export class ProductionController {
  constructor(private readonly productionService: ProductionService) {}

  @Post('deployments')
  deploy(@Body() body: { experimentId: string; approve?: boolean }) {
    return this.productionService.deploy(body.experimentId, body.approve ?? false);
  }

  @Get('deployments')
  listDeployments() {
    return this.productionService.listDeployments();
  }

  @Get('deployments/:id')
  getDeployment(@Param('id') id: string) {
    return this.productionService.getDeployment(id);
  }

  @Post('deployments/:id/tick')
  tick(@Param('id') id: string) {
    return this.productionService.tick(id);
  }

  @Post('deployments/:id/stop')
  stop(@Param('id') id: string) {
    return this.productionService.stopDeployment(id);
  }

  @Get('executions')
  listExecutions(@Query('deploymentId') deploymentId?: string) {
    return this.productionService.listExecutions(deploymentId);
  }
}
