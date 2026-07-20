import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { PortfolioDomainEvent } from './portfolio-events';
import { PORTFOLIO_REPOSITORY, type PortfolioRepository } from './portfolio.repository';

/**
 * Publishes portfolio domain events to durable PortfolioEvent storage (US204).
 */
@Injectable()
export class PortfolioEventPublisher {
  private readonly collected: PortfolioDomainEvent[] = [];

  constructor(@Inject(PORTFOLIO_REPOSITORY) private readonly repository: PortfolioRepository) {}

  async publish(event: PortfolioDomainEvent): Promise<void> {
    const frozen = Object.freeze({ ...event });
    this.collected.push(frozen);
    await this.repository.appendEvent(frozen, randomUUID());
  }

  /** In-memory events for unit/integration assertions. */
  getPublishedEvents(): readonly PortfolioDomainEvent[] {
    return this.collected;
  }

  clearPublishedEvents(): void {
    this.collected.length = 0;
  }
}
