import { Body, Controller, Get, NotFoundException, Param, Patch, Post } from '@nestjs/common';
import { IdParamDto, ImportBinanceBodyDto, UpdateDatasetBodyDto } from '../../validation';
import type { MarketRegime } from './dataset-metadata';
import { DatasetsService } from './datasets.service';

@Controller({ path: 'datasets', version: '1' })
export class DatasetsController {
  constructor(private readonly datasetsService: DatasetsService) {}

  @Get()
  list() {
    return this.datasetsService.list();
  }

  @Post('import/binance')
  importFromBinance(@Body() body: ImportBinanceBodyDto = {}) {
    return this.datasetsService.importFromBinance({
      ...body,
      marketRegime: body.marketRegime as MarketRegime | undefined,
    });
  }

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
