import { describe, expect, it } from 'vitest';
import { createPortfolio } from './domain/portfolio';
import { PortfolioEventPublisher } from './portfolio-event-publisher';
import type { PortfolioDomainEvent } from './portfolio-events';
import type { Portfolio } from './domain/portfolio';
import type { PortfolioSnapshot } from './domain/portfolio-snapshot';
import type { PortfolioRepository } from './portfolio.repository';
import { PortfolioSnapshotService } from './portfolio-snapshot.service';

const T0 = '2026-07-20T12:00:00.000Z';

class MemoryRepo implements PortfolioRepository {
  snapshots: PortfolioSnapshot[] = [];
  events: PortfolioDomainEvent[] = [];

  async create(portfolio: Portfolio): Promise<Portfolio> {
    return portfolio;
  }
  async save(portfolio: Portfolio): Promise<Portfolio> {
    return portfolio;
  }
  async findByWorkspaceId(): Promise<Portfolio | null> {
    return null;
  }
  async findById(): Promise<Portfolio | null> {
    return null;
  }
  async createSnapshot(snapshot: PortfolioSnapshot): Promise<PortfolioSnapshot> {
    this.snapshots.push(snapshot);
    return snapshot;
  }
  async listSnapshots(portfolioId: string): Promise<PortfolioSnapshot[]> {
    return this.snapshots.filter((s) => s.portfolioId === portfolioId);
  }
  async appendEvent(event: PortfolioDomainEvent): Promise<void> {
    this.events.push(event);
  }
  async listEvents(): Promise<PortfolioDomainEvent[]> {
    return this.events;
  }
}

describe('US204 PortfolioSnapshotService', () => {
  it('creates an immutable snapshot and publishes SnapshotCreated', async () => {
    const repo = new MemoryRepo();
    const publisher = new PortfolioEventPublisher(repo);
    const service = new PortfolioSnapshotService(repo, publisher);
    const portfolio = createPortfolio({
      id: 'pf-1',
      workspaceId: 'ws-1',
      ownerId: 'owner-1',
      currency: 'USD',
      initialCash: '100000',
      createdAt: T0,
      updatedAt: T0,
    });

    const snapshot = await service.createSnapshot(portfolio, T0);
    expect(snapshot.portfolioId).toBe('pf-1');
    expect(snapshot.balance.cash).toBe('100000');
    expect(snapshot.equity.equity).toBe('100000');
    expect(snapshot.margin.availableMargin).toBe('100000');
    expect(Object.isFrozen(snapshot)).toBe(true);
    expect(publisher.getPublishedEvents()[0]?.eventType).toBe('SnapshotCreated');
    expect(await service.listSnapshots('pf-1')).toHaveLength(1);
  });
});
