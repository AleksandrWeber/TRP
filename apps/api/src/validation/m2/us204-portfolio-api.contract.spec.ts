/**
 * US204 — Portfolio API response schema contract.
 * Validates PortfolioView / Balance / Equity / Margin / Snapshot shapes.
 */
import { ConfigService } from '@nestjs/config';
import { describe, expect, it } from 'vitest';
import type { Portfolio } from '../../modules/portfolio-engine/domain/portfolio';
import type { PortfolioSnapshot } from '../../modules/portfolio-engine/domain/portfolio-snapshot';
import { PortfolioEventPublisher } from '../../modules/portfolio-engine/portfolio-event-publisher';
import type { PortfolioDomainEvent } from '../../modules/portfolio-engine/portfolio-events';
import type { PortfolioRepository } from '../../modules/portfolio-engine/portfolio.repository';
import { PortfolioService } from '../../modules/portfolio-engine/portfolio.service';
import { PortfolioSnapshotService } from '../../modules/portfolio-engine/portfolio-snapshot.service';

const T0 = '2026-07-20T15:00:00.000Z';

class MemoryRepo implements PortfolioRepository {
  private portfolio: Portfolio | null = null;
  private snapshots: PortfolioSnapshot[] = [];

  async create(portfolio: Portfolio): Promise<Portfolio> {
    this.portfolio = portfolio;
    return portfolio;
  }
  async save(portfolio: Portfolio): Promise<Portfolio> {
    this.portfolio = portfolio;
    return portfolio;
  }
  async findByWorkspaceId(workspaceId: string): Promise<Portfolio | null> {
    return this.portfolio?.workspaceId === workspaceId ? this.portfolio : null;
  }
  async findById(id: string): Promise<Portfolio | null> {
    return this.portfolio?.id === id ? this.portfolio : null;
  }
  async createSnapshot(snapshot: PortfolioSnapshot): Promise<PortfolioSnapshot> {
    this.snapshots.push(snapshot);
    return snapshot;
  }
  async listSnapshots(portfolioId: string): Promise<PortfolioSnapshot[]> {
    return this.snapshots.filter((s) => s.portfolioId === portfolioId);
  }
  async appendEvent(_event: PortfolioDomainEvent, _eventId: string): Promise<void> {}
  async listEvents(): Promise<PortfolioDomainEvent[]> {
    return [];
  }
}

function assertString(value: unknown, field: string): asserts value is string {
  expect(typeof value, field).toBe('string');
}

describe('US204 — Portfolio API response schema contract', () => {
  it('matches GET /v1/portfolio complete portfolio schema', async () => {
    const repository = new MemoryRepo();
    const events = new PortfolioEventPublisher(repository);
    const snapshots = new PortfolioSnapshotService(repository, events);
    const service = new PortfolioService(repository, snapshots, events, {
      get: () => 'development',
    } as unknown as ConfigService);
    service.setClock({ now: () => new Date(T0), iso: () => T0 });

    const view = await service.getOrCreate('ws-contract', 'owner-contract');

    assertString(view.id, 'id');
    assertString(view.ownerId, 'ownerId');
    assertString(view.currency, 'currency');
    assertString(view.status, 'status');
    assertString(view.createdAt, 'createdAt');
    assertString(view.updatedAt, 'updatedAt');
    assertString(view.refreshedAt, 'refreshedAt');
    assertString(view.portfolioValue, 'portfolioValue');
    assertString(view.portfolioReturn, 'portfolioReturn');

    expect(view.balance).toEqual({ cash: expect.any(String) });
    expect(view.equity).toEqual({
      equity: expect.any(String),
      realizedPnL: expect.any(String),
      unrealizedPnL: expect.any(String),
    });
    expect(view.margin).toEqual({
      usedMargin: expect.any(String),
      availableMargin: expect.any(String),
    });
    expect(['ACTIVE', 'PAUSED', 'ARCHIVED']).toContain(view.status);
  });

  it('matches balance, equity, margin, and snapshot schemas', async () => {
    const repository = new MemoryRepo();
    const events = new PortfolioEventPublisher(repository);
    const snapshots = new PortfolioSnapshotService(repository, events);
    const service = new PortfolioService(repository, snapshots, events, {
      get: () => 'development',
    } as unknown as ConfigService);
    service.setClock({ now: () => new Date(T0), iso: () => T0 });
    await service.getOrCreate('ws-contract-2', 'owner-contract');

    expect(await service.getBalance('ws-contract-2')).toEqual({ cash: expect.any(String) });
    expect(await service.getEquity('ws-contract-2')).toEqual({
      equity: expect.any(String),
      realizedPnL: expect.any(String),
      unrealizedPnL: expect.any(String),
    });
    expect(await service.getMargin('ws-contract-2')).toEqual({
      usedMargin: expect.any(String),
      availableMargin: expect.any(String),
    });

    const list = await service.listSnapshots('ws-contract-2');
    expect(list.length).toBeGreaterThan(0);
    const snapshot = list[0]!;
    expect(snapshot).toEqual({
      id: expect.any(String),
      portfolioId: expect.any(String),
      timestamp: expect.any(String),
      balance: { cash: expect.any(String) },
      equity: {
        equity: expect.any(String),
        realizedPnL: expect.any(String),
        unrealizedPnL: expect.any(String),
      },
      margin: {
        usedMargin: expect.any(String),
        availableMargin: expect.any(String),
      },
      realizedPnL: expect.any(String),
      unrealizedPnL: expect.any(String),
    });
  });
});
