import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { OutboxDispatcher, type DurableEventEnvelope } from '../event-processing';
import { FinancialDecimal } from '../financial';
import { PositionValuationService } from './position-valuation.service';

/** Runtime adapter from canonical M1 mark events into the decimal US175 boundary. */
@Injectable()
export class PositionValuationOutboxConsumer implements OnModuleInit {
  constructor(
    @Inject(OutboxDispatcher)
    private readonly dispatcher: OutboxDispatcher,
    @Inject(PositionValuationService)
    private readonly valuations: PositionValuationService,
  ) {}

  onModuleInit(): void {
    this.dispatcher.register({
      consumerId: 'm2-position-valuation-runtime',
      handle: (event) => this.handle(event),
    });
  }

  async handle(event: DurableEventEnvelope): Promise<void> {
    if (event.eventType !== 'MarketMarkPrice' || event.aggregateType !== 'MarketStream') return;
    await this.valuations.applyMark({
      workspaceId: event.workspaceId,
      instrument: requiredText(event.payload.instrument, 'instrument'),
      marketStreamId: event.aggregateId,
      marketEventId: event.eventId,
      marketSequence: event.aggregateVersion,
      markPrice: decimalText(event.payload.price),
      occurredAt: event.occurredAt,
      recordedAt: new Date().toISOString(),
    });
  }
}

function requiredText(value: unknown, label: string): string {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`mark price ${label} is required`);
  }
  return value;
}

function decimalText(value: unknown): string {
  if (typeof value !== 'string' && typeof value !== 'number') {
    throw new Error('mark price must be a canonical numeric value');
  }
  return FinancialDecimal.from(String(value)).assertPositive('mark price').toString();
}
