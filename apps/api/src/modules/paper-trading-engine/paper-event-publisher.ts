import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { PaperTradingDomainEvent } from './paper-trading-events';
import { PAPER_TRADING_REPOSITORY, type PaperTradingRepository } from './paper-trading.repository';

/**
 * Publishes paper trading domain events to durable PaperEvent storage (US208).
 */
@Injectable()
export class PaperEventPublisher {
  private readonly collected: PaperTradingDomainEvent[] = [];

  constructor(
    @Inject(PAPER_TRADING_REPOSITORY) private readonly repository: PaperTradingRepository,
  ) {}

  async publish(event: PaperTradingDomainEvent): Promise<void> {
    const frozen = Object.freeze({ ...event });
    this.collected.push(frozen);
    await this.repository.appendEvent(frozen, randomUUID());
  }

  getPublishedEvents(): readonly PaperTradingDomainEvent[] {
    return this.collected;
  }

  clearPublishedEvents(): void {
    this.collected.length = 0;
  }
}
