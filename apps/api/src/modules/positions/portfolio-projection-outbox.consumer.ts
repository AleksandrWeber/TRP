import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { OutboxDispatcher, type DurableEventEnvelope } from '../event-processing';
import { PortfolioProjectionService } from './portfolio-projection.service';

@Injectable()
export class PortfolioProjectionOutboxConsumer implements OnModuleInit {
  constructor(
    @Inject(OutboxDispatcher)
    private readonly dispatcher: OutboxDispatcher,
    @Inject(PortfolioProjectionService)
    private readonly portfolios: PortfolioProjectionService,
  ) {}

  onModuleInit(): void {
    this.dispatcher.register({
      consumerId: 'm2-portfolio-projection-runtime',
      handle: (event) => this.handle(event),
    });
  }

  async handle(event: DurableEventEnvelope): Promise<void> {
    if (
      event.eventType !== 'LedgerTransactionPosted' &&
      event.eventType !== 'PositionValuationUpdated'
    ) {
      return;
    }
    const paperAccountId = text(event.payload.paperAccountId);
    await this.portfolios.refresh(event.workspaceId, paperAccountId, new Date().toISOString());
  }
}

function text(value: unknown): string {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error('Portfolio projection event paperAccountId is required');
  }
  return value;
}
