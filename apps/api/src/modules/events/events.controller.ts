import { Controller, Get, Query } from '@nestjs/common';
import { ListEventsQueryDto } from '../../validation';
import { EventBus } from './event-bus.service';

@Controller({ path: 'events', version: '1' })
export class EventsController {
  constructor(private readonly eventBus: EventBus) {}

  @Get()
  list(@Query() query: ListEventsQueryDto) {
    return this.eventBus.listLogs(query.limit ?? 50);
  }
}
