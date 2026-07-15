import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { DatasetsService } from './datasets.service';

@Controller('datasets')
export class DatasetsController {
  constructor(private readonly datasetsService: DatasetsService) {}

  @Get()
  list() {
    return this.datasetsService.list();
  }

  @Post('import/binance')
  importFromBinance(@Body() body: { symbol?: string; timeframe?: string; limit?: number } = {}) {
    return this.datasetsService.importFromBinance(body.symbol, body.timeframe, body.limit);
  }

  @Get(':id/bars/count')
  async barCount(@Param('id') id: string) {
    const bars = await this.datasetsService.getBars(id);
    return { datasetId: id, barCount: bars.length };
  }
}
