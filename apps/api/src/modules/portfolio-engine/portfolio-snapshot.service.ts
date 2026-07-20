import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { Portfolio } from './domain/portfolio';
import { createPortfolioSnapshot, type PortfolioSnapshot } from './domain/portfolio-snapshot';
import { PortfolioCalculator } from './portfolio-calculator';
import { PortfolioEventPublisher } from './portfolio-event-publisher';
import { PORTFOLIO_REPOSITORY, type PortfolioRepository } from './portfolio.repository';

/**
 * Creates and persists immutable portfolio snapshots (US204).
 */
@Injectable()
export class PortfolioSnapshotService {
  constructor(
    @Inject(PORTFOLIO_REPOSITORY) private readonly repository: PortfolioRepository,
    @Inject(PortfolioEventPublisher) private readonly events: PortfolioEventPublisher,
  ) {}

  async createSnapshot(portfolio: Portfolio, timestamp: string): Promise<PortfolioSnapshot> {
    const state = PortfolioCalculator.toFinancialState(portfolio);
    const snapshot = createPortfolioSnapshot({
      id: randomUUID(),
      portfolioId: portfolio.id,
      timestamp,
      balance: state.balance,
      equity: state.equity,
      margin: state.margin,
    });

    const saved = await this.repository.createSnapshot(snapshot);
    await this.events.publish({
      eventType: 'SnapshotCreated',
      portfolioId: portfolio.id,
      occurredAt: timestamp,
      snapshotId: saved.id,
    });
    return saved;
  }

  listSnapshots(portfolioId: string): Promise<PortfolioSnapshot[]> {
    return this.repository.listSnapshots(portfolioId);
  }
}
