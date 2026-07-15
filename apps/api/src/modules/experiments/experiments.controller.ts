import { Body, Controller, Get, Param, Post } from '@nestjs/common';
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
  run(@Body() body: { datasetId: string }) {
    return this.experimentsService.run(body.datasetId);
  }
}
