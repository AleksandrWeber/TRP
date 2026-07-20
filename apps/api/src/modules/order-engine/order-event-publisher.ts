import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { OrderDomainEvent } from './order-events';
import { ORDER_REPOSITORY, type OrderRepository } from './order.repository';

/**
 * Publishes order domain events to durable OrderEvent storage (US206).
 */
@Injectable()
export class OrderEventPublisher {
  private readonly collected: OrderDomainEvent[] = [];

  constructor(@Inject(ORDER_REPOSITORY) private readonly repository: OrderRepository) {}

  async publish(event: OrderDomainEvent): Promise<void> {
    const frozen = Object.freeze({ ...event });
    this.collected.push(frozen);
    await this.repository.appendEvent(frozen, randomUUID());
  }

  /** In-memory events for unit/integration assertions. */
  getPublishedEvents(): readonly OrderDomainEvent[] {
    return this.collected;
  }

  clearPublishedEvents(): void {
    this.collected.length = 0;
  }
}
