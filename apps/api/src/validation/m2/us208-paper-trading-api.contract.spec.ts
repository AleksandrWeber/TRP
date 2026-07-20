/**
 * US208 — Paper Trading API response schema contract.
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
import type { PaperExecution } from '../../modules/paper-trading-engine/domain/paper-execution';
import type { PaperEventRecord } from '../../modules/paper-trading-engine/domain/paper-event';
import type { PaperSession } from '../../modules/paper-trading-engine/domain/paper-session';
import { PaperEventPublisher } from '../../modules/paper-trading-engine/paper-event-publisher';
import { PaperExecutionCoordinator } from '../../modules/paper-trading-engine/paper-execution-coordinator';
import { PaperSessionManager } from '../../modules/paper-trading-engine/paper-session-manager';
import type { PaperTradingDomainEvent } from '../../modules/paper-trading-engine/paper-trading-events';
import type { PaperTradingRepository } from '../../modules/paper-trading-engine/paper-trading.repository';
import { PaperTradingService } from '../../modules/paper-trading-engine/paper-trading.service';

const WS = 'ws-us208-contract';
const OWNER = 'owner-contract';
const T0 = '2026-07-20T17:00:00.000Z';

class MemoryPortfolioRepo implements PortfolioRepository {
  portfolios = new Map<string, Portfolio>();
  snapshots: PortfolioSnapshot[] = [];
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
  async findById(id: string): Promise<Portfolio | null> {
    return this.portfolios.get(id) ?? null;
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
  async findById(orderId: string): Promise<Order | null> {
    return this.orders.get(orderId) ?? null;
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
  async findDecisionById(decisionId: string): Promise<RiskDecision | null> {
    return this.decisions.get(decisionId) ?? null;
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
  async findPolicyById(policyId: string): Promise<RiskPolicy | null> {
    return this.policies.get(policyId) ?? null;
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

class MemoryPaperRepo implements PaperTradingRepository {
  sessions = new Map<string, PaperSession>();
  executions: PaperExecution[] = [];
  events: Array<{ id: string; event: PaperTradingDomainEvent }> = [];
  async createSession(session: PaperSession): Promise<PaperSession> {
    this.sessions.set(session.id, session);
    return session;
  }
  async saveSession(session: PaperSession): Promise<PaperSession> {
    this.sessions.set(session.id, session);
    return session;
  }
  async findSessionById(sessionId: string): Promise<PaperSession | null> {
    return this.sessions.get(sessionId) ?? null;
  }
  async listSessionsByWorkspaceId(workspaceId: string): Promise<PaperSession[]> {
    return [...this.sessions.values()].filter((s) => s.workspaceId === workspaceId);
  }
  async deleteSession(sessionId: string): Promise<void> {
    this.sessions.delete(sessionId);
  }
  async createExecution(execution: PaperExecution): Promise<PaperExecution> {
    this.executions.push(execution);
    return execution;
  }
  async listExecutionsBySessionId(sessionId: string): Promise<PaperExecution[]> {
    return this.executions.filter((e) => e.sessionId === sessionId);
  }
  async appendEvent(event: PaperTradingDomainEvent, eventId: string): Promise<void> {
    this.events.push({ id: eventId, event });
  }
  async listEventsBySessionId(sessionId: string): Promise<PaperEventRecord[]> {
    return this.events
      .filter((e) => e.event.sessionId === sessionId)
      .map((e) =>
        Object.freeze({
          id: e.id,
          sessionId: e.event.sessionId,
          type: e.event.eventType,
          timestamp: e.event.occurredAt,
          payload: Object.freeze({ ...e.event }),
        }),
      );
  }
}

function buildService(): PaperTradingService {
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
  const orderEvents = new OrderEventPublisher(orderRepo);
  const orderHistory = new OrderHistoryService(orderRepo, orderEvents);
  const fills = new OrderFillService(orderRepo);
  const execution = new OrderExecutionService(
    orderRepo,
    fills,
    orderHistory,
    orderEvents,
    positions,
    portfolios,
  );
  const orders = new OrderService(
    orderRepo,
    orderHistory,
    orderEvents,
    fills,
    execution,
    portfolios,
    risk,
  );
  orders.setClock({ now: () => new Date(T0), iso: () => T0 });

  const paperRepo = new MemoryPaperRepo();
  const paperEvents = new PaperEventPublisher(paperRepo);
  const sessions = new PaperSessionManager(paperRepo, paperEvents, portfolios);
  sessions.setClock({ now: () => new Date(T0), iso: () => T0 });
  const coordinator = new PaperExecutionCoordinator(
    paperRepo,
    sessions,
    paperEvents,
    orders,
    portfolios,
  );
  return new PaperTradingService(
    sessions,
    coordinator,
    paperEvents,
    paperRepo,
    orders,
    positions,
    portfolios,
  );
}

describe('US208 Paper Trading API contract', () => {
  it('returns PaperSessionView with required fields', async () => {
    const service = buildService();
    const session = await service.createSession(WS, OWNER, {
      name: 'Contract Session',
      initialBalance: '25000',
    });

    expect(session).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        name: 'Contract Session',
        status: 'CREATED',
        initialBalance: '25000',
        currentBalance: '25000',
        portfolioId: expect.any(String),
        createdAt: T0,
        startedAt: null,
        finishedAt: null,
      }),
    );
  });

  it('returns trade result with order and execution shapes', async () => {
    const service = buildService();
    const session = await service.createSession(WS, OWNER, { name: 'Trade Contract' });
    await service.startSession(WS, session.id);
    const result = await service.executeTrade(WS, OWNER, session.id, {
      symbol: 'ETH-USD',
      side: 'BUY',
      type: 'LIMIT',
      quantity: '2',
      requestedPrice: '50',
    });

    expect(result.order).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        symbol: 'ETH-USD',
        side: 'BUY',
        status: 'FILLED',
        executedPrice: '50',
      }),
    );
    expect(result.execution).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        sessionId: session.id,
        orderId: result.order.id,
        executionPrice: '50',
        slippage: '0',
        commission: '0',
      }),
    );

    const stats = await service.getStatistics(WS, OWNER, session.id);
    expect(stats).toEqual(
      expect.objectContaining({
        netPnL: expect.any(String),
        grossPnL: expect.any(String),
        winRate: expect.any(String),
        profitFactor: expect.any(String),
        maxDrawdown: expect.any(String),
        averageTrade: expect.any(String),
        sharpeRatio: expect.any(String),
        currentEquity: expect.any(String),
        tradeCount: expect.any(Number),
      }),
    );
  });
});
