import { ConfigService } from '@nestjs/config';
import { beforeEach, describe, expect, it } from 'vitest';
import type { Portfolio } from '../portfolio-engine/domain/portfolio';
import type { PortfolioSnapshot } from '../portfolio-engine/domain/portfolio-snapshot';
import { PortfolioEventPublisher } from '../portfolio-engine/portfolio-event-publisher';
import type { PortfolioDomainEvent } from '../portfolio-engine/portfolio-events';
import type { PortfolioRepository } from '../portfolio-engine/portfolio.repository';
import { PortfolioService } from '../portfolio-engine/portfolio.service';
import { PortfolioSnapshotService } from '../portfolio-engine/portfolio-snapshot.service';
import type { Position } from './domain/position';
import type { PositionHistory } from './domain/position-history';
import { PositionEventPublisher } from './position-event-publisher';
import type { PositionDomainEvent } from './position-events';
import { PositionImmutableError } from './position-errors';
import { PositionHistoryService } from './position-history.service';
import type { PositionRepository } from './position.repository';
import { PositionService } from './position.service';

const WS = 'ws-us205';
const OWNER = 'owner-1';
const T0 = '2026-07-20T12:00:00.000Z';

class InMemoryPortfolioRepository implements PortfolioRepository {
  portfolios = new Map<string, Portfolio>();
  snapshots: PortfolioSnapshot[] = [];
  events: Array<{ id: string; event: PortfolioDomainEvent }> = [];

  async create(portfolio: Portfolio): Promise<Portfolio> {
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
    return this.snapshots.filter((s) => s.portfolioId === portfolioId);
  }
  async appendEvent(event: PortfolioDomainEvent, eventId: string): Promise<void> {
    this.events.push({ id: eventId, event });
  }
  async listEvents(portfolioId: string): Promise<PortfolioDomainEvent[]> {
    return this.events.filter((e) => e.event.portfolioId === portfolioId).map((e) => e.event);
  }
}

class InMemoryPositionRepository implements PositionRepository {
  positions = new Map<string, Position>();
  history: PositionHistory[] = [];
  events: Array<{ id: string; event: PositionDomainEvent }> = [];

