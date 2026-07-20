import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { ExchangeDomainEvent } from './exchange-adapter-events';
import {
  EXCHANGE_ADAPTER_REPOSITORY,
  type ExchangeAdapterRepository,
} from './exchange-adapter.repository';

/**
 * Publishes exchange adapter events to durable storage (US209).
 * Adapters emit events only — no Trading Core mutations.
 */
@Injectable()
export class ExchangeEventPublisher {
  private readonly collected: ExchangeDomainEvent[] = [];

  constructor(
    @Inject(EXCHANGE_ADAPTER_REPOSITORY)
    private readonly repository: ExchangeAdapterRepository,
  ) {}

  async publish(event: ExchangeDomainEvent): Promise<void> {
    const frozen = Object.freeze({ ...event });
    this.collected.push(frozen);
    await this.repository.appendEvent(frozen, randomUUID());
  }

  getPublishedEvents(): readonly ExchangeDomainEvent[] {
    return this.collected;
  }

  clearPublishedEvents(): void {
    this.collected.length = 0;
  }
}
