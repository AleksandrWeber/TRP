import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { PositionDomainEvent } from './position-events';
import { POSITION_REPOSITORY, type PositionRepository } from './position.repository';

/**
 * Publishes position domain events to durable PositionEvent storage (US205).
 */
@Injectable()
export class PositionEventPublisher {
  private readonly collected: PositionDomainEvent[] = [];

  constructor(@Inject(POSITION_REPOSITORY) private readonly repository: PositionRepository) {}

  async publish(event: PositionDomainEvent): Promise<void> {
    const frozen = Object.freeze({ ...event });
    this.collected.push(frozen);
    await this.repository.appendEvent(frozen, randomUUID());
  }

  /** In-memory events for unit/integration assertions. */
  getPublishedEvents(): readonly PositionDomainEvent[] {
    return this.collected;
  }

  clearPublishedEvents(): void {
    this.collected.length = 0;
  }
}
