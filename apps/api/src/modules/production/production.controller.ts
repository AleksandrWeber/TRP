import { Controller, Get, Param, Query } from '@nestjs/common';
import { IdParamDto, ListExecutionsQueryDto } from '../../validation';
import { ProductionService } from './production.service';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { PermissionClass } from '../auth/permission-catalog';

@Controller({ path: 'production', version: '1' })
@RequirePermission(PermissionClass.Projection)
export class ProductionController {
  constructor(private readonly productionService: ProductionService) {}

  @Get('deployments')
  listDeployments() {
    return this.productionService.listDeployments();
  }

  @Get('deployments/:id')
  getDeployment(@Param() params: IdParamDto) {
    return this.productionService.getDeployment(params.id);
  }

  @Get('executions')
  listExecutions(@Query() query: ListExecutionsQueryDto) {
    return this.productionService.listExecutions(query.deploymentId);
  }
}
