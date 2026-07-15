import { Global, Module } from '@nestjs/common';
import { EventBus } from './event-bus.service';
import { EventsController } from './events.controller';

@Global()
@Module({
  controllers: [EventsController],
  providers: [EventBus],
  exports: [EventBus],
})
export class EventsModule {}
