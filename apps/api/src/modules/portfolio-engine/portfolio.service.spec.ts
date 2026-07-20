import { ConfigService } from '@nestjs/config';
import { beforeEach, describe, expect, it } from 'vitest';
import type { Portfolio } from './domain/portfolio';
import type { PortfolioSnapshot } from './domain/portfolio-snapshot';
import { PortfolioEventPublisher } from './portfolio-event-publisher';
import type { PortfolioDomainEvent } from './portfolio-events';
import { PortfolioResetForbiddenError } from './portfolio-errors';
import type { PortfolioRepository } from './portfolio.repository';
import { PortfolioService } from './portfolio.service';
import { PortfolioSnapshotService } from './portfolio-snapshot.service';

const WS = 'ws-us204';
const OWNER = 'owner-1';
const T0 = '2026-07-20T12:00:00.000Z';

class InMemoryPortfolioRepository implements PortfolioRepository {
  portfolios = new Map<string, Portfolio>();
  snapshots: PortfolioSnapshot[] = [];
  events: Array<{ id: string; event: PortfolioDomainEvent }> = [];

  async create(portfolio: Portfolio): Promise<Portfolio> {
    if ([...this.portfolios.values()].some((p) => p.workspaceId === portfolio.workspaceId)) {
      const err = Object.assign(new Error('unique'), { code: 'P2002' });
      throw err;
    }
    this.portfolios.set(portfolio.id, portfolio);
    return portfolio;
  }

  async save(portfolio: Portfolio): Promise<Portfolio> {
    this.portfolios.set(portfolio.id, portfolio);
    return portfolio;
  }

  async findByWorkspaceId(workspaceId: string): Promise<Portfolio | null> {
    return [...this.portfolios.values()].find((p) => p.workspaceId === workspaceId) ?? null;
  }

  async findById(portfolioId: string): Promise<Portfolio | null> {
    return this.portfolios.get(portfolioId) ?? null;
  }

  async createSnapshot(snapshot: PortfolioSnapshot): Promise<PortfolioSnapshot> {
    this.snapshots.push(snapshot);
    return snapshot;
  }

  async listSnapshots(portfolioId: string): Promise<PortfolioSnapshot[]> {
    return this.snapshots
      .filter((s) => s.portfolioId === portfolioId)
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  }

  async appendEvent(event: PortfolioDomainEvent, eventId: string): Promise<void> {
    this.events.push({ id: eventId, event });
  }

  async listEvents(portfolioId: string): Promise<PortfolioDomainEvent[]> {
    return this.events.filter((e) => e.event.portfolioId === portfolioId).map((e) => e.event);
  }
}

function buildService(nodeEnv = 'development') {
  const repository = new InMemoryPortfolioRepository();
  const events = new PortfolioEventPublisher(repository);
  const snapshots = new PortfolioSnapshotService(repository, events);
  const config = {
    get: (key: string) => (key === 'NODE_ENV' ? nodeEnv : undefined),
  } as ConfigService;
  const service = new PortfolioService(repository, snapshots, events, config);
  service.setClock({
    now: () => new Date(T0),
    iso: () => T0,
  });
  return { service, repository, events };
}

describe('US204 PortfolioService', () => {
  let service: PortfolioService;
  let events: PortfolioEventPublisher;

  beforeEach(() => {
    ({ service, events } = buildService());
    events.clearPublishedEvents();
  });

  it('creates a portfolio on first access and publishes PortfolioCreated + SnapshotCreated', async () => {
    const view = await service.getOrCreate(WS, OWNER);
    expect(view.status).toBe('ACTIVE');
    expect(view.balance.cash).toBe('100000');
    expect(view.equity.equity).toBe('100000');
    expect(view.margin.availableMargin).toBe('100000');
    expect(events.getPublishedEvents().map((e) => e.eventType)).toEqual([
      'PortfolioCreated',
      'SnapshotCreated',
    ]);
  });

  it('is idempotent for getOrCreate within a workspace', async () => {
    const first = await service.getOrCreate(WS, OWNER);
    const second = await service.getOrCreate(WS, OWNER);
    expect(second.id).toBe(first.id);
  });

  it('applies financial updates and publishes balance/equity/margin events', async () => {
    await service.getOrCreate(WS, OWNER);
    events.clearPublishedEvents();
    const updated = await service.applyFinancials(WS, {
      cash: '95000',
      realizedPnL: '2000',
      unrealizedPnL: '500',
      usedMargin: '10000',
    });
    expect(updated.equity.equity).toBe('97500');
    expect(updated.margin.availableMargin).toBe('87500');
    const types = events.getPublishedEvents().map((e) => e.eventType);
    expect(types).toContain('BalanceChanged');
    expect(types).toContain('EquityChanged');
    expect(types).toContain('MarginChanged');
    expect(types).toContain('SnapshotCreated');
  });

  it('resets portfolio in development and forbids reset in production', async () => {
    await service.getOrCreate(WS, OWNER);
    await service.applyFinancials(WS, {
      cash: '1',
      realizedPnL: '0',
      unrealizedPnL: '0',
      usedMargin: '0',
    });
    const reset = await service.reset(WS);
    expect(reset.balance.cash).toBe('100000');

    const prod = buildService('production');
    await prod.service.getOrCreate(WS, OWNER);
    await expect(prod.service.reset(WS)).rejects.toBeInstanceOf(PortfolioResetForbiddenError);
  });

  it('archives a portfolio and emits PortfolioArchived', async () => {
    await service.getOrCreate(WS, OWNER);
    events.clearPublishedEvents();
    const archived = await service.archive(WS);
    expect(archived.status).toBe('ARCHIVED');
    expect(events.getPublishedEvents().map((e) => e.eventType)).toContain('PortfolioArchived');
  });

  it('supports pause and resume transitions', async () => {
    await service.getOrCreate(WS, OWNER);
    expect((await service.pause(WS)).status).toBe('PAUSED');
    expect((await service.resume(WS)).status).toBe('ACTIVE');
  });
});
