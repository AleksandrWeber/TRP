import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { IdParamDto, ImportBinanceBodyDto } from '../../validation';
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
    return this.datasetsService.importFromBinance(body);
  }

  @Get(':id/bars/count')
  async barCount(@Param() params: IdParamDto) {
    const bars = await this.datasetsService.getBars(params.id);
    return { datasetId: params.id, barCount: bars.length };
  }
}
