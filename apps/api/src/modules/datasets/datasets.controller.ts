import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { DatasetsService, type BinanceImportInput } from './datasets.service';

@Controller('datasets')
export class DatasetsController {
  constructor(private readonly datasetsService: DatasetsService) {}

  @Get()
  list() {
    return this.datasetsService.list();
  }

  @Post('import/binance')
  importFromBinance(@Body() body: BinanceImportInput = {}) {
    return this.datasetsService.importFromBinance(body);
  }

  @Get(':id/bars/count')
  async barCount(@Param('id') id: string) {
    const bars = await this.datasetsService.getBars(id);
    return { datasetId: id, barCount: bars.length };
  }
}