  async create(position: Position): Promise<Position> {
    this.positions.set(position.id, position);
    return position;
  }
  async save(position: Position): Promise<Position> {
    this.positions.set(position.id, position);
    return position;
  }
  async findById(positionId: string): Promise<Position | null> {
    return this.positions.get(positionId) ?? null;
  }
  async listByPortfolioId(portfolioId: string): Promise<Position[]> {
    return [...this.positions.values()]
      .filter((p) => p.portfolioId === portfolioId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
  async listOpenByPortfolioId(portfolioId: string): Promise<Position[]> {
    return (await this.listByPortfolioId(portfolioId)).filter(
      (p) => p.status === 'OPEN' || p.status === 'PARTIALLY_CLOSED',
    );
  }
  async createHistory(entry: PositionHistory): Promise<PositionHistory> {
    this.history.push(entry);
    return entry;
  }
  async listHistoryByPositionId(positionId: string): Promise<PositionHistory[]> {
    return this.history
      .filter((h) => h.positionId === positionId)
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  }
  async listHistoryByPortfolioId(portfolioId: string): Promise<PositionHistory[]> {
    const ids = new Set(
      [...this.positions.values()].filter((p) => p.portfolioId === portfolioId).map((p) => p.id),
    );
    return this.history
      .filter((h) => ids.has(h.positionId))
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  }
  async appendEvent(event: PositionDomainEvent, eventId: string): Promise<void> {
    this.events.push({ id: eventId, event });
  }
  async listEvents(positionId: string): Promise<PositionDomainEvent[]> {
    return this.events.filter((e) => e.event.positionId === positionId).map((e) => e.event);
  }
}

function buildService() {
  const portfolioRepo = new InMemoryPortfolioRepository();
  const portfolioEvents = new PortfolioEventPublisher(portfolioRepo);
  const snapshots = new PortfolioSnapshotService(portfolioRepo, portfolioEvents);
  const portfolioService = new PortfolioService(portfolioRepo, snapshots, portfolioEvents, {
    get: () => 'development',
  } as unknown as ConfigService);
  portfolioService.setClock({ now: () => new Date(T0), iso: () => T0 });

  const positionRepo = new InMemoryPositionRepository();
  const positionEvents = new PositionEventPublisher(positionRepo);
  const history = new PositionHistoryService(positionRepo);
  const service = new PositionService(positionRepo, history, positionEvents, portfolioService);
  service.setClock({ now: () => new Date(T0), iso: () => T0 });

  return { service, positionRepo, positionEvents, portfolioService, history };
}

describe('US205 PositionService', () => {
  let service: PositionService;
  let positionEvents: PositionEventPublisher;
  let portfolioService: PortfolioService;
  let history: PositionHistoryService;

  beforeEach(() => {
    ({ service, positionEvents, portfolioService, history } = buildService());
    positionEvents.clearPublishedEvents();
  });

  it('opens a position, records history, and publishes events', async () => {
    const view = await service.open(WS, OWNER, {
      symbol: 'btc-usd',
      side: 'LONG',
      quantity: '1',
      entryPrice: '100',
    });
    expect(view.symbol).toBe('BTC-USD');
    expect(view.status).toBe('OPEN');
    expect(view.averageEntryPrice).toBe('100');
    expect(positionEvents.getPublishedEvents().map((e) => e.eventType)).toEqual([
      'PositionOpened',
      'PositionUpdated',
      'PnLUpdated',
    ]);
    const entries = await history.listByPositionId(view.id);
    expect(entries.map((e) => e.action)).toEqual(['OPENED']);
  });

  it('increases average entry and reduces with realized PnL', async () => {
    const opened = await service.open(WS, OWNER, {
      symbol: 'ETH-USD',
      side: 'LONG',
      quantity: '2',
      entryPrice: '100',
    });
    positionEvents.clearPublishedEvents();

    const increased = await service.increase(WS, OWNER, {
      positionId: opened.id,
      quantity: '2',
      price: '120',
    });
    expect(increased.averageEntryPrice).toBe('110');
    expect(increased.quantity).toBe('4');

    const reduced = await service.reduce(WS, OWNER, {
      positionId: opened.id,
      quantity: '1',
      price: '130',
    });
    expect(reduced.status).toBe('PARTIALLY_CLOSED');
    expect(reduced.realizedPnL).toBe('20');
    expect(reduced.quantity).toBe('3');
  });

  it('fully closes a position and syncs portfolio PnL', async () => {
    const opened = await service.open(WS, OWNER, {
      symbol: 'SOL-USD',
      side: 'LONG',
      quantity: '2',
      entryPrice: '50',
    });
    const closed = await service.close(WS, OWNER, {
      positionId: opened.id,
      price: '60',
    });
    expect(closed.status).toBe('CLOSED');
    expect(closed.quantity).toBe('0');
    expect(closed.realizedPnL).toBe('20');
    expect(closed.closedAt).toBe(T0);

    const portfolio = await portfolioService.getPortfolio(WS);
    expect(portfolio.equity.realizedPnL).toBe('20');
    expect(portfolio.equity.unrealizedPnL).toBe('0');
    expect(portfolio.margin.usedMargin).toBe('0');
  });

  it('marks price and updates unrealized PnL + portfolio', async () => {
    const opened = await service.open(WS, OWNER, {
      symbol: 'BTC-USD',
      side: 'LONG',
      quantity: '1',
      entryPrice: '100',
    });
    const marked = await service.markPrice(WS, OWNER, {
      positionId: opened.id,
      markPrice: '125',
    });
    expect(marked.unrealizedPnL).toBe('25');
    expect(marked.exposure).toBe('125');

    const portfolio = await portfolioService.getPortfolio(WS);
    expect(portfolio.equity.unrealizedPnL).toBe('25');
    expect(portfolio.margin.usedMargin).toBe('125');
  });

  it('rejects mutations on closed positions', async () => {
    const opened = await service.open(WS, OWNER, {
      symbol: 'BTC-USD',
      side: 'LONG',
      quantity: '1',
      entryPrice: '100',
    });
    await service.close(WS, OWNER, { positionId: opened.id, price: '100' });
    await expect(
      service.increase(WS, OWNER, { positionId: opened.id, quantity: '1', price: '100' }),
    ).rejects.toBeInstanceOf(PositionImmutableError);
  });

  it('lists open positions and history', async () => {
    const a = await service.open(WS, OWNER, {
      symbol: 'AAA',
      side: 'LONG',
      quantity: '1',
      entryPrice: '10',
    });
    await service.open(WS, OWNER, {
      symbol: 'BBB',
      side: 'SHORT',
      quantity: '1',
      entryPrice: '10',
    });
    await service.close(WS, OWNER, { positionId: a.id, price: '11' });

    const open = await service.listOpen(WS, OWNER);
    expect(open).toHaveLength(1);
    expect(open[0]?.symbol).toBe('BBB');

    const allHistory = await service.listHistory(WS, OWNER);
    expect(allHistory.length).toBeGreaterThanOrEqual(3);
  });
});
