import { ConfigService } from '@nestjs/config';
import { beforeEach, describe, expect, it } from 'vitest';
import type { Portfolio } from '../portfolio-engine/domain/portfolio';
import type { PortfolioSnapshot } from '../portfolio-engine/domain/portfolio-snapshot';
import { PortfolioEventPublisher } from '../portfolio-engine/portfolio-event-publisher';
import type { PortfolioDomainEvent } from '../portfolio-engine/portfolio-events';
import type { PortfolioRepository } from '../portfolio-engine/portfolio.repository';
import { PortfolioService } from '../portfolio-engine/portfolio.service';
import { PortfolioSnapshotService } from '../portfolio-engine/portfolio-snapshot.service';
import type { Position } from '../position-engine/domain/position';
import type { PositionHistory } from '../position-engine/domain/position-history';
import { PositionEventPublisher } from '../position-engine/position-event-publisher';
import type { PositionDomainEvent } from '../position-engine/position-events';
import { PositionHistoryService } from '../position-engine/position-history.service';
import type { PositionRepository } from '../position-engine/position.repository';
import { PositionService } from '../position-engine/position.service';
import type { RiskDecision } from '../risk-engine/domain/risk-decision';
import type { RiskPolicy } from '../risk-engine/domain/risk-policy';
import { RiskEventPublisher } from '../risk-engine/risk-event-publisher';
import type { RiskDomainEvent } from '../risk-engine/risk-events';
import type { RiskRepository } from '../risk-engine/risk.repository';
import { RiskService } from '../risk-engine/risk.service';
import type { Order } from './domain/order';
import type { OrderFill } from './domain/order-fill';
import type { OrderHistory } from './domain/order-history';
import { OrderEventPublisher } from './order-event-publisher';
import type { OrderDomainEvent } from './order-events';
import { OrderExecutionService } from './order-execution.service';
import { OrderFillService } from './order-fill.service';
import { OrderHistoryService } from './order-history.service';
import { OrderImmutableError, OrderInvalidStateError } from './order-errors';
import type { OrderRepository } from './order.repository';
import { OrderService } from './order.service';

const WS = 'ws-us206';
const OWNER = 'owner-1';
const T0 = '2026-07-20T14:00:00.000Z';

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

class InMemoryOrderRepository implements OrderRepository {
  orders = new Map<string, Order>();
  fills: OrderFill[] = [];
  history: OrderHistory[] = [];
  events: Array<{ id: string; event: OrderDomainEvent }> = [];

