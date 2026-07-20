import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { LiveTradingDomainEvent } from './live-trading-events';
import { LIVE_TRADING_REPOSITORY, type LiveTradingRepository } from './live-trading.repository';

/**
 * Publishes live trading domain events to durable LiveEvent storage (US210).
 */
@Injectable()
export class LiveEventPublisher {
  private readonly collected: LiveTradingDomainEvent[] = [];

  constructor(
    @Inject(LIVE_TRADING_REPOSITORY) private readonly repository: LiveTradingRepository,
  ) {}

  async publish(event: LiveTradingDomainEvent): Promise<void> {
    const frozen = Object.freeze({ ...event });
    this.collected.push(frozen);
    await this.repository.appendEvent(frozen, randomUUID());
  }

  getPublishedEvents(): readonly LiveTradingDomainEvent[] {
    return this.collected;
  }

  clearPublishedEvents(): void {
    this.collected.length = 0;
  }
}
