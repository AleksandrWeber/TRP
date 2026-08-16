import { Controller, Get, Query } from '@nestjs/common';
import { ListEventsQueryDto } from '../../validation';
import { EventBus } from './event-bus.service';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { PermissionClass } from '../auth/permission-catalog';

@Controller({ path: 'events', version: '1' })
@RequirePermission(PermissionClass.Projection)
export class EventsController {
  constructor(private readonly eventBus: EventBus) {}

  @Get()
  list(@Query() query: ListEventsQueryDto) {
    return this.eventBus.listLogs(query.limit ?? 50);
  }
}
