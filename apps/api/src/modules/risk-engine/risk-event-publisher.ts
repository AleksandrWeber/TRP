import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { RiskDomainEvent } from './risk-events';
import { RISK_REPOSITORY, type RiskRepository } from './risk.repository';

/**
 * Publishes risk domain events to durable TradingRiskEvent storage (US207).
 */
@Injectable()
export class RiskEventPublisher {
  private readonly collected: RiskDomainEvent[] = [];

  constructor(@Inject(RISK_REPOSITORY) private readonly repository: RiskRepository) {}

  async publish(event: RiskDomainEvent): Promise<void> {
    const frozen = Object.freeze({ ...event });
    this.collected.push(frozen);
    await this.repository.appendEvent(frozen, randomUUID());
  }

  getPublishedEvents(): readonly RiskDomainEvent[] {
    return this.collected;
  }

  clearPublishedEvents(): void {
    this.collected.length = 0;
  }
}
