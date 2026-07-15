import { Controller, Get, Query } from '@nestjs/common';
import { EventBus } from './event-bus.service';

@Controller('events')
export class EventsController {
  constructor(private readonly eventBus: EventBus) {}

  @Get()
  list(@Query('limit') limit?: string) {
    return this.eventBus.listLogs(limit ? Number(limit) : 50);
  }
}
