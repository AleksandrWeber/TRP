/**
 * US206 — Order API response schema contract.
 * Validates OrderView, OrderHistory, and OrderFill shapes.
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
import type { Order } from '../../modules/order-engine/domain/order';
import type { OrderFill } from '../../modules/order-engine/domain/order-fill';
import type { OrderHistory } from '../../modules/order-engine/domain/order-history';
import { OrderEventPublisher } from '../../modules/order-engine/order-event-publisher';
import type { OrderDomainEvent } from '../../modules/order-engine/order-events';
import { OrderExecutionService } from '../../modules/order-engine/order-execution.service';
import { OrderFillService } from '../../modules/order-engine/order-fill.service';
import { OrderHistoryService } from '../../modules/order-engine/order-history.service';
import type { OrderRepository } from '../../modules/order-engine/order.repository';
import { OrderService } from '../../modules/order-engine/order.service';
import type { RiskDecision } from '../../modules/risk-engine/domain/risk-decision';
import type { RiskPolicy } from '../../modules/risk-engine/domain/risk-policy';
import { RiskEventPublisher } from '../../modules/risk-engine/risk-event-publisher';
import type { RiskDomainEvent } from '../../modules/risk-engine/risk-events';
import type { RiskRepository } from '../../modules/risk-engine/risk.repository';
import { RiskService } from '../../modules/risk-engine/risk.service';

const T0 = '2026-07-20T16:00:00.000Z';

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

class MemoryOrderRepo implements OrderRepository {
  orders = new Map<string, Order>();
  fills: OrderFill[] = [];
  history: OrderHistory[] = [];
  async create(order: Order): Promise<Order> {
    this.orders.set(order.id, order);
    return order;
  }
  async save(order: Order): Promise<Order> {
    this.orders.set(order.id, order);
    return order;
  }
  async findById(id: string): Promise<Order | null> {
    return this.orders.get(id) ?? null;
  }
  async listByPortfolioId(portfolioId: string): Promise<Order[]> {
    return [...this.orders.values()].filter((o) => o.portfolioId === portfolioId);
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
    return this.fills.filter((f) => f.orderId === orderId);
  }
  async createHistory(entry: OrderHistory): Promise<OrderHistory> {
    this.history.push(entry);
    return entry;
  }
  async listHistoryByOrderId(orderId: string): Promise<OrderHistory[]> {
    return this.history.filter((h) => h.orderId === orderId);
  }
  async listHistoryByPortfolioId(portfolioId: string): Promise<OrderHistory[]> {
    const ids = new Set(
      [...this.orders.values()].filter((o) => o.portfolioId === portfolioId).map((o) => o.id),
    );
    return this.history.filter((h) => ids.has(h.orderId));
  }
  async appendEvent(_event: OrderDomainEvent, _eventId: string): Promise<void> {}
  async listEvents(): Promise<OrderDomainEvent[]> {
    return [];
  }
}

class MemoryRiskRepo implements RiskRepository {
  decisions = new Map<string, RiskDecision>();
  policies = new Map<string, RiskPolicy>();
  async createDecision(decision: RiskDecision): Promise<RiskDecision> {
    this.decisions.set(decision.id, decision);
    return decision;
  }
  async findDecisionById(id: string): Promise<RiskDecision | null> {
    return this.decisions.get(id) ?? null;
  }
  async listDecisionsByPortfolioId(portfolioId: string): Promise<RiskDecision[]> {
    return [...this.decisions.values()].filter((d) => d.portfolioId === portfolioId);
  }
  async listDecisionsByOrderId(orderId: string): Promise<RiskDecision[]> {
    return [...this.decisions.values()].filter((d) => d.orderId === orderId);
  }
  async createPolicy(policy: RiskPolicy): Promise<RiskPolicy> {
    this.policies.set(policy.id, policy);
    return policy;
  }
  async savePolicy(policy: RiskPolicy): Promise<RiskPolicy> {
    this.policies.set(policy.id, policy);
    return policy;
  }
  async findPolicyById(id: string): Promise<RiskPolicy | null> {
    return this.policies.get(id) ?? null;
  }
  async listPolicies(portfolioId: string | null): Promise<RiskPolicy[]> {
    return [...this.policies.values()].filter((p) =>
      portfolioId === null
        ? p.portfolioId === null
        : p.portfolioId === portfolioId || p.portfolioId === null,
    );
  }
  async appendEvent(_event: RiskDomainEvent, _eventId: string): Promise<void> {}
  async listEventsByDecisionId(): Promise<RiskDomainEvent[]> {
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
  const positionEvents = new PositionEventPublisher(positionRepo);
  const positionHistory = new PositionHistoryService(positionRepo);
  const positions = new PositionService(positionRepo, positionHistory, positionEvents, portfolios);
  positions.setClock({ now: () => new Date(T0), iso: () => T0 });

  const riskRepo = new MemoryRiskRepo();
  const riskEvents = new RiskEventPublisher(riskRepo);
  const risk = new RiskService(riskRepo, riskEvents, portfolios, positions);
  risk.setClock({ now: () => new Date(T0), iso: () => T0 });

  const orderRepo = new MemoryOrderRepo();
  const events = new OrderEventPublisher(orderRepo);
  const history = new OrderHistoryService(orderRepo, events);
  const fills = new OrderFillService(orderRepo);
  const execution = new OrderExecutionService(
    orderRepo,
    fills,
    history,
    events,
    positions,
    portfolios,
  );
  const service = new OrderService(orderRepo, history, events, fills, execution, portfolios, risk);
  service.setClock({ now: () => new Date(T0), iso: () => T0 });
  return { service, history, fills };
}

describe('US206 — Order API response schema contract', () => {
  it('matches OrderView schema for create and execute lifecycle', async () => {
    const { service, history, fills } = buildService();
    const created = await service.create('ws-contract', 'owner', {
      symbol: 'BTC-USD',
      side: 'BUY',
      type: 'LIMIT',
      quantity: '1.5',
      requestedPrice: '42000',
      timeInForce: 'GTC',
    });

    assertString(created.id, 'id');
    assertString(created.portfolioId, 'portfolioId');
    expect(created.positionId === null || typeof created.positionId === 'string').toBe(true);
    assertString(created.symbol, 'symbol');
    assertString(created.side, 'side');
    assertString(created.type, 'type');
    assertString(created.quantity, 'quantity');
    assertString(created.filledQuantity, 'filledQuantity');
    assertString(created.remainingQuantity, 'remainingQuantity');
    assertString(created.status, 'status');
    assertString(created.timeInForce, 'timeInForce');
    assertString(created.createdAt, 'createdAt');
    assertString(created.updatedAt, 'updatedAt');
    expect(created.requestedPrice).toBe('42000');
    expect(created.executedPrice).toBeNull();
    expect(created.executedAt).toBeNull();
    expect(created.cancelledAt).toBeNull();

    const filled = await service.execute('ws-contract', 'owner', created.id, {
      price: '42100',
    });
    assertString(filled.executedPrice!, 'executedPrice');
    assertString(filled.executedAt!, 'executedAt');
    assertString(filled.positionId!, 'positionId');
    expect(filled.status).toBe('FILLED');

    const historyEntries = await history.listByOrderId(created.id);
    expect(historyEntries.length).toBeGreaterThan(0);
    for (const entry of historyEntries) {
      assertString(entry.id, 'history.id');
      assertString(entry.orderId, 'history.orderId');
      assertString(entry.timestamp, 'history.timestamp');
      assertString(entry.previousStatus, 'history.previousStatus');
      assertString(entry.currentStatus, 'history.currentStatus');
      assertString(entry.reason, 'history.reason');
    }

    const fillEntries = await fills.listByOrderId(created.id);
    expect(fillEntries).toHaveLength(1);
    assertString(fillEntries[0].id, 'fill.id');
    assertString(fillEntries[0].quantity, 'fill.quantity');
    assertString(fillEntries[0].price, 'fill.price');
    assertString(fillEntries[0].fee, 'fill.fee');
  });
});
