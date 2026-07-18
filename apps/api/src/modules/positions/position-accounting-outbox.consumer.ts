import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { OutboxDispatcher, type DurableEventEnvelope } from '../event-processing';
import { PositionAccountingConsumer } from './position-accounting.consumer';

/**
 * Runtime binding for US174. Non-Fill events are successful no-ops; immutable
 * Fill events are delegated to the atomic accounting consumer.
 */
@Injectable()
export class PositionAccountingOutboxConsumer implements OnModuleInit {
  constructor(
    @Inject(OutboxDispatcher)
    private readonly dispatcher: OutboxDispatcher,
    @Inject(PositionAccountingConsumer)
    private readonly accounting: PositionAccountingConsumer,
  ) {}

  onModuleInit(): void {
    this.dispatcher.register({
      consumerId: 'm2-position-accounting-runtime',
      handle: (event) => this.handle(event),
    });
  }

  async handle(event: DurableEventEnvelope): Promise<void> {
    if (event.eventType !== 'OrderFillRecorded' || event.aggregateType !== 'Fill') return;
    await this.accounting.process(event, new Date().toISOString());
  }
}
