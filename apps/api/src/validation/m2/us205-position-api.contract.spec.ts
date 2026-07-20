/**
 * US205 — Position API response schema contract.
 * Validates PositionView and PositionHistory shapes.
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
import type { Position } from '../../modules/position-engine/domain/position';
import type { PositionHistory } from '../../modules/position-engine/domain/position-history';
import { PositionEventPublisher } from '../../modules/position-engine/position-event-publisher';
import type { PositionDomainEvent } from '../../modules/position-engine/position-events';
import { PositionHistoryService } from '../../modules/position-engine/position-history.service';
import type { PositionRepository } from '../../modules/position-engine/position.repository';
import { PositionService } from '../../modules/position-engine/position.service';

const T0 = '2026-07-20T15:00:00.000Z';

class MemoryPortfolioRepo implements PortfolioRepository {
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

class MemoryPositionRepo implements PositionRepository {
  positions = new Map<string, Position>();
  history: PositionHistory[] = [];
  async create(position: Position): Promise<Position> {
    this.positions.set(position.id, position);
    return position;
  }
  async save(position: Position): Promise<Position> {
    this.positions.set(position.id, position);
    return position;
  }
  async findById(id: string): Promise<Position | null> {
    return this.positions.get(id) ?? null;
  }
  async listByPortfolioId(portfolioId: string): Promise<Position[]> {
    return [...this.positions.values()].filter((p) => p.portfolioId === portfolioId);
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
    return this.history.filter((h) => h.positionId === positionId);
  }
  async listHistoryByPortfolioId(portfolioId: string): Promise<PositionHistory[]> {
    const ids = new Set(
      [...this.positions.values()].filter((p) => p.portfolioId === portfolioId).map((p) => p.id),
    );
    return this.history.filter((h) => ids.has(h.positionId));
  }
  async appendEvent(_event: PositionDomainEvent, _eventId: string): Promise<void> {}
  async listEvents(): Promise<PositionDomainEvent[]> {
    return [];
  }
}

function assertString(value: unknown, field: string): asserts value is string {
  expect(typeof value, field).toBe('string');
}

function buildService() {
  const portfolioRepo = new MemoryPortfolioRepo();
  const portfolioEvents = new PortfolioEventPublisher(portfolioRepo);
  const snapshots = new PortfolioSnapshotService(portfolioRepo, portfolioEvents);
  const portfolios = new PortfolioService(portfolioRepo, snapshots, portfolioEvents, {
    get: () => 'development',
  } as unknown as ConfigService);
  portfolios.setClock({ now: () => new Date(T0), iso: () => T0 });

  const positionRepo = new MemoryPositionRepo();
  const events = new PositionEventPublisher(positionRepo);
  const history = new PositionHistoryService(positionRepo);
  const service = new PositionService(positionRepo, history, events, portfolios);
  service.setClock({ now: () => new Date(T0), iso: () => T0 });
  return service;
}

describe('US205 — Position API response schema contract', () => {
  it('matches PositionView schema for open lifecycle responses', async () => {
    const service = buildService();
    const view = await service.open('ws-contract', 'owner-contract', {
      symbol: 'BTC-USD',
      side: 'LONG',
      quantity: '1',
      entryPrice: '100',
    });

    assertString(view.id, 'id');
    assertString(view.portfolioId, 'portfolioId');
    assertString(view.symbol, 'symbol');
    assertString(view.side, 'side');
    assertString(view.status, 'status');
    assertString(view.quantity, 'quantity');
    assertString(view.entryPrice, 'entryPrice');
    assertString(view.markPrice, 'markPrice');
    assertString(view.averageEntryPrice, 'averageEntryPrice');
    assertString(view.realizedPnL, 'realizedPnL');
    assertString(view.unrealizedPnL, 'unrealizedPnL');
    assertString(view.exposure, 'exposure');
    assertString(view.positionValue, 'positionValue');
    assertString(view.returnPercent, 'returnPercent');
    assertString(view.createdAt, 'createdAt');
    assertString(view.updatedAt, 'updatedAt');
    expect(view.closedAt).toBeNull();
    expect(['LONG', 'SHORT']).toContain(view.side);
    expect(['OPEN', 'PARTIALLY_CLOSED', 'CLOSED', 'LIQUIDATED']).toContain(view.status);
  });

  it('matches PositionHistory schema', async () => {
    const service = buildService();
    const view = await service.open('ws-contract-2', 'owner-contract', {
      symbol: 'ETH-USD',
      side: 'SHORT',
      quantity: '2',
      entryPrice: '50',
    });
    const history = await service.listHistory('ws-contract-2', 'owner-contract', view.id);
    expect(history.length).toBeGreaterThan(0);
    const entry = history[0]!;
    expect(entry).toEqual({
      id: expect.any(String),
      positionId: expect.any(String),
      timestamp: expect.any(String),
      action: expect.any(String),
      quantity: expect.any(String),
      price: expect.any(String),
      realizedPnL: expect.any(String),
    });
    expect(['OPENED', 'INCREASED', 'REDUCED', 'CLOSED', 'MARKED']).toContain(entry.action);
  });
});
