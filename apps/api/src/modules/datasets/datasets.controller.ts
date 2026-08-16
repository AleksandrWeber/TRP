import { Body, Controller, Get, NotFoundException, Param, Patch, Post } from '@nestjs/common';
import { IdParamDto, ImportBinanceBodyDto, UpdateDatasetBodyDto } from '../../validation';
import type { MarketRegime } from './dataset-metadata';
import { DatasetsService } from './datasets.service';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { PermissionClass } from '../auth/permission-catalog';

@Controller({ path: 'datasets', version: '1' })
@RequirePermission(PermissionClass.Projection)
export class DatasetsController {
  constructor(private readonly datasetsService: DatasetsService) {}

  @Get()
  list() {
    return this.datasetsService.list();
  }

  @RequirePermission(PermissionClass.Research)
  @Post('import/binance')
  importFromBinance(@Body() body: ImportBinanceBodyDto = {}) {
    return this.datasetsService.importFromBinance({
      ...body,
      marketRegime: body.marketRegime as MarketRegime | undefined,
    });
  }

  @RequirePermission(PermissionClass.Research)
  @Patch(':id')
  async update(@Param() params: IdParamDto, @Body() body: UpdateDatasetBodyDto) {
    const dataset = await this.datasetsService.update(params.id, {
      ...body,
      marketRegime: body.marketRegime as MarketRegime | undefined,
    });
    if (!dataset) throw new NotFoundException(`Dataset ${params.id} not found`);
    return dataset;
  }

  @Get(':id/bars/count')
  async barCount(@Param() params: IdParamDto) {
    const bars = await this.datasetsService.getBars(params.id);
    return { datasetId: params.id, barCount: bars.length };
  }
}
