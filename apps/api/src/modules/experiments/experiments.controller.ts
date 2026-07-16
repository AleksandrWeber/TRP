import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import type { StrategyParams } from '@trp/research';
import { ExperimentsService } from './experiments.service';

@Controller('experiments')
export class ExperimentsController {
  constructor(private readonly experimentsService: ExperimentsService) {}

  @Get()
  list() {
    return this.experimentsService.list();
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.experimentsService.get(id);
  }

  @Post()
  run(@Body() body: { datasetId: string; strategyId?: string; params?: StrategyParams }) {
    return this.experimentsService.run(body.datasetId, body.strategyId, body.params);
  }
}