  async create(order: Order): Promise<Order> {
    this.orders.set(order.id, order);
    return order;
  }
  async save(order: Order): Promise<Order> {
    this.orders.set(order.id, order);
    return order;
  }
  async findById(orderId: string): Promise<Order | null> {
    return this.orders.get(orderId) ?? null;
  }
  async listByPortfolioId(portfolioId: string): Promise<Order[]> {
    return [...this.orders.values()]
      .filter((o) => o.portfolioId === portfolioId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
  async listOpenByPortfolioId(portfolioId: string): Promise<Order[]> {
    return (await this.listByPortfolioId(portfolioId)).filter((o) =>
      ['CREATED', 'VALIDATED', 'PENDING', 'PARTIALLY_FILLED'].includes(o.status),
    );
  }
  async createFill(fill: OrderFill): Promise<OrderFill> {
    this.fills.push(fill);
    return fill;
  }
  async listFillsByOrderId(orderId: string): Promise<OrderFill[]> {
    return this.fills
      .filter((f) => f.orderId === orderId)
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  }
  async createHistory(entry: OrderHistory): Promise<OrderHistory> {
    this.history.push(entry);
    return entry;
  }
  async listHistoryByOrderId(orderId: string): Promise<OrderHistory[]> {
    return this.history
      .filter((h) => h.orderId === orderId)
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  }
  async listHistoryByPortfolioId(portfolioId: string): Promise<OrderHistory[]> {
    const ids = new Set(
      [...this.orders.values()].filter((o) => o.portfolioId === portfolioId).map((o) => o.id),
    );
    return this.history
      .filter((h) => ids.has(h.orderId))
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  }
  async appendEvent(event: OrderDomainEvent, eventId: string): Promise<void> {
    this.events.push({ id: eventId, event });
  }
  async listEvents(orderId: string): Promise<OrderDomainEvent[]> {
    return this.events.filter((e) => e.event.orderId === orderId).map((e) => e.event);
  }
}

class InMemoryRiskRepository implements RiskRepository {
  decisions = new Map<string, RiskDecision>();
  policies = new Map<string, RiskPolicy>();
  events: Array<{ id: string; event: RiskDomainEvent }> = [];

  async createDecision(decision: RiskDecision): Promise<RiskDecision> {
    this.decisions.set(decision.id, decision);
    return decision;
  }
  async findDecisionById(decisionId: string): Promise<RiskDecision | null> {
    return this.decisions.get(decisionId) ?? null;
  }
  async listDecisionsByPortfolioId(portfolioId: string): Promise<RiskDecision[]> {
    return [...this.decisions.values()]
      .filter((d) => d.portfolioId === portfolioId)
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  }
  async listDecisionsByOrderId(orderId: string): Promise<RiskDecision[]> {
    return [...this.decisions.values()]
      .filter((d) => d.orderId === orderId)
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  }
  async createPolicy(policy: RiskPolicy): Promise<RiskPolicy> {
    this.policies.set(policy.id, policy);
    return policy;
  }
  async savePolicy(policy: RiskPolicy): Promise<RiskPolicy> {
    this.policies.set(policy.id, policy);
    return policy;
  }
  async findPolicyById(policyId: string): Promise<RiskPolicy | null> {
    return this.policies.get(policyId) ?? null;
  }
  async listPolicies(portfolioId: string | null): Promise<RiskPolicy[]> {
    const rows = [...this.policies.values()].filter((p) =>
      portfolioId === null
        ? p.portfolioId === null
        : p.portfolioId === portfolioId || p.portfolioId === null,
    );
    const byName = new Map<string, RiskPolicy>();
    for (const row of rows) {
      const existing = byName.get(row.name);
      if (!existing || (row.portfolioId !== null && existing.portfolioId === null)) {
        byName.set(row.name, row);
      }
    }
    return [...byName.values()].sort(
      (a, b) => a.priority - b.priority || a.name.localeCompare(b.name),
    );
  }
  async appendEvent(event: RiskDomainEvent, eventId: string): Promise<void> {
    this.events.push({ id: eventId, event });
  }
  async listEventsByDecisionId(decisionId: string): Promise<RiskDomainEvent[]> {
    return this.events.filter((e) => e.event.decisionId === decisionId).map((e) => e.event);
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
  const positionHistory = new PositionHistoryService(positionRepo);
  const positionService = new PositionService(
    positionRepo,
    positionHistory,
    positionEvents,
    portfolioService,
  );
  positionService.setClock({ now: () => new Date(T0), iso: () => T0 });

  const riskRepo = new InMemoryRiskRepository();
  const riskEvents = new RiskEventPublisher(riskRepo);
  const riskService = new RiskService(riskRepo, riskEvents, portfolioService, positionService);
  riskService.setClock({ now: () => new Date(T0), iso: () => T0 });

  const orderRepo = new InMemoryOrderRepository();
  const orderEvents = new OrderEventPublisher(orderRepo);
  const orderHistory = new OrderHistoryService(orderRepo, orderEvents);
  const fillService = new OrderFillService(orderRepo);
  const execution = new OrderExecutionService(
    orderRepo,
    fillService,
    orderHistory,
    orderEvents,
    positionService,
    portfolioService,
  );
  const service = new OrderService(
    orderRepo,
    orderHistory,
    orderEvents,
    fillService,
    execution,
    portfolioService,
    riskService,
  );
  service.setClock({ now: () => new Date(T0), iso: () => T0 });

  return {
    service,
    orderRepo,
    orderEvents,
    orderHistory,
    fillService,
    positionService,
    portfolioService,
    riskService,
    riskEvents,
  };
}

describe('US206 OrderService', () => {
  let service: OrderService;
  let orderEvents: OrderEventPublisher;
  let orderHistory: OrderHistoryService;
  let fillService: OrderFillService;
  let positionService: PositionService;
  let portfolioService: PortfolioService;
  let riskService: RiskService;

  beforeEach(() => {
    ({
      service,
      orderEvents,
      orderHistory,
      fillService,
      positionService,
      portfolioService,
      riskService,
    } = buildService());
    orderEvents.clearPublishedEvents();
  });

  it('creates an order through CREATED → VALIDATED → PENDING', async () => {
    const view = await service.create(WS, OWNER, {
      symbol: 'btc-usd',
      side: 'BUY',
      type: 'MARKET',
      quantity: '1',
    });
    expect(view.symbol).toBe('BTC-USD');
    expect(view.status).toBe('PENDING');
    expect(view.remainingQuantity).toBe('1');
    expect(view.filledQuantity).toBe('0');

    const types = orderEvents.getPublishedEvents().map((e) => e.eventType);
    expect(types).toContain('OrderCreated');
    expect(types).toContain('OrderValidated');
    expect(types).toContain('OrderSubmitted');
    expect(types).toContain('OrderUpdated');

    const history = await orderHistory.listByOrderId(view.id);
    expect(history.map((h) => `${h.previousStatus}→${h.currentStatus}`)).toEqual([
      'CREATED→VALIDATED',
      'VALIDATED→PENDING',
    ]);

    const decisions = await riskService.listDecisions(WS, OWNER);
    expect(decisions).toHaveLength(1);
    expect(decisions[0].decision).toBe('APPROVED');
  });

  it('rejects order when risk policies fail and never reaches PENDING', async () => {
    await portfolioService.getOrCreate(WS, OWNER);
    await portfolioService.applyFinancials(WS, {
      cash: '10',
      realizedPnL: '0',
      unrealizedPnL: '0',
      usedMargin: '0',
    });

    const view = await service.create(WS, OWNER, {
      symbol: 'BTC-USD',
      side: 'BUY',
      type: 'LIMIT',
      quantity: '1',
      requestedPrice: '100',
    });

    expect(view.status).toBe('REJECTED');
    expect(orderEvents.getPublishedEvents().map((e) => e.eventType)).toContain('OrderRejected');
    expect(orderEvents.getPublishedEvents().map((e) => e.eventType)).not.toContain(
      'OrderSubmitted',
    );

    const history = await orderHistory.listByOrderId(view.id);
    expect(history.map((h) => `${h.previousStatus}→${h.currentStatus}`)).toEqual([
      'CREATED→VALIDATED',
      'VALIDATED→REJECTED',
    ]);
  });

  it('executes a full fill and opens a LONG position', async () => {
    const order = await service.create(WS, OWNER, {
      symbol: 'ETH-USD',
      side: 'BUY',
      type: 'LIMIT',
      quantity: '2',
      requestedPrice: '100',
    });
    orderEvents.clearPublishedEvents();

    const filled = await service.execute(WS, OWNER, order.id, { price: '101' });
    expect(filled.status).toBe('FILLED');
    expect(filled.filledQuantity).toBe('2');
    expect(filled.remainingQuantity).toBe('0');
    expect(filled.executedPrice).toBe('101');
    expect(filled.positionId).toBeTruthy();

    const positions = await positionService.listOpen(WS, OWNER);
    expect(positions).toHaveLength(1);
    expect(positions[0].side).toBe('LONG');
    expect(positions[0].quantity).toBe('2');

    const fills = await fillService.listByOrderId(order.id);
    expect(fills).toHaveLength(1);
    expect(fills[0].price).toBe('101');

    expect(orderEvents.getPublishedEvents().map((e) => e.eventType)).toContain('OrderFilled');

    const portfolio = await portfolioService.getPortfolio(WS);
    expect(portfolio.margin.usedMargin).not.toBe('0');
  });

  it('supports partial fills then cancel of remainder', async () => {
    const order = await service.create(WS, OWNER, {
      symbol: 'SOL-USD',
      side: 'BUY',
      type: 'MARKET',
      quantity: '4',
    });
    const partial = await service.execute(WS, OWNER, order.id, {
      quantity: '1',
      price: '50',
    });
    expect(partial.status).toBe('PARTIALLY_FILLED');
    expect(partial.remainingQuantity).toBe('3');

    const cancelled = await service.cancel(WS, OWNER, order.id);
    expect(cancelled.status).toBe('CANCELLED');
    expect(cancelled.cancelledAt).toBe(T0);
    expect(cancelled.filledQuantity).toBe('1');
  });

  it('SELL fill reduces an existing LONG via PositionService', async () => {
    await positionService.open(WS, OWNER, {
      symbol: 'BTC-USD',
      side: 'LONG',
      quantity: '3',
      entryPrice: '100',
    });
    const order = await service.create(WS, OWNER, {
      symbol: 'BTC-USD',
      side: 'SELL',
      type: 'MARKET',
      quantity: '1',
    });
    const filled = await service.execute(WS, OWNER, order.id, { price: '110' });
    expect(filled.status).toBe('FILLED');

    const open = await positionService.listOpen(WS, OWNER);
    expect(open).toHaveLength(1);
    expect(open[0].quantity).toBe('2');
    expect(open[0].realizedPnL).toBe('10');
  });

  it('rejects execution of cancelled orders', async () => {
    const order = await service.create(WS, OWNER, {
      symbol: 'BTC-USD',
      side: 'BUY',
      type: 'MARKET',
      quantity: '1',
    });
    await service.cancel(WS, OWNER, order.id);
    await expect(service.execute(WS, OWNER, order.id, { price: '100' })).rejects.toBeInstanceOf(
      OrderInvalidStateError,
    );
  });

  it('rejects mutation of filled orders', async () => {
    const order = await service.create(WS, OWNER, {
      symbol: 'BTC-USD',
      side: 'BUY',
      type: 'MARKET',
      quantity: '1',
    });
    await service.execute(WS, OWNER, order.id, { price: '100' });
    await expect(service.update(WS, OWNER, order.id, { quantity: '2' })).rejects.toBeInstanceOf(
      OrderImmutableError,
    );
  });
});
